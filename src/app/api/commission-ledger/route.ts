import {
  guarded,
  guardedShared,
  seesEverything,
  ownerIdOf,
  rows,
  limitOf,
  ADMIN_OR_MANAGER,
} from "@/lib/apiCollection"

/**
 * Connector commission owed and settled.
 *
 * A connector may see only their own rows; Admins and Managers see the whole ledger.
 * Settling a row is a money decision, so it is Admin/Manager only and guarded against
 * double-settlement server-side — losing Firestore's push updates means two managers
 * can now have the same row open without either seeing the other's change.
 */

export async function GET(request: Request) {
  // Shared: the payouts screen reads the whole ledger, a partner reads their own rows.
  return guardedShared(request, async ({ db, url, who }) => {
    const status = String(url.searchParams.get("status") || "").trim()
    let query = db.collection("commission_ledger")

    if (seesEverything(who)) {
      const requestedPartner = String(url.searchParams.get("partnerId") || "").trim()
      if (requestedPartner) query = query.where("partnerId", "==", requestedPartner)
    } else {
      // Pinned to the caller's own id, whatever they asked for.
      const own =
        ownerIdOf(who) ??
        (who.kind === "staff" ? who.caller.staffId || who.caller.uid : null)
      if (!own) return { entries: [] }
      query = query.where("partnerId", "==", own)
    }

    if (status) query = query.where("status", "==", status)

    const snap = await query.orderBy("createdAt", "desc").limit(limitOf(url, 200, 1000)).get()
    return { entries: rows(snap) }
  })
}

export async function POST(request: Request) {
  return guarded<{ entry?: Record<string, unknown> }>(
    request,
    ADMIN_OR_MANAGER,
    async ({ db, body }) => {
      const entry = body.entry || {}
      const leadId = String(entry.leadId || "").trim()
      if (!leadId) throw new Error("A leadId is required.")

      // Disbursal can be approved from more than one screen, so the write is keyed on
      // the lead rather than appended blindly — otherwise one file pays out twice.
      const existing = await db
        .collection("commission_ledger")
        .where("leadId", "==", leadId)
        .limit(1)
        .get()
      if (!existing.empty) return { id: existing.docs[0].id, alreadyExisted: true }

      const ref = await db.collection("commission_ledger").add({
        ...entry,
        amount: Number(entry.amount) || 0,
        status: String(entry.status || "pending"),
        createdAt: new Date(),
      })
      return { id: ref.id, alreadyExisted: false }
    }
  )
}

export async function PATCH(request: Request) {
  return guarded<{
    id?: string
    status?: string
    note?: string
    utrNumber?: string
    settlementRemarks?: string
  }>(
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

      // The settle form requires a UTR and the payouts table renders it, so it is
      // written rather than dropped.
      const settling = status === "settled"
      if (settling && !String(body.utrNumber || "").trim()) {
        throw new Error("A UTR number is required to settle a payout.")
      }

      await ref.update({
        status,
        note: String(body.note || ""),
        utrNumber: String(body.utrNumber || ""),
        settlementRemarks: String(body.settlementRemarks || ""),
        settledAt: settling ? new Date() : null,
        settledBy: settling ? caller.email || caller.uid : null,
        updatedAt: new Date(),
      })
      return { id, status }
    }
  )
}
