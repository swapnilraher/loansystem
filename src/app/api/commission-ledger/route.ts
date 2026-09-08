import { guarded, rows, limitOf, ANY_STAFF, ADMIN_OR_MANAGER } from "@/lib/apiCollection"

/**
 * Connector commission owed and settled.
 *
 * A connector may see only their own rows; Admins and Managers see the whole ledger.
 * Settling a row is a money decision, so it is Admin/Manager only and guarded against
 * double-settlement server-side — losing Firestore's push updates means two managers
 * can now have the same row open without either seeing the other's change.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url, caller }) => {
    const isPrivileged = caller.role === "Admin" || caller.role === "Manager"
    const requestedPartner = String(url.searchParams.get("partnerId") || "").trim()
    const status = String(url.searchParams.get("status") || "").trim()

    let query = db.collection("commission_ledger")

    if (isPrivileged) {
      if (requestedPartner) query = query.where("partnerId", "==", requestedPartner)
    } else {
      // Pinned to the caller, whatever they asked for.
      const own = caller.staffId || caller.uid
      if (!own) return { entries: [] }
      query = query.where("partnerId", "==", own)
    }

    if (status) query = query.where("status", "==", status)

    const snap = await query.orderBy("createdAt", "desc").limit(limitOf(url, 200, 1000)).get()
    return { entries: rows(snap) }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ id?: string; status?: string; note?: string }>(
    request,
    ADMIN_OR_MANAGER,
    async ({ db, body, caller }) => {
      const id = String(body.id || "").trim()
      if (!id) throw new Error("A ledger entry id is required.")

      const status = String(body.status || "").trim()
      if (!status) throw new Error("A status is required.")

      const ref = db.collection("commission_ledger").doc(id)
      const current = await ref.get()
      if (!current.exists) throw new Error("That ledger entry no longer exists.")

      // Without push updates two people can hold a stale view of the same row, so
      // the transition is checked here rather than relying on the UI to disable itself.
      const existing = (current.data() as { status?: string }) || {}
      if (existing.status === "settled" && status === "settled") {
        throw new Error("That entry has already been settled.")
      }

      await ref.update({
        status,
        note: String(body.note || ""),
        settledAt: status === "settled" ? new Date() : null,
        settledBy: status === "settled" ? caller.email || caller.uid : null,
        updatedAt: new Date(),
      })
      return { id, status }
    }
  )
}
