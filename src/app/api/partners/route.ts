import { guarded, rows, limitOf, ADMIN_OR_MANAGER } from "@/lib/apiCollection"

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
