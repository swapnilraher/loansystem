import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { getAdminDb } from "@/lib/firebase-admin"
import {
  CAMPAIGNS,
  createCampaign,
  messageProblem,
  sanitizeMessage,
  scheduleCampaignRun,
  type CampaignDoc,
} from "@/lib/waCampaigns"
import { normalizePhone, type CampaignRecipient } from "@/lib/waCampaignShared"

/**
 * Campaign history (GET) and campaign creation (POST).
 *
 * The POST answers as soon as the recipients are on disk; the actual sending
 * runs in the background worker, because a few thousand WhatsApp calls cannot
 * happen inside a request the browser is waiting on.
 */

export const maxDuration = 60

const toIso = (value: unknown): string => {
  if (!value) return ""
  if (value instanceof Date) return value.toISOString()
  const stamp = value as { toDate?: () => Date }
  return typeof stamp.toDate === "function" ? stamp.toDate().toISOString() : ""
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    let snapshot
    try {
      snapshot = await getAdminDb()
        .collection(CAMPAIGNS)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get()
    } catch (queryErr) {
      console.warn("[wa-campaigns] OrderBy failed, falling back to unordered get:", queryErr)
      snapshot = await getAdminDb()
        .collection(CAMPAIGNS)
        .limit(100)
        .get()
    }

    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data() as CampaignDoc
      return {
        id: doc.id,
        name: data.name || "Untitled campaign",
        createdAt: toIso(data.createdAt),
        createdByName: data.createdByName || "",
        status: data.status || "queued",
        totalRecipients: data.totalRecipients || 0,
        totalMessages: data.totalMessages || 0,
        processed: data.processed || 0,
        counts: data.counts || { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 },
      }
    })

    campaigns.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

    return NextResponse.json({ success: true, campaigns })
  } catch (error: unknown) {
    console.error("[wa-campaigns] List failed:", error)
    return NextResponse.json(
      { success: false, error: "Could not load campaign history." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    const name = String(body?.name || "").trim() || `Campaign ${new Date().toLocaleString("en-IN")}`
    const mobileColumn = String(body?.mobileColumn || "").trim()
    const nameColumn = String(body?.nameColumn || "").trim()
    const message1 = sanitizeMessage(body?.message1)
    const message2 = sanitizeMessage(body?.message2)

    if (!message1.enabled && !message2.enabled) {
      return NextResponse.json(
        { success: false, error: "Turn on Message 1, Message 2, or both." },
        { status: 400 }
      )
    }

    const problem = messageProblem(message1, "Message 1") || messageProblem(message2, "Message 2")
    if (problem) {
      return NextResponse.json({ success: false, error: problem }, { status: 400 })
    }

    const rows: { phone: unknown; name?: unknown; row?: unknown }[] = Array.isArray(body?.recipients)
      ? body.recipients
      : []
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients were uploaded." },
        { status: 400 }
      )
    }

    // The browser already filtered and normalised, but it is the browser: every
    // number is normalised again here, and duplicates within one campaign are
    // dropped so nobody receives the same blast twice.
    const seen = new Set<string>()
    const recipients: CampaignRecipient[] = []
    let invalidCount = 0

    rows.forEach((row, index) => {
      const { phone } = normalizePhone(row.phone)
      if (!phone) {
        invalidCount += 1
        return
      }
      if (seen.has(phone)) return
      seen.add(phone)
      recipients.push({
        phone,
        name: String(row.name ?? "").trim().slice(0, 120),
        row: Number(row.row) || index + 1,
      })
    })

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "None of the uploaded numbers are valid mobile numbers." },
        { status: 400 }
      )
    }

    const campaignId = await createCampaign({
      name,
      mobileColumn,
      nameColumn,
      message1,
      message2,
      recipients,
      invalidCount: invalidCount + Number(body?.invalidCount || 0),
      createdBy: auth.caller.uid,
      createdByName: auth.caller.email || "Admin",
      workerOrigin: new URL(request.url).origin,
    })

    scheduleCampaignRun(campaignId)

    return NextResponse.json({
      success: true,
      campaignId,
      queued: recipients.length,
      skipped: rows.length - recipients.length,
    })
  } catch (error: unknown) {
    console.error("[wa-campaigns] Create failed:", error)
    return NextResponse.json(
      { success: false, error: "Could not start the campaign." },
      { status: 500 }
    )
  }
}
