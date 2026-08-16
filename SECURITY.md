# Database security

The Firestore database had **no security rules**. Anyone who opened the site,
read the Firebase config out of the JavaScript bundle and pointed a client at the
project could read and write every collection: customer phone numbers, PAN names,
incomes and CIBIL scores, the whole lead pipeline, and the `admin_users`
collection — which stores staff passwords in plaintext.

This directory now contains rules that close that. They are **not deployed**;
deploying them is a manual step, and the order matters.

## What is in place

| File | What it does |
| --- | --- |
| `firestore.rules` | Default-deny. Every collection is named explicitly and gated by role. |
| `storage.rules` | `documents/` (customer KYC uploads) restricted to CRM staff. |
| `firebase.json` | Points the Firebase CLI at both rule files. |
| `src/app/api/auth/claims/route.ts` | Mirrors the staff member's CRM role onto their Auth token, so rules have a role to check. |
| `src/lib/firestore-rest.ts` | Signs the server's Firestore REST calls with the service account. |

### Why the custom claim exists

Firestore rules cannot run a query. This CRM identifies staff by **email** in
`admin_users`, not by document id, so a rule cannot look anybody up. The claims
route does that lookup server-side after verifying the caller's ID token, and
writes `{ crm, crmRole, staffId }` onto the token. Rules trust nothing else.

`AuthContext` calls it on every sign-in *and* on every restored session, so
tokens heal themselves on the next page load. Nobody has to be re-invited.

### Why the server routes changed

`/api/leads`, `/api/flows` and the WhatsApp webhook wrote to Firestore over the
REST API using only the public web API key — which is not a credential. Those
calls worked *because* the database was open, and would have started failing the
moment rules were deployed. They now go through `firestoreFetch`, which attaches
a service-account bearer token, so they keep working and are properly
authenticated for the first time.

## Deploying — in this order

1. **Ship the app first.** The rules depend on the `crm` claim, which only exists
   once the new `AuthContext` and `/api/auth/claims` are live.
   ```
   npm run build && <your normal deploy>
   ```
2. **Sign in once** as an Admin and confirm the CRM still works. This proves the
   claims route is reachable in production.
3. **Test the rules before they bind.** Firebase Console → Firestore → Rules →
   Playground. Check at least: a signed-out read of `leads` (deny), a telecaller
   read of `admin_users` (deny), an Admin read of `admin_users` (allow).
4. **Deploy the rules.**
   ```
   npx firebase-tools deploy --only firestore:rules,storage --project dsa-loan
   ```
5. **Watch for a few minutes.** Firebase Console → Firestore → Usage shows denied
   requests. Rolling back is `firebase deploy` of the previous rules, or pasting
   the old rules back in the console — the console keeps a version history.

## What these rules deliberately do NOT do

**Telecallers can still read every lead document.** The CRM subscribes to the
whole `leads` collection and filters in memory (`canSeeLead`). A rule can only
allow or deny a query whole — it cannot filter one. Scoping this server-side
means rewriting `useLeads` to run two constrained listeners (own leads, and
unassigned) and merge them. Worth doing; it is a separate piece of work.

## Still open — rules cannot fix these

1. **Staff passwords are stored in plaintext** in `admin_users.password`, and the
   login flow (`/api/auth/sync-password`) treats that field as the source of
   truth. Anyone who can read the collection can sign in as anybody. Firebase
   Auth already holds the real password; the field should be deleted and the
   sync flow replaced with a password-reset link.
2. **`whatsapp-API.env` is committed to the repository** and contains live
   tokens. Rotate them in Meta, then untrack the file:
   ```
   git rm --cached whatsapp-API.env
   ```
   Note `.gitignore` already covers `.env*` — it does not apply to files that are
   already tracked. Removing it from the working tree does not remove it from
   git history; rotating the tokens is the part that matters.
3. **The WhatsApp access token is hardcoded** in `src/lib/whatsappConfig.ts` and
   the Firebase web API key in three API routes. The web API key is public by
   design and is fine; the WhatsApp token is not.
