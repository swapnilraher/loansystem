/**
 * The banker directory: 17,000 rows shipped in `data/banker_list.json`, plus
 * whatever an Admin has since changed.
 *
 * The JSON file is read-only at runtime — it is baked into the deployment, and
 * the CRM cannot write to it. So edits live in Firestore and are layered over
 * the file on read. That keeps the shipped list intact (nothing is ever lost to
 * a bad edit) while making every field of it changeable from the CRM.
 *
 * A "banker" here is a person at one bank in one district. The file stores one
 * row per product they cover, so the same person appears up to a dozen times;
 * grouping them back together is what makes "change their mobile number" one
 * edit instead of twelve.
 *
 * Server-only — it reads the filesystem and mints service-account credentials.
 */

import fs from "fs"
import path from "path"
import { firestoreFetch } from "@/lib/firestore-rest"

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo"
const PROJECT_ID = "dsa-loan"
const COLLECTION = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/bankers`

/** One banker, as the CRM edits them. */
export interface Banker {
  /** Firestore document id for an edited or added banker; the group key otherwise. */
  id: string
  state: string
  district: string
  bank: string
  branch: string
  name: string
  mobile: string
  /** Loan products this banker handles — the banker search filters on these. */
  products: string[]
  /** `false` hides them from the lookup without destroying the record. */
  active: boolean
  /** `true` once an Admin has edited or added them. */
  edited: boolean
  updatedByName?: string
  updatedAt?: string
}

/** The row shape the existing banker lookup expects. */
export interface BankerRow {
  state: string
  district: string
  product: string
  lender: string
  name: string
  contact: string
  branch: string
}

interface RawBanker {
  s: string
  c: string
  p: string
  l: string
  n: string
  o: string | number
}

// ─── The shipped file ────────────────────────────────────────────────────────

let baseGroups: Map<string, Banker> | null = null

/** Stable, content-derived id for a banker in the shipped file. */
function groupKey(state: string, district: string, bank: string, name: string, mobile: string): string {
  const source = [state, district, bank, name, mobile]
    .map(part => (part || "").toString().trim().toLowerCase())
    .join("|")
  // djb2 — short, stable across processes, and only ever used as a document id.
  let hash = 5381
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) >>> 0
  }
  return `b${hash.toString(36)}`
}

function readBaseFile(): RawBanker[] {
  const filePath = path.join(process.cwd(), "data", "banker_list.json")
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("[bankers] Could not read banker_list.json:", error)
    return []
  }
}

/**
 * The shipped list, one entry per banker rather than per product row.
 *
 * Parsed once per process: it is a 2.7 MB file and the result is immutable.
 */
function loadBaseGroups(): Map<string, Banker> {
  if (baseGroups) return baseGroups

  const groups = new Map<string, Banker>()
  for (const raw of readBaseFile()) {
    const state = (raw.s || "").trim()
    const district = (raw.c || "").trim()
    const bank = (raw.l || "").trim()
    const name = (raw.n || "").trim()
    const mobile = String(raw.o ?? "").trim()
    const product = (raw.p || "").trim()
    if (!state || !name) continue

    const id = groupKey(state, district, bank, name, mobile)
    const existing = groups.get(id)
    if (existing) {
      if (product && !existing.products.includes(product)) existing.products.push(product)
      continue
    }
    groups.set(id, {
      id,
      state,
      district,
      bank,
      branch: "",
      name,
      mobile,
      products: product ? [product] : [],
      active: true,
      edited: false,
    })
  }

  baseGroups = groups
  return groups
}

// ─── Admin edits ─────────────────────────────────────────────────────────────

const OVERLAY_TTL_MS = 30_000
let overlayCache: { rows: Banker[]; expiresAt: number } | null = null

export function invalidateBankerCache(): void {
  overlayCache = null
}

interface FirestoreDoc {
  name?: string
  fields?: Record<string, {
    stringValue?: string
    booleanValue?: boolean
    arrayValue?: { values?: { stringValue?: string }[] }
  }>
}

function docToBanker(doc: FirestoreDoc): Banker | null {
  const fields = doc.fields || {}
  const id = doc.name?.split("/").pop() || ""
  if (!id) return null
  return {
    id,
    state: fields.state?.stringValue || "",
    district: fields.district?.stringValue || "",
    bank: fields.bank?.stringValue || "",
    branch: fields.branch?.stringValue || "",
    name: fields.name?.stringValue || "",
    mobile: fields.mobile?.stringValue || "",
    products: (fields.products?.arrayValue?.values || [])
      .map(v => v.stringValue || "")
      .filter(Boolean),
    active: fields.active?.booleanValue !== false,
    edited: true,
    updatedByName: fields.updatedByName?.stringValue || "",
    updatedAt: fields.updatedAt?.stringValue || "",
  }
}

async function readOverlay(): Promise<Banker[]> {
  if (overlayCache && Date.now() < overlayCache.expiresAt) return overlayCache.rows

  const rows: Banker[] = []
  let pageToken = ""
  try {
    // Paged, because an Admin's edits accumulate and Firestore caps a list call.
    do {
      const url = `${COLLECTION}?key=${FIREBASE_API_KEY}&pageSize=300${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
      }`
      const res = await firestoreFetch(url)
      if (!res.ok) break
      const data = (await res.json()) as { documents?: FirestoreDoc[]; nextPageToken?: string }
      for (const doc of data.documents || []) {
        const banker = docToBanker(doc)
        if (banker) rows.push(banker)
      }
      pageToken = data.nextPageToken || ""
    } while (pageToken)
  } catch (error) {
    console.error("[bankers] Could not read the edits collection:", error)
  }

  overlayCache = { rows, expiresAt: Date.now() + OVERLAY_TTL_MS }
  return rows
}

/**
 * The shipped list with the Admin's edits applied.
 *
 * An edit keyed to a shipped banker replaces them outright; one that is not is a
 * banker the CRM added. Either way the file on disk is untouched, so resetting
 * an edit is a delete rather than a restore-from-backup.
 */
export async function loadBankers(): Promise<Banker[]> {
  const merged = new Map(loadBaseGroups())
  for (const edit of await readOverlay()) {
    if (!edit.active) {
      merged.delete(edit.id)
      continue
    }
    merged.set(edit.id, edit)
  }
  return [...merged.values()]
}

/** Flattened to one row per product, which is what the lookup card searches. */
export function toRows(bankers: Banker[]): BankerRow[] {
  const rows: BankerRow[] = []
  for (const banker of bankers) {
    for (const product of banker.products.length > 0 ? banker.products : [""]) {
      rows.push({
        state: banker.state,
        district: banker.district,
        product,
        lender: banker.bank,
        name: banker.name,
        contact: banker.mobile,
        branch: banker.branch,
      })
    }
  }
  return rows
}

// ─── Writes ──────────────────────────────────────────────────────────────────

function bankerToFields(banker: Banker, staffName: string): Record<string, unknown> {
  return {
    state: { stringValue: banker.state },
    district: { stringValue: banker.district },
    bank: { stringValue: banker.bank },
    branch: { stringValue: banker.branch || "" },
    name: { stringValue: banker.name },
    mobile: { stringValue: banker.mobile },
    products: {
      arrayValue: { values: banker.products.map(p => ({ stringValue: p })) },
    },
    active: { booleanValue: banker.active !== false },
    updatedByName: { stringValue: staffName },
    updatedAt: { timestampValue: new Date().toISOString() },
  }
}

/**
 * Creates or updates one banker.
 *
 * Editing a shipped banker writes a document under their group key, so the edit
 * lands on the same person the Admin was looking at — and editing them again
 * updates that document rather than stacking a second copy. Nothing is deleted
 * to change a name, a number, a bank or a district.
 */
export async function saveBanker(banker: Banker, staffName: string): Promise<string> {
  const id =
    banker.id ||
    groupKey(banker.state, banker.district, banker.bank, banker.name, banker.mobile)

  const res = await firestoreFetch(`${COLLECTION}/${encodeURIComponent(id)}?key=${FIREBASE_API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: bankerToFields({ ...banker, id }, staffName) }),
  })
  if (!res.ok) throw new Error(`Failed to save banker: ${await res.text()}`)

  invalidateBankerCache()
  return id
}

/**
 * Takes a banker out of the lookup.
 *
 * Written as `active: false` rather than removed, for the same reason a deleted
 * lead is only flagged: the shipped list cannot be edited, so a hard delete of
 * an override would silently resurrect the original row.
 */
export async function deactivateBanker(id: string, staffName: string): Promise<void> {
  const current = (await loadBankers()).find(b => b.id === id)
  if (!current) throw new Error("That banker is not in the directory.")
  await saveBanker({ ...current, id, active: false }, staffName)
}
