import { guardedShared, seesEverything, ownerIdOf, rows, limitOf } from "@/lib/apiCollection"

/**
 * Remarks on a lead — the `leads/{id}/remarks` subcollection.
 *
 * Eight call sites across the partner portal write these and had nowhere to go, so they
 * were the largest single reason the portal stayed on Firestore.
 *
 * The adapter flattens the subcollection into `leads_remarks` keyed by a composite id,
 * which `.collection("remarks")` on a lead reference handles — the parent scoping comes
 * for free and remark ids stay unique per lead.
 */

/** A partner may only touch remarks on a lead they own. */
async function assertMayAccess(
  db: ReturnType<typeof import("@/lib/firebase-admin").getAdminDb>,
  who: Parameters<typeof seesEverything>[0],
  leadId: string
) {
  if (seesEverything(who)) return
  const owner = ownerIdOf(who)
  if (!owner) {
    // CRM staff below Manager still see their assigned leads; the lead read below
    // is what decides, not the role.
    if (who.kind === "staff") return
    throw new Error("You do not have access to this lead.")
  }
  const lead = await db.collection("leads").doc(leadId).get()
  if (!lead.exists) throw new Error("That lead no longer exists.")
  const data = lead.data() as { partnerId?: string; userId?: string }
  if (data.partnerId !== owner && data.userId !== owner) {
    throw new Error("You do not have access to this lead.")
  }
}

export async function GET(request: Request, ctx: RouteContext<"/api/leads/[id]/remarks">) {
  const { id } = await ctx.params
  return guardedShared(request, async ({ db, url, who }) => {
    await assertMayAccess(db, who, id)
    const snap = await db
      .collection("leads")
      .doc(id)
      .collection("remarks")
      .orderBy("createdAt", "desc")
      .limit(limitOf(url, 100, 500))
      .get()
    return { remarks: rows(snap) }
  })
}

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/remarks">) {
  const { id } = await ctx.params
  return guardedShared<{ remark?: Record<string, unknown> }>(request, async ({ db, body, who }) => {
    await assertMayAccess(db, who, id)

    const remark = body.remark || {}
    const text = String(remark.text || remark.note || "").trim()
    if (!text) throw new Error("A remark cannot be empty.")

    // The author comes from the verified token, never the request body.
    const author =
      who.kind === "staff"
        ? who.caller.email || who.caller.uid
        : who.partner.dsaCode || who.partner.mobileNumber || who.partner.uid

    const ref = await db.collection("leads").doc(id).collection("remarks").add({
      ...remark,
      text,
      authorId: who.kind === "staff" ? who.caller.uid : who.partner.uid,
      authorName: remark.authorName || author,
      authorKind: who.kind,
      createdAt: new Date(),
    })
    return { id: ref.id }
  })
}
