/**
 * Bulk WhatsApp campaigns: storage, sending, and the batch worker.
 *
 * SERVER ONLY — imports `firebase-admin` and the Cloud API credentials. The
 * browser side imports `@/lib/waCampaignShared`, which holds nothing secret.
 *
 * ## Why a self-continuing worker rather than a queue
 *
 * This app runs on serverless functions with a per-invocation time limit, and
 * there is no queue service in the project. A campaign of a few thousand
 * recipients cannot finish inside one invocation, and it must not run inside
 * the request that starts it or the Admin's browser would hang for minutes.
 *
 * So: the start route answers immediately, `after()` runs a batch in the
 * background, and when the batch runs out of time budget it re-triggers itself
 * through `/api/admin/wa-campaigns/process`, which also answers immediately and
 * continues in its own `after()`. Progress is a Firestore read, so the UI can
 * poll it without touching Meta at all.
 *
 * Resumability comes from `done: false` on each recipient rather than from an
 * offset: a batch that dies halfway leaves the remaining recipients exactly as
 * the next batch expects to find them, and a recipient is only marked done once
 * its writes have landed.
 */

import { after } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminDb } from "./firebase-admin"
import {
  GRAPH_BASE,
  WHATSAPP_PHONE_ID,
  WHATSAPP_TOKEN,
  WHATSAPP_WABA_ID,
} from "./whatsappConfig"
import {
  fillName,
  type CampaignMessage,
  type CampaignRecipient,
  type CampaignStatus,
  type MessageStatus,
  type WaTemplate,
  countTemplateVariables,
  extractTemplateVariables,
} from "./waCampaignShared"

export const CAMPAIGNS = "wa_campaigns"
export const RECIPIENTS = "recipients"
/** `wamid` → which campaign recipient and which of the two messages it was. */
export const MESSAGE_INDEX = "wa_campaign_messages"

/** Recipients pulled into memory per batch. */
const BATCH_SIZE = 40
/** Recipients sent at the same time. Meta's default ceiling is far higher; this
 *  is about staying well inside it, not about speed. */
const CONCURRENCY = 5
/** Stop and hand over to the next invocation after this long. */
const TIME_BUDGET_MS = 45_000

/**
 * Shared secret for the worker's own continuation call. The route is Admin-only
 * for humans; the worker has no ID token, so it proves itself with this instead.
 */
export const WORKER_SECRET =
  process.env.CAMPAIGN_WORKER_SECRET || `wa-campaign-worker-${WHATSAPP_PHONE_ID}`
export const WORKER_HEADER = "x-wa-campaign-worker"

export interface CampaignDoc {
  name: string
  status: CampaignStatus
  createdAt: FirebaseFirestore.Timestamp | Date
  createdBy: string
  createdByName: string
  mobileColumn: string
  nameColumn: string
  message1: CampaignMessage
  message2: CampaignMessage
  totalRecipients: number
  totalMessages: number
  processed: number
  counts: { sent: number; delivered: number; read: number; failed: number; pending: number }
  invalidCount: number
  workerOrigin: string
  lastError?: string
  finishedAt?: FirebaseFirestore.Timestamp | Date | null
}

// ─── Templates ────────────────────────────────────────────────────────────────

interface GraphTemplateComponent {
  type?: string
  format?: string
  text?: string
}

/**
 * Approved templates on the WhatsApp Business Account.
 *
 * Only the WABA node can list these — the phone-number id cannot — which is why
 * `WHATSAPP_WABA_ID` had to be added alongside the credentials already in
 * `whatsappConfig`.
 */
export async function fetchTemplates(): Promise<WaTemplate[]> {
  const url =
    `${GRAPH_BASE}/${WHATSAPP_WABA_ID}/message_templates` +
    `?limit=200&fields=name,language,status,category,components`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    cache: "no-store",
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result?.error?.message || "WhatsApp refused the template list.")
  }

  const rows: { name: string; language: string; status: string; category: string; components?: GraphTemplateComponent[] }[] =
    result?.data || []

  return rows
    .filter(row => (row.status || "").toUpperCase() === "APPROVED")
    .map(row => {
      const components = row.components || []
      const body = components.find(c => (c.type || "").toUpperCase() === "BODY")
      const header = components.find(c => (c.type || "").toUpperCase() === "HEADER")
      const headerFormat = (header?.format || "").toUpperCase()
      const bodyText = body?.text || ""
      const varNames = extractTemplateVariables(bodyText)

      return {
        name: row.name,
        language: row.language,
        status: row.status,
        category: row.category || "",
        bodyText,
        variableCount: varNames.length,
        variableNames: varNames,
        hasImageHeader: headerFormat === "IMAGE",
        hasHeaderText: headerFormat === "TEXT",
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Sending ──────────────────────────────────────────────────────────────────

export interface SendOutcome {
  ok: boolean
  messageId: string
  error: string
}

/**
 * One message to one recipient.
 *
 * Never throws: a campaign of 2000 must not stop because recipient 37 has a
 * number Meta rejects. The failure is returned so it can be written against
 * that recipient and shown in the report.
 */
export async function sendOne(
  message: CampaignMessage,
  recipient: { phone: string; name: string }
): Promise<SendOutcome> {
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient.phone,
  }

  if (message.mode === "template") {
    const components: Record<string, unknown>[] = []
    const tName = String(message.templateName || "").trim().toLowerCase()
    const isConnector = tName === "connector" || tName.includes("connector")
    const imgUrl = message.imageUrl || (isConnector ? "https://res.cloudinary.com/ugpy6fko/image/upload/v1788543861/wa-campaigns/u3xz2l1lpx7wylsxitog.png" : "")

    // A template whose header is an IMAGE must be given one, and it has to be a
    // public link — Meta fetches it itself, so a server path would 404 on their
    // side rather than ours.
    if (imgUrl) {
      components.push({
        type: "header",
        parameters: [{ type: "image", image: { link: imgUrl } }],
      })
    }

    if (isConnector) {
      const recipientName = (recipient.name || "").trim() || "Partner"
      components.push({
        type: "body",
        parameters: [
          {
            type: "text",
            parameter_name: "customer_name",
            text: recipientName,
          },
        ],
      })
    } else {
      const rawParams = message.bodyParams.length > 0 ? message.bodyParams : []
      if (rawParams.length > 0) {
        components.push({
          type: "body",
          parameters: rawParams.map((param, idx) => {
            const filled = fillName(param, recipient.name) || recipient.name || "Customer"
            return {
              type: "text",
              text: filled,
            }
          }),
        })
      }
    }

    const langCode = isConnector ? "en" : (message.templateLanguage || "en_US")

    body.type = "template"
    body.template = {
      name: isConnector ? "connector" : message.templateName,
      language: { code: langCode },
      ...(components.length > 0 ? { components } : {}),
    }
  } else if (message.imageUrl) {
    body.type = "image"
    body.image = {
      link: message.imageUrl,
      caption: fillName(message.text, recipient.name),
    }
  } else {
    body.type = "text"
    body.text = { body: fillName(message.text, recipient.name) }
  }

  try {
    console.log(`[waCampaigns] Dispatching to ${recipient.phone}:`, JSON.stringify(body))
    const response = await fetch(`${GRAPH_BASE}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const result = await response.json()

    if (!response.ok) {
      const error = result?.error
      const detail = error?.error_data?.details || error?.message || "WhatsApp rejected the message."
      console.error(`[waCampaigns] Send failed for ${recipient.phone}:`, detail, JSON.stringify(result))
      return { ok: false, messageId: "", error: String(detail).slice(0, 500) }
    }

    console.log(`[waCampaigns] Send success for ${recipient.phone}:`, result?.messages?.[0]?.id)
    return {
      ok: true,
      messageId: result?.messages?.[0]?.id || "",
      error: "",
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Network error"
    console.error(`[waCampaigns] Send threw for ${recipient.phone}:`, detail)
    return { ok: false, messageId: "", error: detail.slice(0, 500) }
  }
}

// ─── Campaign creation ────────────────────────────────────────────────────────

export interface CreateCampaignInput {
  name: string
  mobileColumn: string
  nameColumn: string
  message1: CampaignMessage
  message2: CampaignMessage
  recipients: CampaignRecipient[]
  invalidCount: number
  createdBy: string
  createdByName: string
  workerOrigin: string
}

/** Zero-padded so `orderBy(documentId())` is also processing order. */
function recipientId(index: number): string {
  return `r${String(index).padStart(7, "0")}`
}

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  const db = getAdminDb()
  const perRecipient = (input.message1.enabled ? 1 : 0) + (input.message2.enabled ? 1 : 0)

  const campaignRef = db.collection(CAMPAIGNS).doc()
  await campaignRef.set({
    name: input.name,
    status: "queued" satisfies CampaignStatus,
    createdAt: new Date(),
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    mobileColumn: input.mobileColumn,
    nameColumn: input.nameColumn,
    message1: input.message1,
    message2: input.message2,
    totalRecipients: input.recipients.length,
    totalMessages: input.recipients.length * perRecipient,
    processed: 0,
    counts: {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: input.recipients.length * perRecipient,
    },
    invalidCount: input.invalidCount,
    workerOrigin: input.workerOrigin,
    finishedAt: null,
  })

  // Firestore caps a batch at 500 writes.
  const CHUNK = 400
  for (let start = 0; start < input.recipients.length; start += CHUNK) {
    const batch = db.batch()
    input.recipients.slice(start, start + CHUNK).forEach((recipient, offset) => {
      const index = start + offset
      batch.set(campaignRef.collection(RECIPIENTS).doc(recipientId(index)), {
        index,
        row: recipient.row,
        phone: recipient.phone,
        name: recipient.name,
        done: false,
        m1: blankSlot(input.message1.enabled),
        m2: blankSlot(input.message2.enabled),
      })
    })
    await batch.commit()
  }

  return campaignRef.id
}

function blankSlot(enabled: boolean) {
  return {
    status: (enabled ? "pending" : "skipped") satisfies MessageStatus,
    messageId: "",
    error: "",
    sentAt: null,
    deliveredAt: null,
    readAt: null,
    failedAt: null,
  }
}

// ─── The worker ───────────────────────────────────────────────────────────────

/** Kicks the worker off without blocking the response that scheduled it. */
export function scheduleCampaignRun(campaignId: string) {
  after(async () => {
    try {
      await runCampaign(campaignId)
    } catch (error) {
      console.error(`[waCampaigns] Run failed for ${campaignId}:`, error)
      await getAdminDb()
        .collection(CAMPAIGNS)
        .doc(campaignId)
        .update({
          status: "failed",
          lastError: error instanceof Error ? error.message : String(error),
          finishedAt: new Date(),
        })
        .catch(() => undefined)
    }
  })
}

/**
 * Sends until the campaign is finished or the time budget runs out, then hands
 * over to a fresh invocation.
 */
export async function runCampaign(campaignId: string): Promise<void> {
  const db = getAdminDb()
  const campaignRef = db.collection(CAMPAIGNS).doc(campaignId)
  const snapshot = await campaignRef.get()
  if (!snapshot.exists) return

  const campaign = snapshot.data() as CampaignDoc
  if (campaign.status === "cancelled" || campaign.status === "completed") return

  if (campaign.status !== "running") {
    await campaignRef.update({ status: "running", startedAt: new Date() })
  }

  const startedAt = Date.now()

  while (Date.now() - startedAt < TIME_BUDGET_MS) {
    // Re-read the status each batch so Cancel takes effect within one batch
    // rather than at the end of the campaign.
    const current = await campaignRef.get()
    if ((current.data() as CampaignDoc | undefined)?.status === "cancelled") return

    // No `orderBy` on purpose. An equality filter plus an order on a *different*
    // field needs a composite index, which this project does not deploy — the
    // query would fail with FAILED_PRECONDITION the first time a campaign ran.
    // Falling back to Firestore's default document-id order costs nothing here
    // because recipient ids are zero-padded (`r0000001`), so id order and
    // upload order are the same thing.
    const pending = await campaignRef
      .collection(RECIPIENTS)
      .where("done", "==", false)
      .limit(BATCH_SIZE)
      .get()

    if (pending.empty) {
      await campaignRef.update({ status: "completed", finishedAt: new Date() })
      console.log(`[waCampaigns] Campaign ${campaignId} completed.`)
      return
    }

    const docs = pending.docs
    for (let i = 0; i < docs.length; i += CONCURRENCY) {
      await Promise.all(
        docs.slice(i, i + CONCURRENCY).map(doc => processRecipient(campaignId, campaign, doc))
      )
    }
  }

  // Out of budget with work left: continue in a new invocation.
  await handOver(campaignId, campaign.workerOrigin)
}

/**
 * One recipient's whole journey: Message 1, then — only once Message 1 has been
 * processed — Message 2, which is the ordering the campaign promises.
 */
async function processRecipient(
  campaignId: string,
  campaign: CampaignDoc,
  doc: FirebaseFirestore.QueryDocumentSnapshot
) {
  const db = getAdminDb()
  const data = doc.data() as { phone: string; name: string }
  const recipient = { phone: data.phone, name: data.name || "" }

  const update: Record<string, unknown> = { done: true, processedAt: new Date() }
  let sent = 0
  let failed = 0
  const indexWrites: { messageId: string; slot: "m1" | "m2" }[] = []

  const slots: ["m1" | "m2", CampaignMessage][] = [
    ["m1", campaign.message1],
    ["m2", campaign.message2],
  ]

  for (const [slot, message] of slots) {
    if (!message?.enabled) continue

    const outcome = await sendOne(message, recipient)
    const now = new Date()

    if (outcome.ok) {
      sent += 1
      update[slot] = {
        status: "sent" satisfies MessageStatus,
        messageId: outcome.messageId,
        error: "",
        sentAt: now,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
      }
      if (outcome.messageId) indexWrites.push({ messageId: outcome.messageId, slot })
    } else {
      failed += 1
      update[slot] = {
        status: "failed" satisfies MessageStatus,
        messageId: "",
        error: outcome.error,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: now,
      }
      // Message 2 still goes out: the two are independent messages, and a
      // template rejection on one does not predict the other.
    }
  }

  const batch = db.batch()
  batch.update(doc.ref, update)

  // The webhook only ever sees a `wamid`. This is what turns it back into a
  // campaign recipient without scanning every campaign.
  for (const write of indexWrites) {
    batch.set(db.collection(MESSAGE_INDEX).doc(write.messageId), {
      campaignId,
      recipientId: doc.id,
      slot: write.slot,
      createdAt: new Date(),
    })
  }

  batch.update(db.collection(CAMPAIGNS).doc(campaignId), {
    processed: FieldValue.increment(1),
    "counts.sent": FieldValue.increment(sent),
    "counts.failed": FieldValue.increment(failed),
    "counts.pending": FieldValue.increment(-(sent + failed)),
  })

  await batch.commit()
}

/** Asks a fresh invocation to pick the campaign up. */
async function handOver(campaignId: string, origin: string) {
  if (!origin) {
    console.error(`[waCampaigns] No worker origin stored for ${campaignId}; cannot continue.`)
    return
  }
  try {
    // The continuation route answers 202 and does its work in its own `after()`,
    // so this resolves in milliseconds rather than waiting out the next batch.
    await fetch(`${origin}/api/admin/wa-campaigns/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WORKER_HEADER]: WORKER_SECRET,
      },
      body: JSON.stringify({ campaignId }),
    })
    console.log(`[waCampaigns] Handed campaign ${campaignId} to the next invocation.`)
  } catch (error) {
    console.error(`[waCampaigns] Hand-over failed for ${campaignId}:`, error)
  }
}

// ─── Real-time batched step runner ───────────────────────────────────────────

export interface StepBatchItem {
  id: string
  name: string
  phone: string
  status: "sent" | "failed"
  error: string
}

export interface StepCampaignResult {
  done: boolean
  processed: number
  total: number
  counts: { sent: number; delivered: number; read: number; failed: number; pending: number }
  status: string
  batch: StepBatchItem[]
}

/**
 * Sends the next batch of recipients directly and returns immediate progress.
 * Drives the real-time progress bar in the admin UI without relying on background workers.
 */
export async function stepCampaign(campaignId: string, limit = 5): Promise<StepCampaignResult> {
  const db = getAdminDb()
  const campaignRef = db.collection(CAMPAIGNS).doc(campaignId)
  const snapshot = await campaignRef.get()
  if (!snapshot.exists) {
    throw new Error("Campaign not found.")
  }

  const campaign = snapshot.data() as CampaignDoc
  if (campaign.status === "cancelled") {
    return {
      done: true,
      processed: campaign.processed || 0,
      total: campaign.totalRecipients || 0,
      counts: campaign.counts || { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 },
      status: "cancelled",
      batch: [],
    }
  }

  if (campaign.status !== "running") {
    await campaignRef.update({ status: "running", startedAt: new Date() })
  }

  const pending = await campaignRef
    .collection(RECIPIENTS)
    .where("done", "==", false)
    .limit(limit)
    .get()

  if (pending.empty) {
    await campaignRef.update({ status: "completed", finishedAt: new Date() })
    const finalDoc = (await campaignRef.get()).data() as CampaignDoc
    return {
      done: true,
      processed: finalDoc.processed || 0,
      total: finalDoc.totalRecipients || 0,
      counts: finalDoc.counts || { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 },
      status: "completed",
      batch: [],
    }
  }

  const batchResults: StepBatchItem[] = []

  for (const doc of pending.docs) {
    const data = doc.data() as { phone: string; name: string }
    await processRecipient(campaignId, campaign, doc)
    const updatedSnap = await doc.ref.get()
    const updatedData = updatedSnap.data() as Record<string, { status?: string; error?: string }>
    const m1Status = updatedData?.m1?.status || "pending"
    const m1Error = updatedData?.m1?.error || ""
    batchResults.push({
      id: doc.id,
      name: data.name || "",
      phone: data.phone || "",
      status: m1Status === "sent" ? "sent" : "failed",
      error: m1Error,
    })
  }

  const currentDoc = (await campaignRef.get()).data() as CampaignDoc
  const isDone = (currentDoc.processed || 0) >= (currentDoc.totalRecipients || 0)
  if (isDone && currentDoc.status !== "completed") {
    await campaignRef.update({ status: "completed", finishedAt: new Date() })
  }

  return {
    done: isDone,
    processed: currentDoc.processed || 0,
    total: currentDoc.totalRecipients || 0,
    counts: currentDoc.counts || { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 },
    status: isDone ? "completed" : "running",
    batch: batchResults,
  }
}

// ─── Delivery receipts ────────────────────────────────────────────────────────

/**
 * Applies one WhatsApp status callback to whichever campaign message it belongs
 * to. Returns `false` for the (very common) case of a status for a message that
 * was not part of a campaign — an inbox reply, an OTP — so the webhook can move
 * on without logging anything alarming.
 *
 * Statuses arrive out of order and repeat, so this never moves a message
 * backwards: a `delivered` that lands after `read` leaves the message read.
 */
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
}

export async function applyCampaignStatus(
  messageId: string,
  status: string,
  errorText: string,
  at: Date
): Promise<boolean> {
  if (!messageId) return false

  const db = getAdminDb()
  const indexSnap = await db.collection(MESSAGE_INDEX).doc(messageId).get()
  if (!indexSnap.exists) return false

  const { campaignId, recipientId: rid, slot } = indexSnap.data() as {
    campaignId: string
    recipientId: string
    slot: "m1" | "m2"
  }

  const normalized = status === "failed" ? "failed" : status
  const rank = STATUS_RANK[normalized]
  if (rank === undefined) return false

  const campaignRef = db.collection(CAMPAIGNS).doc(campaignId)
  const recipientRef = campaignRef.collection(RECIPIENTS).doc(rid)

  await db.runTransaction(async tx => {
    const snap = await tx.get(recipientRef)
    if (!snap.exists) return

    const slotData = (snap.data() as Record<string, { status?: string }>)[slot] || {}
    const currentRank = STATUS_RANK[slotData.status || "pending"] ?? 0
    // `failed` outranks everything so a late failure is never hidden, but a
    // stale `delivered` cannot undo a `read`.
    if (rank <= currentRank && normalized !== "failed") return

    const update: Record<string, unknown> = { [`${slot}.status`]: normalized }
    if (normalized === "delivered") update[`${slot}.deliveredAt`] = at
    if (normalized === "read") update[`${slot}.readAt`] = at
    if (normalized === "failed") {
      update[`${slot}.failedAt`] = at
      if (errorText) update[`${slot}.error`] = errorText.slice(0, 500)
    }
    tx.update(recipientRef, update)

    // Campaign counters are a running tally, so each transition moves one count
    // out of its old bucket and into the new one.
    const counterDelta: Record<string, FirebaseFirestore.FieldValue> = {}
    const previous = slotData.status || "pending"
    if (previous === "sent") counterDelta["counts.sent"] = FieldValue.increment(-1)
    if (previous === "delivered") counterDelta["counts.delivered"] = FieldValue.increment(-1)
    if (previous === "read") counterDelta["counts.read"] = FieldValue.increment(-1)
    if (previous === "pending") counterDelta["counts.pending"] = FieldValue.increment(-1)

    if (normalized === "delivered") counterDelta["counts.delivered"] = FieldValue.increment(1)
    if (normalized === "read") counterDelta["counts.read"] = FieldValue.increment(1)
    if (normalized === "failed") counterDelta["counts.failed"] = FieldValue.increment(1)
    if (normalized === "sent") counterDelta["counts.sent"] = FieldValue.increment(1)

    tx.update(campaignRef, counterDelta)
  })

  return true
}

// ─── Reporting ────────────────────────────────────────────────────────────────

/**
 * Recounts a campaign from its recipients and writes the totals back.
 *
 * This is what the report's Refresh button runs. The report itself reads the
 * stored summary and nothing else, so opening it costs one document read and no
 * API call — the deliberate design here is that nothing recalculates until a
 * person asks for it.
 */
export async function recomputeCampaign(campaignId: string) {
  const db = getAdminDb()
  const campaignRef = db.collection(CAMPAIGNS).doc(campaignId)

  const counts = { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 }
  let processed = 0
  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null

  // Paged so a 10,000-recipient campaign does not build one enormous snapshot.
  for (;;) {
    let query = campaignRef
      .collection(RECIPIENTS)
      .select("done", "m1", "m2")
      .orderBy("index")
      .limit(1000)
    if (last) query = query.startAfter(last)

    const page = await query.get()
    if (page.empty) break

    page.docs.forEach(doc => {
      const data = doc.data() as {
        done?: boolean
        m1?: { status?: string }
        m2?: { status?: string }
      }
      if (data.done) processed += 1
      for (const slot of [data.m1, data.m2]) {
        const status = slot?.status
        if (!status || status === "skipped") continue
        if (status in counts) counts[status as keyof typeof counts] += 1
      }
    })

    last = page.docs[page.docs.length - 1]
    if (page.size < 1000) break
  }

  await campaignRef.update({ counts, processed, refreshedAt: new Date() })
  return { counts, processed }
}
