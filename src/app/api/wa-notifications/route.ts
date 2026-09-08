import { guarded, rows, limitOf, sinceOf, ANY_STAFF } from "@/lib/apiCollection"

/**
 * The inbound-WhatsApp notification bell.
 *
 * One of the few genuinely realtime surfaces, so this supports a `since` delta poll:
 * the client sends the newest timestamp it holds and gets back only what arrived
 * after it, keeping a few-second poll to a near-empty response.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url }) => {
    const since = sinceOf(url)
    const unreadOnly = url.searchParams.get("unread") === "true"

    let query = db.collection("wa_notifications")
    if (since) query = query.where("createdAt", ">", since)
    if (unreadOnly) query = query.where("read", "==", false)

    const snap = await query.orderBy("createdAt", "desc").limit(limitOf(url, 50, 200)).get()
    const notifications = rows(snap)

    // The unread badge counts the whole collection, not just this page, or it would
    // cap at the page size and stop rising.
    const unreadSnap = await db.collection("wa_notifications").where("read", "==", false).get()

    return { notifications, unreadCount: unreadSnap.size }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ ids?: string[]; markAllRead?: boolean }>(
    request,
    ANY_STAFF,
    async ({ db, body }) => {
      if (body.markAllRead) {
        const snap = await db.collection("wa_notifications").where("read", "==", false).get()
        const batch = db.batch()
        for (const doc of snap.docs) batch.update(doc.ref, { read: true, readAt: new Date() })
        await batch.commit()
        return { updated: snap.size }
      }

      const ids = (body.ids || []).map(String).filter(Boolean)
      if (!ids.length) throw new Error("Nothing to mark read.")

      const batch = db.batch()
      for (const id of ids) {
        batch.update(db.collection("wa_notifications").doc(id), { read: true, readAt: new Date() })
      }
      await batch.commit()
      return { updated: ids.length }
    }
  )
}
