import { guarded, rows, limitOf, ANY_STAFF, ADMIN_ONLY } from "@/lib/apiCollection"

/**
 * The staff directory (`admin_users`), and the portal customer list behind `?portal=true`.
 *
 * Every role reads the staff list — assignment dropdowns, activity timelines and
 * "assigned to" labels all resolve names through it — but only an Admin may create,
 * edit or remove an account, since a staff row carries the role that decides what its
 * owner can reach.
 *
 * The portal customer list is a different collection (`users`) and Admin-only: those
 * documents hold applicant contact details.
 */

export async function GET(request: Request) {
  const isPortal = new URL(request.url).searchParams.get("portal") === "true"

  return guarded(request, isPortal ? ADMIN_ONLY : ANY_STAFF, async ({ db, url }) => {
    if (isPortal) {
      const snap = await db
        .collection("users")
        .orderBy("createdAt", "desc")
        .limit(limitOf(url, 200, 1000))
        .get()
      return { users: rows(snap) }
    }

    const role = String(url.searchParams.get("role") || "").trim()
    const status = String(url.searchParams.get("status") || "").trim()
    const referredBy = String(url.searchParams.get("referredBy") || "").trim()

    // The dashboard's referral list is the one read of `users` a non-Admin makes, and
    // it is scoped to the caller's own referral code by the caller passing it.
    if (referredBy) {
      const snap = await db
        .collection("users")
        .where("referredBy", "==", referredBy)
        .limit(limitOf(url, 200, 500))
        .get()
      return { users: rows(snap) }
    }

    let query = db.collection("admin_users")
    if (role) query = query.where("role", "==", role)
    if (status) query = query.where("status", "==", status)

    const snap = await query.orderBy("name", "asc").limit(limitOf(url, 500, 1000)).get()
    return { users: rows(snap) }
  })
}

export async function POST(request: Request) {
  return guarded<{ user?: Record<string, unknown> }>(request, ADMIN_ONLY, async ({ db, body }) => {
    const user = body.user || {}
    const email = String(user.email || "").trim().toLowerCase()
    if (!email) throw new Error("An email address is required.")

    // Two rows for one email would make callerOf's lookup non-deterministic, and with
    // it the role the account resolves to.
    const clash = await db.collection("admin_users").where("email", "==", email).limit(1).get()
    if (!clash.empty) throw new Error("A staff account with that email already exists.")

    const ref = await db.collection("admin_users").add({
      ...user,
      email,
      status: String(user.status || "Active"),
      joinedAt: new Date(),
      createdAt: new Date(),
    })
    return { id: ref.id }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ id?: string; user?: Record<string, unknown> }>(
    request,
    ADMIN_ONLY,
    async ({ db, body }) => {
      const id = String(body.id || "").trim()
      if (!id) throw new Error("A user id is required.")

      const update = { ...(body.user || {}) }
      delete update.id
      delete update._id
      if (typeof update.email === "string") update.email = update.email.trim().toLowerCase()
      if (!Object.keys(update).length) throw new Error("Nothing to update.")

      await db.collection("admin_users").doc(id).update({ ...update, updatedAt: new Date() })
      return { id }
    }
  )
}

export async function DELETE(request: Request) {
  return guarded(request, ADMIN_ONLY, async ({ db, url, caller }) => {
    const id = String(url.searchParams.get("id") || "").trim()
    if (!id) throw new Error("A user id is required.")

    // Deleting your own account would lock you out mid-session, and the last Admin
    // deleting themselves would leave nobody able to administer anything.
    if (caller.staffId && caller.staffId === id) {
      throw new Error("You cannot delete your own account.")
    }

    await db.collection("admin_users").doc(id).delete()
    return { id }
  })
}
