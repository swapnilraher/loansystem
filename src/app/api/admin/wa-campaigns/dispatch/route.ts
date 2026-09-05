import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { sendOne, CAMPAIGNS, RECIPIENTS, MESSAGE_INDEX } from "@/lib/waCampaigns"
import { getAdminDb } from "@/lib/firebase-admin"
import { normalizePhone, type CampaignMessage, type CampaignRecipient } from "@/lib/waCampaignShared"
import { FieldValue } from "@/lib/db/mongo-adapter"

export const maxDuration = 60

interface DispatchBody {
  action?: "init" | "chunk" | "finalize"
  campaignId?: string
  campaignName?: string
  recipients?: { name?: string; phone?: string; row?: number }[]
  chunk?: { name?: string; phone?: string; row?: number; index?: number }[]
  message1?: CampaignMessage
  message2?: CampaignMessage
  mobileColumn?: string
  nameColumn?: string
  totalCount?: number
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: DispatchBody = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Bad JSON payload" }, { status: 400 })
  }

  const db = getAdminDb()
  const action = body.action || "full"

  // ─── ACTION 1: INIT CAMPAIGN ────────────────────────────────────────────────
  if (action === "init") {
    const campaignName = String(body.campaignName || "").trim() || `Campaign ${new Date().toLocaleString("en-IN")}`
    const total = Number(body.totalCount) || 0
    const message1 = body.message1
    const message2 = body.message2
    const perRecipient = (message1?.enabled ? 1 : 0) + (message2?.enabled ? 1 : 0)

    const campaignRef = db.collection(CAMPAIGNS).doc()
    const campaignId = campaignRef.id

    await campaignRef.set({
      name: campaignName,
      status: "in_progress",
      createdAt: new Date(),
      createdBy: auth.caller.uid,
      createdByName: auth.caller.email || "Admin",
      mobileColumn: body.mobileColumn || "",
      nameColumn: body.nameColumn || "",
      message1: message1 || null,
      message2: message2 || null,
      totalRecipients: total,
      totalMessages: total * perRecipient,
      processed: 0,
      counts: {
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        pending: total,
      },
      invalidCount: 0,
      workerOrigin: new URL(request.url).origin,
    })

    return NextResponse.json({
      success: true,
      campaignId,
      campaignName,
      total,
    })
  }

  // ─── ACTION 2: DISPATCH CHUNK (5-10 recipients) ─────────────────────────────
  if (action === "chunk") {
    const campaignId = body.campaignId
    if (!campaignId) {
      return NextResponse.json({ success: false, error: "Missing campaignId" }, { status: 400 })
    }

    const chunkRows = Array.isArray(body.chunk) ? body.chunk : []
    const message1 = body.message1
    const message2 = body.message2

    const results: {
      id: string
      name: string
      phone: string
      status: "sent" | "failed"
      error: string
      messageId: string
    }[] = []

    let chunkSent = 0
    let chunkFailed = 0

    const campaignRef = db.collection(CAMPAIGNS).doc(campaignId)

    for (let i = 0; i < chunkRows.length; i++) {
      const r = chunkRows[i]
      const { phone } = normalizePhone(r.phone)
      if (!phone) {
        // Skip invalid row
        continue
      }

      const recipient: CampaignRecipient = {
        phone,
        name: String(r.name || "").trim().slice(0, 120),
        row: Number(r.row) || i + 1,
      }

      let m1Outcome = { ok: true, messageId: "", error: "" }
      if (message1?.enabled) {
        m1Outcome = await sendOne(message1, recipient)
      }

      if (m1Outcome.ok) {
        chunkSent++
      } else {
        chunkFailed++
      }

      if (message2?.enabled && m1Outcome.ok) {
        await sendOne(message2, recipient)
      }

      const itemResult = {
        id: `r_${r.index ?? i + 1}`,
        name: recipient.name || "Recipient",
        phone: recipient.phone,
        status: (m1Outcome.ok ? "sent" : "failed") as "sent" | "failed",
        error: m1Outcome.error || "",
        messageId: m1Outcome.messageId || "",
      }
      results.push(itemResult)

      // Save recipient record to MongoDB subcollection
      try {
        const rid = `r${String(r.index ?? i).padStart(7, "0")}`
        const rRef = campaignRef.collection(RECIPIENTS).doc(rid)
        await rRef.set({
          index: r.index ?? i,
          row: r.row,
          phone: recipient.phone,
          name: recipient.name,
          done: true,
          processedAt: new Date(),
          m1: {
            status: itemResult.status,
            messageId: itemResult.messageId,
            error: itemResult.error,
            sentAt: itemResult.status === "sent" ? new Date() : null,
          },
          m2: {
            status: message2?.enabled ? "sent" : "skipped",
          },
        })

        if (itemResult.messageId) {
          await db.collection(MESSAGE_INDEX).doc(itemResult.messageId).set({
            campaignId,
            recipientId: rid,
            slot: "m1",
            createdAt: new Date(),
          })
        }
      } catch (logErr) {
        console.warn("Recipient log error in Mongo:", logErr)
      }

      // 100ms throttle between sends to respect Meta rate limits without timing out
      if (i < chunkRows.length - 1) {
        await new Promise((res) => setTimeout(res, 100))
      }
    }

    // Increment campaign counts atomically in MongoDB
    try {
      await campaignRef.update({
        processed: FieldValue.increment(results.length),
        "counts.sent": FieldValue.increment(chunkSent),
        "counts.failed": FieldValue.increment(chunkFailed),
        "counts.pending": FieldValue.increment(-results.length),
        updatedAt: new Date(),
      })
    } catch (countErr) {
      console.warn("Failed to update campaign counts:", countErr)
    }

    return NextResponse.json({
      success: true,
      campaignId,
      processed: results.length,
      sent: chunkSent,
      failed: chunkFailed,
      results,
    })
  }

  // ─── ACTION 3: FINALIZE CAMPAIGN ────────────────────────────────────────────
  if (action === "finalize") {
    const campaignId = body.campaignId
    if (campaignId) {
      try {
        await db.collection(CAMPAIGNS).doc(campaignId).update({
          status: "completed",
          finishedAt: new Date(),
        })
      } catch (finErr) {
        console.warn("Failed to finalize campaign:", finErr)
      }
    }
    return NextResponse.json({ success: true, completed: true, campaignId })
  }

  // ─── FALLBACK: FULL BATCH DISPATCH ──────────────────────────────────────────
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
    return NextResponse.json({ success: false, error: "No valid mobile numbers found" }, { status: 400 })
  }

  // Create campaign in MongoDB first
  const campaignRef = db.collection(CAMPAIGNS).doc()
  const campaignId = campaignRef.id
  const perRecipient = (message1?.enabled ? 1 : 0) + (message2?.enabled ? 1 : 0)

  await campaignRef.set({
    name: campaignName,
    status: "in_progress",
    createdAt: new Date(),
    createdBy: auth.caller.uid,
    createdByName: auth.caller.email || "Admin",
    mobileColumn: body.mobileColumn || "",
    nameColumn: body.nameColumn || "",
    message1: message1 || null,
    message2: message2 || null,
    totalRecipients: recipients.length,
    totalMessages: recipients.length * perRecipient,
    processed: 0,
    counts: { sent: 0, delivered: 0, read: 0, failed: 0, pending: recipients.length },
    invalidCount: 0,
    workerOrigin: new URL(request.url).origin,
  })

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

    if (i < recipients.length - 1) {
      await new Promise((res) => setTimeout(res, 100))
    }
  }

  await campaignRef.update({
    status: "completed",
    finishedAt: new Date(),
    processed: recipients.length,
    counts: {
      sent: sentCount,
      delivered: 0,
      read: 0,
      failed: failedCount,
      pending: 0,
    },
  })

  return NextResponse.json({
    success: true,
    campaignId,
    total: recipients.length,
    sent: sentCount,
    failed: failedCount,
    results,
  })
}
