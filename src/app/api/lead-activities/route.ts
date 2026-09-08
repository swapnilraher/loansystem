import { guarded, rows, limitOf, ANY_STAFF } from "@/lib/apiCollection"

/**
 * The activity timeline.
 *
 * This collection is the largest in the CRM (2,253 rows and growing, one per status
 * change), and three screens previously subscribed to ALL of it and filtered in the
 * browser. Firestore's incremental streaming hid the cost; a poll would re-download
 * the collection every cycle, so the filtering and the counting both happen here and
 * a limit is always applied.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url }) => {
    const leadId = String(url.searchParams.get("leadId") || "").trim()
    const staffId = String(url.searchParams.get("staffId") || "").trim()
    const limit = limitOf(url, 50, 500)

    let query = db.collection("lead_activities")
    if (leadId) query = query.where("leadId", "==", leadId)
    if (staffId) query = query.where("staffId", "==", staffId)

    const snap = await query.orderBy("timestamp", "desc").limit(limit).get()
    return { activities: rows(snap) }
  })
}

export async function POST(request: Request) {
  return guarded<{ activity?: Record<string, unknown> }>(
    request,
    ANY_STAFF,
    async ({ db, body, caller }) => {
      const activity = body.activity || {}
      const ref = await db.collection("lead_activities").add({
        ...activity,
        // The actor is taken from the verified token, never from the request body —
        // otherwise any signed-in user could write an entry attributed to someone else.
        staffId: caller.staffId || caller.uid,
        staffName: activity.staffName || caller.email || "Staff",
        timestamp: new Date(),
      })
      return { id: ref.id }
    }
  )
}
