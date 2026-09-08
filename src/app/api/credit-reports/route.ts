import { guardedShared, seesEverything, ownerIdOf, rows, limitOf } from "@/lib/apiCollection"

/**
 * Previously pulled credit reports.
 *
 * `/api/partner/credit-check` runs a check and returns only the report it just created,
 * so the past-reports list on the credit-check screen had no route to read from. Reports
 * contain a consumer's credit data, so a partner sees only the ones they pulled.
 */

export async function GET(request: Request) {
  return guardedShared(request, async ({ db, url, who }) => {
    let query = db.collection("credit_reports")

    if (seesEverything(who)) {
      const partnerId = String(url.searchParams.get("partnerId") || "").trim()
      if (partnerId) query = query.where("partnerId", "==", partnerId)
    } else {
      const own = ownerIdOf(who)
      if (!own) return { reports: [] }
      query = query.where("partnerId", "==", own)
    }

    const snap = await query.orderBy("createdAt", "desc").limit(limitOf(url, 50, 200)).get()
    return { reports: rows(snap) }
  })
}
