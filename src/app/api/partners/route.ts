import { guarded, rows, limitOf, ADMIN_OR_MANAGER, ADMIN_ONLY } from "@/lib/apiCollection"

/**
 * Partner (DSA / connector) records, from `users` where role is "partner".
 *
 * `/api/admin/partner-applications` exists but answers with a reduced shape built for
 * the approvals screen — no kycData, panData, bankDetails or agreementData — so it
 * cannot back the partner list. This returns the whole document.
 *
 * Admin and Manager only: these documents carry PAN, bank details and KYC data, which a
 * Telecaller has no reason to read.
 */

export async function GET(request: Request) {
  return guarded(request, ADMIN_OR_MANAGER, async ({ db, url }) => {
    const status = String(url.searchParams.get("status") || "").trim()

    let query = db.collection("users").where("role", "==", "partner")
    if (status) query = query.where("status", "==", status)

    const snap = await query.limit(limitOf(url, 500, 1000)).get()
    // Sorted here rather than in the query: `role` already carries the index, and
    // adding an orderBy on a second field would need a compound one for no benefit
    // at this collection's size.
    const partners = rows(snap).sort((a: any, b: any) =>
      String(a.fullName || a.name || "").localeCompare(String(b.fullName || b.name || ""))
    )
    return { partners }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ id?: string; partner?: Record<string, unknown> }>(
    request,
    ADMIN_ONLY,
    async ({ db, body, caller }) => {
      const id = String(body.id || "").trim()
      if (!id) throw new Error("A partner id is required.")

      const update = { ...(body.partner || {}) }
      delete update.id
      delete update._id
      // The role is what makes this document a partner at all; letting it through
      // would let an edit screen turn a partner into something else.
      delete update.role
      delete update.uid
      if (!Object.keys(update).length) throw new Error("Nothing to update.")

      await db.collection("users").doc(id).update({
        ...update,
        updatedAt: new Date(),
        updatedBy: caller.email || caller.uid,
      })
      return { id }
    }
  )
}
