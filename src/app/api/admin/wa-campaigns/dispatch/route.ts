import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { sendOne, CAMPAIGNS, RECIPIENTS, MESSAGE_INDEX } from "@/lib/waCampaigns"
import { getAdminDb } from "@/lib/firebase-admin"
import { normalizePhone, type CampaignMessage, type CampaignRecipient } from "@/lib/waCampaignShared"

export const maxDuration = 60

interface DispatchBody {
  campaignName?: string
  recipients?: { name?: string; phone?: string; row?: number }[]
  message1?: CampaignMessage
  message2?: CampaignMessage
  mobileColumn?: string
  nameColumn?: string
}

/**
 * Direct WhatsApp Campaign Dispatcher.
 *
 * Sends messages directly to Meta Cloud API first.
 * Firestore logging is wrapped in a failsafe try/catch so that Firebase Firestore
 * "Quota exceeded" errors on the Spark free tier NEVER block WhatsApp messages
 * from being delivered to recipients.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: DispatchBody = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Bad JSON payload" }, { status: 400 })
  }

  const campaignName = String(body.campaignName || "").trim() || `Campaign ${new Date().toLocaleString("en-IN")}`
  const rawRows = Array.isArray(body.recipients) ? body.recipients : []

  if (rawRows.length === 0) {
    return NextResponse.json({ success: false, error: "No recipients provided" }, { status: 400 })
  }

  const message1 = body.message1
  const message2 = body.message2

  if (!message1?.enabled && !message2?.enabled) {
    return NextResponse.json({ success: false, error: "No message enabled to send" }, { status: 400 })
  }

  // 1. Sanitize recipients
  const recipients: CampaignRecipient[] = []
  const seen = new Set<string>()

  rawRows.forEach((r, idx) => {
    const { phone } = normalizePhone(r.phone)
    if (phone && !seen.has(phone)) {
      seen.add(phone)
      recipients.push({
        phone,
        name: String(r.name || "").trim().slice(0, 120),
        row: Number(r.row) || idx + 1,
      })
    }
  })

  if (recipients.length === 0) {
    return NextResponse.json({ success: false, error: "No valid mobile numbers in recipient list" }, { status: 400 })
  }

  // 2. Direct Meta WhatsApp API dispatch
  const results: {
    id: string
    name: string
    phone: string
    status: "sent" | "failed"
    error: string
    messageId: string
  }[] = []

  let sentCount = 0
  let failedCount = 0

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    let m1Outcome = { ok: true, messageId: "", error: "" }

    if (message1?.enabled) {
      m1Outcome = await sendOne(message1, recipient)
    }

    if (m1Outcome.ok) {
      sentCount++
    } else {
      failedCount++
    }

    // Optional follow-up message 2
    if (message2?.enabled && m1Outcome.ok) {
      await sendOne(message2, recipient)
    }

    results.push({
      id: `r_${i + 1}`,
      name: recipient.name || "Recipient",
      phone: recipient.phone,
      status: m1Outcome.ok ? "sent" : "failed",
      error: m1Outcome.error,
      messageId: m1Outcome.messageId,
    })

    // Small delay between calls to respect rate limits
    if (i < recipients.length - 1) {
      await new Promise(res => setTimeout(res, 250))
    }
  }

  // 3. Failsafe Firestore logging (does not fail dispatch if quota exceeded)
  let campaignId = ""
  let firestoreWarning: string | null = null

  try {
    const db = getAdminDb()
    const campaignRef = db.collection(CAMPAIGNS).doc()
    campaignId = campaignRef.id

    const perRecipient = (message1?.enabled ? 1 : 0) + (message2?.enabled ? 1 : 0)

    await campaignRef.set({
      name: campaignName,
      status: "completed",
      createdAt: new Date(),
      finishedAt: new Date(),
      createdBy: auth.caller.uid,
      createdByName: auth.caller.email || "Admin",
      mobileColumn: body.mobileColumn || "",
      nameColumn: body.nameColumn || "",
      message1: message1 || null,
      message2: message2 || null,
      totalRecipients: recipients.length,
      totalMessages: recipients.length * perRecipient,
      processed: recipients.length,
      counts: {
        sent: sentCount,
        delivered: 0,
        read: 0,
        failed: failedCount,
        pending: 0,
      },
      invalidCount: 0,
      workerOrigin: new URL(request.url).origin,
    })

    // Save individual recipients
    const CHUNK = 400
    for (let start = 0; start < recipients.length; start += CHUNK) {
      const batch = db.batch()
      recipients.slice(start, start + CHUNK).forEach((r, off) => {
        const idx = start + off
        const res = results[idx]
        const rRef = campaignRef.collection(RECIPIENTS).doc(`r${String(idx).padStart(7, "0")}`)
        batch.set(rRef, {
          index: idx,
          row: r.row,
          phone: r.phone,
          name: r.name,
          done: true,
          processedAt: new Date(),
          m1: {
            status: res.status,
            messageId: res.messageId,
            error: res.error,
            sentAt: res.status === "sent" ? new Date() : null,
          },
          m2: {
            status: message2?.enabled ? "sent" : "skipped",
          },
        })

        if (res.messageId) {
          batch.set(db.collection(MESSAGE_INDEX).doc(res.messageId), {
            campaignId,
            recipientId: rRef.id,
            slot: "m1",
            createdAt: new Date(),
          })
        }
      })
      await batch.commit()
    }
  } catch (fsError: unknown) {
    console.warn("[wa-campaigns/dispatch] Firestore logging skipped (quota exceeded or network error):", fsError)
    firestoreWarning = "Firebase Firestore daily quota reached on Spark plan. Messages were delivered via WhatsApp, but campaign was not saved to database history."
  }

  return NextResponse.json({
    success: true,
    campaignId: campaignId || null,
    total: recipients.length,
    sent: sentCount,
    failed: failedCount,
    results,
    firestoreWarning,
  })
}
