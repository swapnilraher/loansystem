import { guarded, ANY_STAFF } from "@/lib/apiCollection"
import { serializeDoc } from "@/lib/serialize"

/**
 * One lead, by id.
 *
 * `/api/leads` is a paginated list and could not serve either of the things that kept
 * screens on Firestore: the chat sheet watching a single lead's `botMuted` flag, and the
 * activity logger syncing `lastActivity*` back onto the lead document.
 *
 * Next.js 16 hands route params as a promise, so `ctx.params` is awaited.
 */

export async function GET(request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params
  return guarded(request, ANY_STAFF, async ({ db }) => {
    const snap = await db.collection("leads").doc(id).get()
    if (!snap.exists) throw new Error("That lead no longer exists.")
    return { lead: serializeDoc({ ...(snap.data() as object), id: snap.id }) }
  })
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params
  return guarded<{ lead?: Record<string, unknown> }>(request, ANY_STAFF, async ({ db, body, caller }) => {
    const update = { ...(body.lead || {}) }

    // The id is part of the path, and letting it through would let a caller rewrite
    // which document they are editing.
    delete update.id
    delete update._id

    if (!Object.keys(update).length) throw new Error("Nothing to update.")

    await db.collection("leads").doc(id).update({
      ...update,
      updatedAt: new Date(),
      updatedBy: caller.email || caller.uid,
    })
    return { id }
  })
}
