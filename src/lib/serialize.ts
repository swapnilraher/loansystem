/**
 * The wire contract between API routes and the browser: ISO 8601 strings on the wire,
 * real `Date` objects in MongoDB.
 *
 * This exists because the Firestore-shaped adapter cannot make dates survive HTTP. The
 * `Date.prototype.toDate`/`toMillis` polyfill in `mongo-adapter.ts` is server-only —
 * `JSON.stringify` consults `toJSON`, which the polyfill does not patch, so a BSON Date
 * reaches the client as a bare ISO string with no `.toDate()`, no `.toMillis()` and no
 * `.seconds`. Client code written against Firestore Timestamps then reads `undefined`
 * and degrades silently: sort comparators return 0 and lists quietly fall back to
 * insertion order, relative timestamps render "Just now" forever. Nothing throws, and
 * no build or type check catches it.
 *
 * The inbound direction matters just as much. If ISO strings are written straight into
 * Mongo, a field ends up holding both strings and Dates, and BSON type ordering sorts
 * every string before every date — so `orderBy("createdAt", "desc")` returns two
 * separate blocks and the newest documents stop appearing first.
 */

/** Field names carrying a timestamp, revived to `Date` on the way into the database. */
const TIMESTAMP_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "timestamp",
  "statusUpdatedAt",
  "followUpDate",
  "joinedAt",
  "readAt",
  "settledAt",
  "approvedAt",
  "sentAt",
  "expiresAt",
  "lastLogin",
  "signedAt",
  "deliveredAt",
  "processedAt",
  "completedAt",
  "startedAt",
  "date",
  // Written by logLeadActivity's sync back onto the lead. Without these the column
  // holds both strings and Dates, and BSON orders every string before every date.
  "lastActivityTime",
  "lastNoteTime",
])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

/**
 * Any timestamp shape this codebase can produce, as an ISO string.
 *
 * The shapes accumulated for real reasons: `Date` from Mongo, `{_seconds}` from
 * documents the admin SDK wrote, `{seconds}` from the client SDK, `toDate()` from a
 * live Firestore Timestamp, and plain strings from data already migrated.
 */
export function toIso(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === "string") return value
  if (typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  const v = value as { toDate?: () => Date; _seconds?: number; seconds?: number }
  if (typeof v.toDate === "function") {
    try {
      return v.toDate().toISOString()
    } catch {
      return null
    }
  }
  if (typeof v._seconds === "number") return new Date(v._seconds * 1000).toISOString()
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000).toISOString()

  return null
}

/**
 * A document ready to be sent as JSON: every Date becomes an ISO string, at any depth.
 *
 * Call this on everything leaving an API route. It is deliberately shape-agnostic
 * rather than field-driven, so a timestamp nested inside an array or a sub-object is
 * converted too.
 */
export function serializeDoc<T>(input: T): T {
  return walk(input) as T
}

function walk(value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (value instanceof Date) return toIso(value)
  if (Array.isArray(value)) return value.map(walk)

  if (typeof value === "object") {
    const v = value as Record<string, unknown> & {
      toDate?: () => Date
      _seconds?: number
      seconds?: number
      _nanoseconds?: number
      nanoseconds?: number
    }
    // Timestamp-shaped objects are values, not containers — convert rather than recurse.
    const looksLikeTimestamp =
      typeof v.toDate === "function" ||
      (typeof v._seconds === "number" && typeof v._nanoseconds === "number") ||
      (typeof v.seconds === "number" && typeof v.nanoseconds === "number")
    if (looksLikeTimestamp) return toIso(v)

    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v)) out[k] = walk(val)
    return out
  }

  return value
}

/** Convenience for the common `serializeDoc` over a list of snapshots' data. */
export function serializeDocs<T>(input: T[]): T[] {
  return input.map(item => serializeDoc(item))
}

/**
 * The inverse, for data arriving from the browser: ISO strings on known timestamp
 * fields become `Date` objects so MongoDB stores one type per field.
 *
 * Only recognised field names are revived. A blanket "convert anything ISO-shaped"
 * rule would corrupt genuine string fields that happen to hold a date the user typed.
 */
export function reviveDates<T>(input: T): T {
  return reviveWalk(input) as T
}

function reviveWalk(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value

  if (typeof value === "string") {
    if (key && TIMESTAMP_FIELDS.has(key) && ISO_DATE.test(value)) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) return d
    }
    return value
  }

  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map(item => reviveWalk(item, key))

  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(value as Record<string, unknown>)) {
      out[k] = reviveWalk(val, k)
    }
    return out
  }

  return value
}
