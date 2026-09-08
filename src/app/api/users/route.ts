import { guarded, rows, limitOf, ANY_STAFF } from "@/lib/apiCollection"

/**
 * The staff directory, from `admin_users`.
 *
 * Every role reads it — lead assignment dropdowns, the activity timeline and the
 * "assigned to" labels all resolve names through it — so it is readable by any signed-in
 * staff member. Creating and editing staff stays on the existing admin routes; this is
 * the read side only.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url }) => {
    const role = String(url.searchParams.get("role") || "").trim()
    const status = String(url.searchParams.get("status") || "").trim()

    let query = db.collection("admin_users")
    if (role) query = query.where("role", "==", role)
    if (status) query = query.where("status", "==", status)

    const snap = await query.orderBy("name", "asc").limit(limitOf(url, 500, 1000)).get()
    return { users: rows(snap) }
  })
}
