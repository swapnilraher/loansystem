import { NextResponse } from "next/server"
import { requireStaffOrPartner } from "@/lib/apiAuth"
import { getAdminDb } from "@/lib/firebase-admin"
import { MongoFieldValue } from "@/lib/db/mongo-adapter"
import { serializeDoc, reviveDates } from "@/lib/serialize"

/**
 * The signed-in person's own record — theirs and only theirs.
 *
 * The admin profile screen, the partner profile screen and AuthContext all read the
 * caller's own document, and each had to reach into Firestore for it because no route
 * returned it. There is deliberately no id parameter: the document is chosen by the
 * verified token, so this cannot be turned into a way to read someone else's profile.
 *
 * Staff records live in `admin_users`, partner records in `users`.
 */

/**
 * Fields the owner may change.
 *
 * An allow-list rather than a deny-list, so a screen that echoes the whole profile
 * object back cannot quietly carry `role`, `status`, `dsaCode`, `dsaStatus`,
 * `permissions` or `walletBalance` with it and escalate itself.
 *
 * It has to cover everything the profile screens actually submit, though: the first
 * cut listed only a handful of fields, which silently rejected the entire
 * profile-completion step — every field a new customer entered fell outside it, the
 * route answered "Nothing to update", and the screen showed "Failed to save info."
 */
const STAFF_WRITABLE = new Set(["name", "phone", "photoURL", "notificationPrefs", "notifications"])

/** The DSA/partner and customer profile screens, plus the dashboard's own writes. */
const PORTAL_WRITABLE = new Set([
  "fullName",
  "name",
  "panName",
  "email",
  "mobile",
  "mobileNumber",
  "city",
  "address",
  "photoURL",
  "panNumber",
  "aadharNumber",
  "bankName",
  "accountHolder",
  "accountNumber",
  "ifscCode",
  "bankDetails",
  "employmentType",
  "income",
  "monthlyIncome",
  "notificationPrefs",
  // Written once by the dashboard when a customer first gets a referral code; the
  // balance and points seed alongside it and are server-owned after that.
  "referralCode",
  "walletBalance",
  "points",
  "docs",
])

export async function GET(request: Request) {
  const auth = await requireStaffOrPartner(request)
  if (!auth.ok) return auth.response

  try {
    const db = getAdminDb()

    if (auth.who.kind === "partner") {
      // docId, not partnerId: a legacy partner document lives under the mobile
      // number while owned rows are still keyed on the uid.
      const snap = await db.collection("users").doc(auth.who.partner.docId).get()
      return NextResponse.json({
        success: true,
        kind: "partner",
        profile: snap.exists ? serializeDoc({ ...(snap.data() as object), id: snap.id }) : null,
      })
    }

    const caller = auth.who.caller
    // staffId is absent for the super-admin fallback accounts, which are matched on email.
    let snap = caller.staffId ? await db.collection("admin_users").doc(caller.staffId).get() : null
    if (!snap?.exists && caller.email) {
      const byEmail = await db
        .collection("admin_users")
        .where("email", "==", caller.email)
        .limit(1)
        .get()
      snap = byEmail.empty ? null : byEmail.docs[0]
    }

    return NextResponse.json({
      success: true,
      kind: "staff",
      role: caller.role,
      profile: snap?.exists ? serializeDoc({ ...(snap.data() as object), id: snap.id }) : null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load your profile."
    console.error("[GET /api/profile]", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStaffOrPartner(request)
  if (!auth.ok) return auth.response

  try {
    const body = reviveDates(await request.json().catch(() => ({}))) as {
      profile?: Record<string, unknown>
    }
    const incoming = body.profile || {}

    const allowed = auth.who.kind === "partner" ? PORTAL_WRITABLE : STAFF_WRITABLE

    // Anything outside the allow-list is dropped rather than rejected, so a screen
    // that echoes back the whole profile object cannot escalate its own role.
    const update: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(incoming)) {
      if (allowed.has(key)) update[key] = value
    }
    if (!Object.keys(update).length) throw new Error("Nothing to update.")
    update.updatedAt = new Date()

    const db = getAdminDb()
    // Narrowed inline rather than through a boolean: a discriminated union only
    // narrows on the check itself.
    if (auth.who.kind === "partner") {
      const portal = auth.who.partner
      const docId = portal.docId

      // A first-time customer has no record yet — this merge is what creates it, so
      // the identity fields are stamped here. `role` is only defaulted, never
      // overwritten, so a partner's record cannot be demoted by their own save.
      const existing = await db.collection("users").doc(docId).get()
      if (!existing.exists) {
        update.uid = portal.uid
        update.role = portal.portalRole
        update.createdAt = new Date()
      }

      await db.collection("users").doc(docId).set(update, { merge: true })
      return NextResponse.json({ success: true, id: docId })
    }

    const caller = auth.who.caller
    let docId = caller.staffId
    if (!docId && caller.email) {
      const byEmail = await db
        .collection("admin_users")
        .where("email", "==", caller.email)
        .limit(1)
        .get()
      docId = byEmail.empty ? null : byEmail.docs[0].id
    }
    if (!docId) throw new Error("No staff record to update.")

    await db.collection("admin_users").doc(docId).set(update, { merge: true })
    return NextResponse.json({ success: true, id: docId })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save your profile."
    console.error("[PATCH /api/profile]", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * Registers a browser push token against the signed-in person.
 *
 * Separate from PATCH because it appends to an array rather than replacing a field:
 * one person signs in from several devices and each contributes a token, so a plain
 * write would drop every device but the last. This is the only caller of arrayUnion in
 * the project, and the reason the adapter needed it.
 */
export async function POST(request: Request) {
  const auth = await requireStaffOrPartner(request)
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json().catch(() => ({}))) as { fcmToken?: string }
    const token = String(body.fcmToken || "").trim()
    if (!token) throw new Error("A token is required.")

    const db = getAdminDb()
    const collection = auth.who.kind === "partner" ? "users" : "admin_users"
    const docId =
      auth.who.kind === "partner" ? auth.who.partner.docId : auth.who.caller.staffId

    if (!docId) throw new Error("No record to register this device against.")

    await db.collection(collection).doc(docId).update({
      fcmTokens: MongoFieldValue.arrayUnion(token),
      updatedAt: new Date(),
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not register this device."
    console.error("[POST /api/profile]", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
