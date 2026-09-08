import { guarded, rows, limitOf, ANY_STAFF } from "@/lib/apiCollection"

/**
 * Bot conversation state, keyed by phone number.
 *
 * The inbox reads these to label a thread with the contact's name, their loan category
 * and which step of the bot flow they are on. Read-only from the browser — the sessions
 * themselves are written by the WhatsApp webhook.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db, url }) => {
    const phone = String(url.searchParams.get("phone") || "").trim()

    if (phone) {
      // Sessions use the phone number as the document id.
      const snap = await db.collection("waSession").doc(phone).get()
      return { session: snap.exists ? { ...(snap.data() as object), id: snap.id } : null }
    }

    const snap = await db.collection("waSession").limit(limitOf(url, 100, 500)).get()
    return { sessions: rows(snap) }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ phone?: string; session?: Record<string, unknown> }>(
    request,
    ANY_STAFF,
    async ({ db, body }) => {
      const phone = String(body.phone || "").trim()
      if (!phone) throw new Error("A phone number is required.")

      const update = { ...(body.session || {}) }
      delete update.id
      delete update._id
      if (!Object.keys(update).length) throw new Error("Nothing to update.")

      // merge, because the webhook owns the rest of the session document and a
      // rename from the CRM must not clear the bot's own state.
      await db.collection("waSession").doc(phone).set({ ...update, updatedAt: new Date() }, { merge: true })
      return { phone }
    }
  )
}
