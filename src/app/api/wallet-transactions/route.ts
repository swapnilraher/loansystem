import { guardedShared, seesEverything, ownerIdOf, rows, limitOf } from "@/lib/apiCollection"

/**
 * Wallet top-ups and debits.
 *
 * Read by the partner wallet screen for their own history, and by Admins and Managers
 * across all partners. The rows are written by the Razorpay verify-payment route, so
 * this is read-only.
 */

export async function GET(request: Request) {
  return guardedShared(request, async ({ db, url, who }) => {
    let query = db.collection("wallet_transactions")

    if (seesEverything(who)) {
      const partnerId = String(url.searchParams.get("partnerId") || "").trim()
      if (partnerId) query = query.where("partnerId", "==", partnerId)
    } else {
      const own = ownerIdOf(who)
      if (!own) return { transactions: [] }
      query = query.where("partnerId", "==", own)
    }

    const snap = await query.orderBy("createdAt", "desc").limit(limitOf(url, 100, 500)).get()
    return { transactions: rows(snap) }
  })
}
