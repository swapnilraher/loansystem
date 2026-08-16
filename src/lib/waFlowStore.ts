/**
 * Where the WhatsApp bot's flows and messages are stored, and how they are read.
 *
 * Server-only: it signs Firestore REST calls with the service account (see
 * `firestoreFetch`). The browser never reads this module — the CRM goes through
 * `/api/flows`, which is where the Admin-only check lives.
 *
 * The bot must not stop talking because a database read failed, so every read
 * path here degrades to `DEFAULT_CONFIG` (the flows that used to be hardcoded)
 * rather than throwing.
 */

import { firestoreFetch } from "@/lib/firestore-rest"
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

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo"
const PROJECT_ID = "dsa-loan"
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const FLOWS_PATH = `${BASE}/waFlows`
const SETTINGS_PATH = `${BASE}/waSettings/whatsapp`

/**
 * Documents written by the first flow builder, which was never wired to the bot
 * and stored questions as plain English strings with no conditions. They stay in
 * Firestore untouched, but the bot ignores them: running them would replace the
 * live three-language flows with an English skeleton nobody approved.
 */
const SCHEMA_VERSION = 2

/**
 * The webhook is called once per inbound message, so an uncached read would put
 * a Firestore round-trip in front of every reply. A minute is short enough that
 * an Admin editing a flow sees it live within one, and long enough that a busy
 * hour is not spent re-reading six documents.
 */
const CACHE_TTL_MS = 60_000

let cache: { config: WaFlowConfig; expiresAt: number } | null = null

/** Dropped after any write so the next message runs the new script. */
export function invalidateFlowCache(): void {
  cache = null
}

interface FirestoreDoc {
  name?: string
  fields?: Record<string, { stringValue?: string; booleanValue?: boolean; integerValue?: string }>
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function docToFlow(doc: FirestoreDoc): WaFlow | null {
  const fields = doc.fields || {}
  if (Number(fields.schemaVersion?.integerValue || "0") < SCHEMA_VERSION) return null

  return sanitizeFlow(
    {
      id: doc.name?.split("/").pop() || "",
      category: fields.category?.stringValue || "",
      label: parseJson(fields.label?.stringValue, undefined),
      intro: parseJson(fields.intro?.stringValue, undefined),
      steps: parseJson(fields.steps?.stringValue, []),
      enabled: fields.enabled?.booleanValue !== false,
      order: Number(fields.order?.integerValue || "99"),
    },
    doc.name?.split("/").pop() || ""
  )
}

function flowToFields(flow: WaFlow): Record<string, unknown> {
  return {
    // `name` is what the CRM lists the flow under; the bot keys on `category`.
    name: { stringValue: `${flow.category} Flow` },
    category: { stringValue: flow.category },
    label: { stringValue: JSON.stringify(flow.label || {}) },
    intro: { stringValue: JSON.stringify(flow.intro || {}) },
    steps: { stringValue: JSON.stringify(flow.steps || []) },
    enabled: { booleanValue: flow.enabled !== false },
    order: { integerValue: String(flow.order ?? 99) },
    schemaVersion: { integerValue: String(SCHEMA_VERSION) },
    updatedAt: { timestampValue: new Date().toISOString() },
  }
}

async function readStoredFlows(): Promise<WaFlow[]> {
  const res = await firestoreFetch(`${FLOWS_PATH}?key=${FIREBASE_API_KEY}&pageSize=100`)
  if (!res.ok) return []
  const data = (await res.json()) as { documents?: FirestoreDoc[] }
  if (!data.documents) return []
  return data.documents.map(docToFlow).filter((f): f is WaFlow => f !== null)
}

async function readSettings(): Promise<{ messages: Partial<WaMessages>; automationEnabled: boolean }> {
  const res = await firestoreFetch(`${SETTINGS_PATH}?key=${FIREBASE_API_KEY}`)
  // A 404 is the normal state until an Admin saves a message for the first time.
  if (!res.ok) return { messages: {}, automationEnabled: true }
  const doc = (await res.json()) as FirestoreDoc
  const fields = doc.fields || {}
  return {
    messages: sanitizeMessages(parseJson(fields.messages?.stringValue, {})),
    automationEnabled: fields.automationEnabled?.booleanValue !== false,
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
  const url = `${FLOWS_PATH}/${encodeURIComponent(flow.id)}?key=${FIREBASE_API_KEY}`
  const res = await firestoreFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: flowToFields(flow) }),
  })
  if (!res.ok) throw new Error(`Failed to save flow: ${await res.text()}`)
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
  const url = `${FLOWS_PATH}/${encodeURIComponent(id)}?key=${FIREBASE_API_KEY}`
  const res = await firestoreFetch(url, { method: "DELETE" })
  if (!res.ok && res.status !== 404) throw new Error(`Failed to delete flow: ${await res.text()}`)
  invalidateFlowCache()
}

export async function saveSettings(input: {
  messages?: Partial<WaMessages>
  automationEnabled?: boolean
}): Promise<void> {
  const fields: Record<string, unknown> = {
    updatedAt: { timestampValue: new Date().toISOString() },
  }
  const mask = ["updatedAt"]

  if (input.messages) {
    fields.messages = { stringValue: JSON.stringify(input.messages) }
    mask.push("messages")
  }
  if (input.automationEnabled !== undefined) {
    fields.automationEnabled = { booleanValue: input.automationEnabled }
    mask.push("automationEnabled")
  }

  // An explicit mask keeps a message save from wiping the automation switch, and
  // the other way round.
  const query = mask.map(f => `updateMask.fieldPaths=${f}`).join("&")
  const res = await firestoreFetch(`${SETTINGS_PATH}?key=${FIREBASE_API_KEY}&${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`Failed to save WhatsApp settings: ${await res.text()}`)
  invalidateFlowCache()
}
