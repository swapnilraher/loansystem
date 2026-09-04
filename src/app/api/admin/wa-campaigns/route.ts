import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { getAdminDb } from "@/lib/firebase-admin"
import { CAMPAIGNS, createCampaign, scheduleCampaignRun, type CampaignDoc } from "@/lib/waCampaigns"
import { normalizePhone, type CampaignMessage, type CampaignRecipient } from "@/lib/waCampaignShared"

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
    const snapshot = await getAdminDb()
      .collection(CAMPAIGNS)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get()

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

    return NextResponse.json({ success: true, campaigns })
  } catch (error: unknown) {
    console.error("[wa-campaigns] List failed:", error)
    return NextResponse.json(
      { success: false, error: "Could not load campaign history." },
      { status: 500 }
    )
  }
}

/** Keeps only the fields the worker reads, so nothing unexpected is stored. */
function cleanMessage(raw: unknown): CampaignMessage {
  const value = (raw || {}) as Partial<CampaignMessage>
  const rawTemplate = String(value.templateName || "").trim()
  const isConnector = rawTemplate.toLowerCase() === "connector" || rawTemplate.toLowerCase().includes("connector")
  const templateName = isConnector ? "connector" : rawTemplate
  return {
    enabled: value.enabled === true,
    mode: value.mode === "custom" ? "custom" : "template",
    templateName,
    templateLanguage: isConnector ? "en" : String(value.templateLanguage || "en_US").trim(),
    bodyParams: Array.isArray(value.bodyParams) && value.bodyParams.length > 0
      ? value.bodyParams.map(p => String(p ?? ""))
      : (isConnector ? ["{{Name}}"] : []),
    imageUrl: String(value.imageUrl || (isConnector ? "https://res.cloudinary.com/ugpy6fko/image/upload/v1788543861/wa-campaigns/u3xz2l1lpx7wylsxitog.png" : "")).trim(),
    imageSource: value.imageSource === "upload" || value.imageSource === "url" ? value.imageSource : (isConnector ? "url" : "none"),
    text: String(value.text || ""),
  }
}

function messageProblem(message: CampaignMessage, label: string): string | null {
  if (!message.enabled) return null
  if (message.mode === "template" && !message.templateName) {
    return `${label} has no template selected.`
  }
  if (message.mode === "custom" && !message.text.trim() && !message.imageUrl) {
    return `${label} has no text and no image.`
  }
  if (message.imageUrl && !/^https:\/\//i.test(message.imageUrl)) {
    return `${label}: the image URL must be a public https:// address.`
  }
  return null
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    const name = String(body?.name || "").trim() || `Campaign ${new Date().toLocaleString("en-IN")}`
    const mobileColumn = String(body?.mobileColumn || "").trim()
    const nameColumn = String(body?.nameColumn || "").trim()
    const message1 = cleanMessage(body?.message1)
    const message2 = cleanMessage(body?.message2)

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
