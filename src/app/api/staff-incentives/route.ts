import { guarded, rows, limitOf, ANY_STAFF, ADMIN_OR_MANAGER } from "@/lib/apiCollection"

/**
 * Credited staff incentives, written when a Manager approves a disbursal.
 *
 * Scoping is enforced here rather than trusted from the caller: a Telecaller may only
 * read their own rows, whatever `staffId` they ask for. The client used to pass its own
 * id list and Firestore rules were the only thing stopping it from asking for the whole
 * team's earnings.
 *
 * The id list exists because `staffId` copies `leads.assignedTo`, which holds either an
 * `admin_users` document id or a Firebase Auth uid — matching on one shape alone loses
 * a person's own rows.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url, caller }) => {
    const requested = String(url.searchParams.get("staffIds") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)

    const isPrivileged = caller.role === "Admin" || caller.role === "Manager"
    const ownIds = [caller.staffId, caller.uid].filter(Boolean) as string[]

    // A Telecaller is pinned to their own ids no matter what they asked for.
    const staffIds = isPrivileged ? requested : ownIds

    let query = db.collection("staff_incentives")
    if (staffIds.length === 1) {
      query = query.where("staffId", "==", staffIds[0])
    } else if (staffIds.length > 1) {
      query = query.where("staffId", "in", staffIds)
    } else if (!isPrivileged) {
      // Signed in but with no resolvable identity yet — no rows rather than all rows.
      return { incentives: [] }
    }

    const snap = await query.orderBy("createdAt", "desc").limit(limitOf(url, 200, 1000)).get()
    return { incentives: rows(snap) }
  })
}

export async function POST(request: Request) {
  return guarded<{ incentive?: Record<string, unknown> }>(
    request,
    ADMIN_OR_MANAGER,
    async ({ db, body }) => {
      const incentive = body.incentive || {}
      const ref = await db.collection("staff_incentives").add({
        ...incentive,
        incentiveAmount: Number(incentive.incentiveAmount) || 0,
        createdAt: new Date(),
      })
      return { id: ref.id }
    }
  )
}
