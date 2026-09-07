/**
 * Where the WhatsApp bot's flows and messages are stored, and how they are read.
 *
 * Server-only: it reads and writes MongoDB through the admin adapter. The browser
 * never reads this module — the CRM goes through `/api/flows`, which is where the
 * Admin-only check lives.
 *
 * The bot must not stop talking because a database read failed, so every read
 * path here degrades to `DEFAULT_CONFIG` (the flows that used to be hardcoded)
 * rather than throwing.
 */

import { getAdminDb } from "@/lib/firebase-admin"
import {
  DEFAULT_CONFIG,
  mergeFlows,
  mergeMessages,
  sanitizeFlow,
  sanitizeMessages,
  type WaFlow,
  type WaFlowConfig,
  type WaMessages,
} from "@/lib/waFlows"

const FLOWS_COLLECTION = "waFlows"
const SETTINGS_COLLECTION = "waSettings"
const SETTINGS_DOC_ID = "whatsapp"

/**
 * Documents written by the first flow builder, which was never wired to the bot
 * and stored questions as plain English strings with no conditions. They stay in
 * the database untouched, but the bot ignores them: running them would replace the
 * live three-language flows with an English skeleton nobody approved.
 */
const SCHEMA_VERSION = 2

/**
 * The webhook is called once per inbound message, so an uncached read would put
 * a database round-trip in front of every reply. A minute is short enough that
 * an Admin editing a flow sees it live within one, and long enough that a busy
 * hour is not spent re-reading six documents.
 */
const CACHE_TTL_MS = 60_000

let cache: { config: WaFlowConfig; expiresAt: number } | null = null

/** Dropped after any write so the next message runs the new script. */
export function invalidateFlowCache(): void {
  cache = null
}

/** A flow as it sits in the database: the nested parts are stored as JSON text. */
interface StoredFlow {
  category?: string
  label?: string
  intro?: string
  steps?: string
  enabled?: boolean
  order?: number
  schemaVersion?: number
}

interface StoredSettings {
  messages?: string
  automationEnabled?: boolean
}

/** Just enough of a snapshot for the reads below; the adapter returns `any`. */
interface Snapshot<T> {
  id: string
  data(): T | undefined
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function docToFlow(id: string, data: StoredFlow): WaFlow | null {
  if (Number(data.schemaVersion ?? 0) < SCHEMA_VERSION) return null

  return sanitizeFlow(
    {
      id,
      category: data.category || "",
      label: parseJson(data.label, undefined),
      intro: parseJson(data.intro, undefined),
      steps: parseJson(data.steps, []),
      enabled: data.enabled !== false,
      order: Number(data.order ?? 99),
    },
    id
  )
}

function flowToDoc(flow: WaFlow): Record<string, unknown> {
  return {
    // `name` is what the CRM lists the flow under; the bot keys on `category`.
    name: `${flow.category} Flow`,
    category: flow.category,
    label: JSON.stringify(flow.label || {}),
    intro: JSON.stringify(flow.intro || {}),
    steps: JSON.stringify(flow.steps || []),
    enabled: flow.enabled !== false,
    order: flow.order ?? 99,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date(),
  }
}

async function readStoredFlows(): Promise<WaFlow[]> {
  const db = getAdminDb()
  try {
    const snap = await db.collection(FLOWS_COLLECTION).limit(100).get()
    const docs = snap.docs as Snapshot<StoredFlow>[]
    return docs
      .map(doc => docToFlow(doc.id, doc.data() || {}))
      .filter((f): f is WaFlow => f !== null)
  } catch {
    // No stored flows means the shipped defaults, which is also the safest answer
    // when the read itself fails.
    return []
  }
}

async function readSettings(): Promise<{ messages: Partial<WaMessages>; automationEnabled: boolean }> {
  const db = getAdminDb()
  try {
    const snap = await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get()
    // A missing document is the normal state until an Admin saves a message for
    // the first time.
    if (!snap.exists) return { messages: {}, automationEnabled: true }
    const data = (snap.data() || {}) as StoredSettings
    return {
      messages: sanitizeMessages(parseJson(data.messages, {})),
      automationEnabled: data.automationEnabled !== false,
    }
  } catch {
    return { messages: {}, automationEnabled: true }
  }
}

/**
 * The flows and messages the bot should run right now.
 *
 * Stored flows override the defaults per category; everything else falls through
 * to what shipped with the build.
 */
export async function loadFlowConfig(): Promise<WaFlowConfig> {
  if (cache && Date.now() < cache.expiresAt) return cache.config

  try {
    const [stored, settings] = await Promise.all([readStoredFlows(), readSettings()])
    const config: WaFlowConfig = {
      flows: mergeFlows(stored),
      messages: mergeMessages(settings.messages),
      automationEnabled: settings.automationEnabled,
    }
    cache = { config, expiresAt: Date.now() + CACHE_TTL_MS }
    return config
  } catch (error) {
    console.error("[waFlowStore] Could not load flow config; using defaults.", error)
    return DEFAULT_CONFIG
  }
}

/** Everything the CRM editor needs, including flows the Admin has disabled. */
export async function loadFlowConfigForAdmin(): Promise<WaFlowConfig> {
  const [stored, settings] = await Promise.all([readStoredFlows(), readSettings()])
  return {
    flows: mergeFlows(stored),
    messages: mergeMessages(settings.messages),
    automationEnabled: settings.automationEnabled,
  }
}

export async function saveFlow(flow: WaFlow): Promise<void> {
  const db = getAdminDb()
  try {
    // A full replace, so a field an Admin cleared does not survive in the stored copy.
    await db.collection(FLOWS_COLLECTION).doc(flow.id).set(flowToDoc(flow))
  } catch (error) {
    throw new Error(`Failed to save flow: ${error instanceof Error ? error.message : String(error)}`)
  }
  invalidateFlowCache()
}

/**
 * Removes an Admin's stored copy of a flow.
 *
 * A flow that also exists as a default comes back on the next read — deleting is
 * "reset to the shipped version", not "delete the product". Removing a product
 * from the menu is what the enable toggle is for.
 */
export async function deleteFlow(id: string): Promise<void> {
  const db = getAdminDb()
  try {
    // Deleting a flow that is not stored is not an error; it is already reset.
    await db.collection(FLOWS_COLLECTION).doc(id).delete()
  } catch (error) {
    throw new Error(`Failed to delete flow: ${error instanceof Error ? error.message : String(error)}`)
  }
  invalidateFlowCache()
}

export async function saveSettings(input: {
  messages?: Partial<WaMessages>
  automationEnabled?: boolean
}): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: new Date() }

  if (input.messages) {
    update.messages = JSON.stringify(input.messages)
  }
  if (input.automationEnabled !== undefined) {
    update.automationEnabled = input.automationEnabled
  }

  const db = getAdminDb()
  try {
    // Merging keeps a message save from wiping the automation switch, and the
    // other way round.
    await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).set(update, { merge: true })
  } catch (error) {
    throw new Error(
      `Failed to save WhatsApp settings: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  invalidateFlowCache()
}
