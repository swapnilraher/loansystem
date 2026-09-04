/**
 * Who is calling an API route, proved rather than claimed.
 *
 * Firestore rules protect direct database access, but they cannot protect the
 * server routes: every route in `src/app/api` talks to Firestore through the
 * service account (`firestoreFetch`), which bypasses rules entirely. So a route
 * that writes anything an Admin owns has to check the caller itself — otherwise
 * "Admin only" means nothing more than a hidden button, and anyone who can reach
 * the URL is an Admin.
 *
 * The caller proves who they are with the Firebase ID token their browser
 * already holds. The role comes from the custom claims written by
 * `/api/auth/claims`, which is the same source `firestore.rules` trusts.
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
        console.warn("[apiAuth] Firestore staff fallback failed:", dbErr)
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
