import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { getAdminDb } from "@/lib/firebase-admin"
import { CAMPAIGNS, RECIPIENTS, type CampaignDoc } from "@/lib/waCampaigns"

/**
 * One campaign: its stored summary, and its per-recipient log.
 *
 * Reads Firestore and nothing else. No WhatsApp call happens here, which is the
 * point — opening a report must not fire a burst of API traffic just because
 * someone clicked into it. Bringing the numbers up to date is an explicit
 * action, and it lives in `./refresh`.
 *
 * `?view=progress` returns just the summary, for the live progress bar while a
 * campaign is sending: one document read per poll.
 */

const toIso = (value: unknown): string | null => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const stamp = value as { toDate?: () => Date }
  return typeof stamp.toDate === "function" ? stamp.toDate().toISOString() : null
}

function slotOf(raw: unknown) {
  const slot = (raw || {}) as Record<string, unknown>
  return {
    status: String(slot.status || "pending"),
    messageId: String(slot.messageId || ""),
    error: String(slot.error || ""),
    sentAt: toIso(slot.sentAt),
    deliveredAt: toIso(slot.deliveredAt),
    readAt: toIso(slot.readAt),
    failedAt: toIso(slot.failedAt),
  }
}

function summaryOf(id: string, data: CampaignDoc) {
  return {
    id,
    name: data.name || "Untitled campaign",
    status: data.status || "queued",
    createdAt: toIso(data.createdAt),
    finishedAt: toIso(data.finishedAt),
    createdByName: data.createdByName || "",
    mobileColumn: data.mobileColumn || "",
    nameColumn: data.nameColumn || "",
    message1: data.message1,
    message2: data.message2,
    totalRecipients: data.totalRecipients || 0,
    totalMessages: data.totalMessages || 0,
    processed: data.processed || 0,
    invalidCount: data.invalidCount || 0,
    counts: data.counts || { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 },
    lastError: data.lastError || "",
    refreshedAt: toIso((data as unknown as { refreshedAt?: unknown }).refreshedAt),
  }
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params

  try {
    const db = getAdminDb()
    const snapshot = await db.collection(CAMPAIGNS).doc(id).get()
    if (!snapshot.exists) {
      return NextResponse.json({ success: false, error: "Campaign not found." }, { status: 404 })
    }

    const campaign = summaryOf(snapshot.id, snapshot.data() as CampaignDoc)

    const url = new URL(request.url)
    if (url.searchParams.get("view") === "progress") {
      return NextResponse.json({ success: true, campaign })
    }

    const limit = Math.min(Number(url.searchParams.get("limit")) || 500, 1000)
    const after = Number(url.searchParams.get("after"))

    let query = db
      .collection(CAMPAIGNS)
      .doc(id)
      .collection(RECIPIENTS)
      .orderBy("index")
      .limit(limit)
    if (Number.isFinite(after)) query = query.startAfter(after)

    const page = await query.get()
    const recipients = page.docs.map(doc => {
      const data = doc.data() as Record<string, unknown>
      return {
        id: doc.id,
        index: Number(data.index) || 0,
        row: Number(data.row) || 0,
        phone: String(data.phone || ""),
        name: String(data.name || ""),
        done: data.done === true,
        m1: slotOf(data.m1),
        m2: slotOf(data.m2),
      }
    })

    return NextResponse.json({
      success: true,
      campaign,
      recipients,
      nextAfter: recipients.length === limit ? recipients[recipients.length - 1].index : null,
    })
  } catch (error: unknown) {
    console.error(`[wa-campaigns/${id}] Report read failed:`, error)
    return NextResponse.json(
      { success: false, error: "Could not load the campaign report." },
      { status: 500 }
    )
  }
}

/** Cancel: the worker checks this between batches, so it stops within one batch. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params

  try {
    const body = await request.json().catch(() => ({}))
    if (body?.action !== "cancel") {
      return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 })
    }

    await getAdminDb()
      .collection(CAMPAIGNS)
      .doc(id)
      .update({ status: "cancelled", finishedAt: new Date() })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error(`[wa-campaigns/${id}] Cancel failed:`, error)
    return NextResponse.json({ success: false, error: "Could not cancel." }, { status: 500 })
  }
}
