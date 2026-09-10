import { MongoFieldValue as FieldValue } from "@/lib/db/mongo-adapter"
import { requireAdmin } from "@/lib/apiAuth"
import {
  sendOne,
  sanitizeMessage,
  messageProblem,
  CAMPAIGNS,
  RECIPIENTS,
  MESSAGE_INDEX,
} from "@/lib/waCampaigns"
import { getAdminDb } from "@/lib/firebase-admin"
import { normalizePhone, type CampaignMessage, type CampaignRecipient } from "@/lib/waCampaignShared"

export const maxDuration = 60

/**
 * Direct WhatsApp campaign dispatcher — streaming, and resumable across
 * invocations.
 *
 * ## Why it streams
 *
 * The previous version sent every recipient inside one request and answered
 * once at the end. Two things went wrong with that, and the browser saw both as
 * the same failure:
 *
 *  - 70 recipients a quarter-second apart, plus Meta's own latency, runs past
 *    the 60-second function limit. The platform killed the invocation and
 *    replied with its own plain-text error page, so `response.json()` in the
 *    browser threw `Unexpected token 'A'` — that is the "An error occurred…"
 *    page being parsed as JSON.
 *  - Nothing could be shown while it ran, because nothing was sent until it
 *    finished. The progress bar sat at 0 of 70 for a minute and then died.
 *
 * So this answers immediately with an NDJSON stream — one JSON object per line —
 * and writes a line as each recipient is dealt with. The browser renders each
 * line as it arrives, which is the live progress, and a killed invocation now
 * costs only the lines it had not yet written.
 *
 * ## Why it hands work back
 *
 * The handler stops at `TIME_BUDGET_MS`, well inside the limit, and reports how
 * many of the recipients it was handed are still untouched. The caller posts
 * those back in a fresh request. A campaign of any size therefore completes as
 * a series of short requests, and no single one of them can time out.
 *
 * ## Firestore
 *
 * Logging stays failsafe: a Spark-plan quota error must never stop messages
 * that are already going out. Every write is wrapped, and a failure downgrades
 * to a warning carried on the stream rather than an error that ends it.
 */

/** Recipients in flight at once. Far below Meta's ceiling; this is about not
 *  hammering it, not about speed. */
const CONCURRENCY = 4
/** Pause between waves, so a large list stays a steady trickle. */
const WAVE_GAP_MS = 150
/** Stop and hand the rest back well before the platform's 60s limit. */
const TIME_BUDGET_MS = 40_000

interface DispatchBody {
  campaignName?: string
  recipients?: { name?: string; phone?: string; row?: number }[]
  message1?: CampaignMessage
  message2?: CampaignMessage
  mobileColumn?: string
  nameColumn?: string
  /** Set from the second request onwards, so every chunk lands on one campaign. */
  campaignId?: string
  /** Index of this chunk's first recipient within the whole campaign. */
  offset?: number
  /** The whole campaign's size, which only the caller knows. */
  totalRecipients?: number
}

interface SendResult {
  index: number
  name: string
  phone: string
  status: "sent" | "failed"
  error: string
  messageId: string
}

const encoder = new TextEncoder()
const line = (value: unknown) => encoder.encode(`${JSON.stringify(value)}\n`)
const recipientId = (index: number) => `r${String(index).padStart(7, "0")}`

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: DispatchBody = {}
  try {
    body = await request.json()
  } catch {
    return Response.json({ success: false, error: "Bad JSON payload" }, { status: 400 })
  }

  const campaignName =
    String(body.campaignName || "").trim() || `Campaign ${new Date().toLocaleString("en-IN")}`
  const rawRows = Array.isArray(body.recipients) ? body.recipients : []

  if (rawRows.length === 0) {
    return Response.json({ success: false, error: "No recipients provided" }, { status: 400 })
  }

  const message1 = sanitizeMessage(body.message1)
  const message2 = sanitizeMessage(body.message2)

  if (!message1.enabled && !message2.enabled) {
    return Response.json({ success: false, error: "No message enabled to send" }, { status: 400 })
  }

  const problem = messageProblem(message1, "Message 1") || messageProblem(message2, "Message 2")
  if (problem) {
    return Response.json({ success: false, error: problem }, { status: 400 })
  }

  // Numbers are normalised again here. The browser already did it, but it is
  // the browser, and a duplicate inside one chunk means somebody gets the blast
  // twice.
  const recipients: CampaignRecipient[] = []
  const seen = new Set<string>()
  const offset = Math.max(0, Number(body.offset) || 0)

  rawRows.forEach((row, index) => {
    const { phone } = normalizePhone(row.phone)
    if (phone && !seen.has(phone)) {
      seen.add(phone)
      recipients.push({
        phone,
        name: String(row.name || "").trim().slice(0, 120),
        row: Number(row.row) || offset + index + 1,
      })
    }
  })

  if (recipients.length === 0) {
    return Response.json(
      { success: false, error: "No valid mobile numbers in recipient list" },
      { status: 400 }
    )
  }

  const totalRecipients = Math.max(Number(body.totalRecipients) || 0, offset + recipients.length)
  const callerUid = auth.caller.uid
  const callerName = auth.caller.email || "Admin"
  const workerOrigin = new URL(request.url).origin

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now()
      const results: SendResult[] = []
      let sent = 0
      let failed = 0
      let campaignId = String(body.campaignId || "")
      let firestoreWarning: string | null = null

      /** Enqueue, unless the browser has already walked away. */
      const emit = (event: Record<string, unknown>) => {
        if (request.signal.aborted) return
        try {
          controller.enqueue(line(event))
        } catch {
          // The stream is gone; the loop's own abort check stops the send.
        }
      }

      // The campaign document is created before the first message goes out, so
      // the report exists even if the browser is closed mid-send.
      if (!campaignId) {
        try {
          const ref = getAdminDb().collection(CAMPAIGNS).doc()
          const perRecipient = (message1.enabled ? 1 : 0) + (message2.enabled ? 1 : 0)
          const totalMessages = totalRecipients * perRecipient
          await ref.set({
            name: campaignName,
            status: "running",
            createdAt: new Date(),
            startedAt: new Date(),
            finishedAt: null,
            createdBy: callerUid,
            createdByName: callerName,
            mobileColumn: body.mobileColumn || "",
            nameColumn: body.nameColumn || "",
            message1,
            message2,
            totalRecipients,
            totalMessages,
            processed: 0,
            counts: { sent: 0, delivered: 0, read: 0, failed: 0, pending: totalMessages },
            invalidCount: 0,
            workerOrigin,
          })
          campaignId = ref.id
        } catch (error) {
          console.warn("[wa-campaigns/dispatch] Could not create the campaign document:", error)
          firestoreWarning =
            "The database is unavailable, so this campaign will not appear in history. Messages are still being delivered."
        }
      }

      emit({ type: "start", total: recipients.length, offset, campaignId, firestoreWarning })

      /** One recipient's Message 1, then Message 2 if Message 1 got through. */
      const dispatchTo = async (recipient: CampaignRecipient, index: number) => {
        let outcome = { ok: true, messageId: "", error: "" }
        if (message1.enabled) outcome = await sendOne(message1, recipient)
        if (message2.enabled && outcome.ok) await sendOne(message2, recipient)

        if (outcome.ok) sent += 1
        else failed += 1

        const result: SendResult = {
          index: offset + index,
          name: recipient.name || "Recipient",
          phone: recipient.phone,
          status: outcome.ok ? "sent" : "failed",
          error: outcome.error,
          messageId: outcome.messageId,
        }
        results.push(result)

        emit({ type: "progress", ...result, id: recipientId(result.index), sent, failed })
      }

      let processed = 0
      try {
        for (let start = 0; start < recipients.length; start += CONCURRENCY) {
          if (request.signal.aborted) break
          if (Date.now() - startedAt > TIME_BUDGET_MS) break

          const wave = recipients.slice(start, start + CONCURRENCY)
          await Promise.all(wave.map((recipient, i) => dispatchTo(recipient, start + i)))
          processed += wave.length

          if (start + CONCURRENCY < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, WAVE_GAP_MS))
          }
        }
      } catch (error) {
        console.error("[wa-campaigns/dispatch] Send loop failed:", error)
        emit({
          type: "error",
          error: error instanceof Error ? error.message : "The send stopped unexpectedly.",
        })
      }

      const remaining = recipients.length - processed
      const finished = remaining === 0 && offset + processed >= totalRecipients

      if (campaignId && results.length > 0) {
        try {
          await logResults(campaignId, results, sent, failed, message2.enabled, finished)
        } catch (error) {
          // The wire key stays `firestoreWarning` because the admin page reads it
          // by that name; the storage behind it has been MongoDB since the migration.
          console.warn("[wa-campaigns/dispatch] Result logging skipped:", error)
          firestoreWarning =
            "The database did not accept the log for this batch. The messages were delivered; the report will be incomplete."
        }
      }

      emit({
        type: "done",
        campaignId: campaignId || null,
        processed,
        remaining,
        sent,
        failed,
        finished,
        aborted: request.signal.aborted,
        firestoreWarning,
      })

      try {
        controller.close()
      } catch {
        // Already closed, because the client went away.
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      // Tells any nginx-shaped proxy in front of this not to buffer the body,
      // which would collect the whole stream and defeat the point of it.
      "X-Accel-Buffering": "no",
    },
  })
}

/**
 * This batch's outcomes, written against the campaign.
 *
 * Only ever called inside a `try`: Firestore refusing a write is a reporting
 * problem, and the messages have already gone out by the time this runs.
 */
async function logResults(
  campaignId: string,
  results: SendResult[],
  sent: number,
  failed: number,
  message2Enabled: boolean,
  finished: boolean
) {
  const db = getAdminDb()
  const campaignRef = db.collection(CAMPAIGNS).doc(campaignId)

  // Firestore caps a batch at 500 writes, and each recipient can cost two.
  const CHUNK = 200
  for (let start = 0; start < results.length; start += CHUNK) {
    const batch = db.batch()
    for (const result of results.slice(start, start + CHUNK)) {
      const id = recipientId(result.index)
      const now = new Date()
      batch.set(campaignRef.collection(RECIPIENTS).doc(id), {
        index: result.index,
        row: result.index + 1,
        phone: result.phone,
        name: result.name,
        done: true,
        processedAt: now,
        m1: {
          status: result.status,
          messageId: result.messageId,
          error: result.error,
          sentAt: result.status === "sent" ? now : null,
          deliveredAt: null,
          readAt: null,
          failedAt: result.status === "failed" ? now : null,
        },
        m2: { status: message2Enabled ? "sent" : "skipped" },
      })

      // The delivery webhook only ever sees a `wamid`. This is what turns one
      // back into a campaign recipient without scanning every campaign.
      if (result.messageId) {
        batch.set(db.collection(MESSAGE_INDEX).doc(result.messageId), {
          campaignId,
          recipientId: id,
          slot: "m1",
          createdAt: new Date(),
        })
      }
    }
    await batch.commit()
  }

  await campaignRef.update({
    processed: FieldValue.increment(results.length),
    "counts.sent": FieldValue.increment(sent),
    "counts.failed": FieldValue.increment(failed),
    "counts.pending": FieldValue.increment(-(sent + failed)),
    ...(finished ? { status: "completed", finishedAt: new Date() } : {}),
  })
}
