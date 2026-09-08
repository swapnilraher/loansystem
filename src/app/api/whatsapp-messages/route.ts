import { guarded, rows, limitOf, sinceOf, ANY_STAFF } from "@/lib/apiCollection"

/**
 * The WhatsApp message store, as a list.
 *
 * `/api/whatsapp` only sends messages; nothing exposed this collection for reading, so
 * the inbox, the chat sheet and the latest-message hook all stayed on Firestore.
 *
 * This is the busiest collection in the project (5,968 rows), and the surfaces reading
 * it poll every few seconds, so a limit is always applied and `since` returns only what
 * arrived after the caller's newest message — a steady-state poll costs almost nothing.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url }) => {
    const phone = String(url.searchParams.get("phone") || "").trim()
    const leadId = String(url.searchParams.get("leadId") || "").trim()
    const since = sinceOf(url)
    const limit = limitOf(url, 50, 500)

    let query = db.collection("whatsapp_messages")
    if (phone) query = query.where("phone", "==", phone)
    if (leadId) query = query.where("leadId", "==", leadId)
    if (since) query = query.where("timestamp", ">", since)

    // Newest-first here so the limit keeps the most recent messages; the chat views
    // reverse it for display, exactly as they did with the Firestore listener.
    const snap = await query.orderBy("timestamp", "desc").limit(limit).get()
    return { messages: rows(snap) }
  })
}
