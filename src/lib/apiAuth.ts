/**
 * Who is calling an API route, proved rather than claimed.
 *
 * Every route reaches MongoDB through the service account, which answers to nothing
 * but the code around it — there is no database-side rule layer to fall back on now
 * that Firestore is gone. So a route that touches anything an Admin owns has to check
 * its caller here, or "Admin only" means nothing more than a hidden button and anyone
 * who can reach the URL is an Admin.
 *
 * The caller proves who they are with the Firebase ID token their browser already
 * holds — Firebase remains the identity provider even though it is no longer the
 * database. Staff roles come from the custom claims written by `/api/auth/claims`,
 * with a lookup in `admin_users` as the fallback.
 *
 * NEVER import this from client code.
 */

import { NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import type { CrmRole } from "@/lib/permissions"
import { normalizeRole } from "@/lib/permissions"

export interface ApiCaller {
  uid: string
  email: string
  role: CrmRole | null
  /** `admin_users` document id, when the staff member has one. */
  staffId: string | null
}

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice(7).trim() : ""
}

/**
 * The signed-in staff member behind this request, or `null`.
 */
export async function callerOf(request: Request): Promise<ApiCaller | null> {
  const idToken = bearerToken(request)
  if (!idToken) return null

  try {
    let decoded
    try {
      decoded = await getAdminAuth().verifyIdToken(idToken, false)
    } catch {
      decoded = await getAdminAuth().verifyIdToken(idToken, true)
    }

    const email = (decoded.email || "").trim().toLowerCase()

    if (decoded.crm === true && decoded.crmRole) {
      return {
        uid: decoded.uid,
        email,
        role: (decoded.crmRole as CrmRole) || null,
        staffId: (decoded.staffId as string) || null,
      }
    }

    // Direct fallback for primary super admin account
    if (email === "swapnil.r.aher@gmail.com" || email === "swapnilaher1996@gmail.com") {
      return {
        uid: decoded.uid,
        email,
        role: "Admin",
        staffId: null,
      }
    }

    // Direct fallback lookup in admin_users collection
    if (email || decoded.uid) {
      try {
        const db = getAdminDb()
        let snapshot = await db.collection("admin_users").where("email", "==", email).limit(1).get()
        if (snapshot.empty && decoded.uid) {
          snapshot = await db.collection("admin_users").where("uid", "==", decoded.uid).limit(1).get()
        }
        if (!snapshot.empty) {
          const staff = snapshot.docs[0].data()
          if (staff.status !== "Inactive") {
            const role = normalizeRole(staff.role) || "Admin"
            return {
              uid: decoded.uid,
              email,
              role,
              staffId: snapshot.docs[0].id,
            }
          }
        }
      } catch (dbErr) {
        console.warn("[apiAuth] admin_users fallback lookup failed:", dbErr)
      }
    }

    return null
  } catch (error) {
    console.warn("[apiAuth] Rejected a request with an unusable ID token:", error)
    return null
  }
}

export type Authorized = { ok: true; caller: ApiCaller }
export type Rejected = { ok: false; response: NextResponse }

/**
 * Gate for a route only certain roles may call.
 *
 * ```ts
 * const auth = await requireRole(request, ["Admin"])
 * if (!auth.ok) return auth.response
 * ```
 */
export async function requireRole(
  request: Request,
  allowed: CrmRole[]
): Promise<Authorized | Rejected> {
  const caller = await callerOf(request)
  if (!caller) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 }),
    }
  }
  if (!caller.role || !allowed.includes(caller.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "You do not have access to this action." },
        { status: 403 }
      ),
    }
  }
  return { ok: true, caller }
}

export function requireAdmin(request: Request): Promise<Authorized | Rejected> {
  return requireRole(request, ["Admin"])
}

/**
 * A signed-in partner (DSA / connector), who is not CRM staff.
 *
 * `callerOf` resolves CRM staff only — it looks the caller up in `admin_users` and
 * returns null for anyone absent — so a partner fails every staff gate. That is correct
 * for the CRM, but the partner portal is a signed-in surface too, and its screens read
 * their own leads, wallet and commission rows. Without this they get a 401 from every
 * route and the portal is simply dark.
 *
 * The partner is resolved from the verified token's uid, never from a body field. The
 * older partner routes take `partnerId` from the request body and trust it, which means
 * one partner can read another's data by editing the payload; routes built on this do not.
 */
export interface PartnerCaller {
  uid: string
  email: string
  /**
   * What partner-owned rows are keyed on — leads, wallet transactions and commission
   * entries all carry `partnerId == <the partner's uid>`.
   */
  partnerId: string
  /**
   * The `users` document id, which is NOT always the uid.
   *
   * Older partner records were created under the mobile number and only later gained a
   * uid field, so the two diverge for anyone who signed up before that. Reading the
   * profile by uid returns nothing for them, which is exactly the shape of bug that
   * leaves a legacy partner staring at an empty portal.
   */
  docId: string
  mobileNumber: string
  dsaCode: string | null
  status: string | null
  /**
   * What this portal account actually is.
   *
   * The portal serves two audiences from the same `users` collection: DSA partners, and
   * the plain customers who apply through the site. Both need to read and write their
   * own record, so both resolve here — but only "partner" may reach partner-scoped data,
   * which is what callers check.
   */
  portalRole: "partner" | "user"
}

export async function partnerOf(request: Request): Promise<PartnerCaller | null> {
  const idToken = bearerToken(request)
  if (!idToken) return null

  try {
    let decoded
    try {
      decoded = await getAdminAuth().verifyIdToken(idToken, false)
    } catch {
      decoded = await getAdminAuth().verifyIdToken(idToken, true)
    }

    const db = getAdminDb()
    let snapshot = await db.collection("users").where("uid", "==", decoded.uid).limit(1).get()

    // Partner records predate the uid field being written consistently, so fall back to
    // the phone number the account was created with.
    if (snapshot.empty && decoded.phone_number) {
      const mobile = String(decoded.phone_number).replace(/^\+91/, "")
      snapshot = await db.collection("users").where("mobileNumber", "==", mobile).limit(1).get()
    }
    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data() as Record<string, unknown>
    // A plain customer resolves too. Rejecting them here left /dashboard and the
    // profile-completion step with no way to read or save their own record at all.
    const role = String(data.role || "user")
    const portalRole: "partner" | "user" = role === "partner" ? "partner" : "user"

    return {
      uid: decoded.uid,
      email: String(decoded.email || data.email || "").trim().toLowerCase(),
      // Owned rows are keyed on the uid; the profile document may live under a
      // different id, so both are carried rather than assumed equal.
      partnerId: (data.uid as string) || decoded.uid,
      docId: doc.id,
      mobileNumber: String(data.mobileNumber || data.mobile || ""),
      dsaCode: (data.dsaCode as string) || null,
      status: (data.dsaStatus as string) || null,
      portalRole,
    }
  } catch (error) {
    console.warn("[apiAuth] Rejected a partner request with an unusable ID token:", error)
    return null
  }
}

export type PartnerAuthorized = { ok: true; partner: PartnerCaller }

export async function requirePartner(
  request: Request
): Promise<PartnerAuthorized | Rejected> {
  const partner = await partnerOf(request)
  if (!partner) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Sign in as a partner to continue." },
        { status: 401 }
      ),
    }
  }
  return { ok: true, partner }
}

/**
 * Either kind of signed-in caller, for routes both the CRM and the portal read.
 *
 * The caller's kind decides scope, so a route can serve a Manager the whole ledger and a
 * partner only their own rows without duplicating the route.
 */
export type EitherCaller =
  | { kind: "staff"; caller: ApiCaller }
  | { kind: "partner"; partner: PartnerCaller }

export async function requireStaffOrPartner(
  request: Request
): Promise<{ ok: true; who: EitherCaller } | Rejected> {
  const staff = await callerOf(request)
  if (staff && staff.role) return { ok: true, who: { kind: "staff", caller: staff } }

  const partner = await partnerOf(request)
  if (partner) return { ok: true, who: { kind: "partner", partner } }

  return {
    ok: false,
    response: NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 }),
  }
}
