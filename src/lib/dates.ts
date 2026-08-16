/**
 * Date helpers for the CRM.
 *
 * Firestore hands back `Timestamp` objects, the WhatsApp webhook writes ISO
 * strings and some older documents hold `{ seconds }` — anything that calls
 * `new Date(value)` on the raw field silently produces `Invalid Date` for two of
 * those three shapes. Always go through `toDate`.
 *
 * Every function takes `now` explicitly instead of calling `Date.now()`:
 * reading the clock during render is impure, and passing the value from
 * `useNow()` makes relative times actually re-render as they age.
 */

interface TimestampLike {
  toDate: () => Date
}

interface SecondsLike {
  seconds: number
}

function hasToDate(value: unknown): value is TimestampLike {
  return typeof value === "object" && value !== null && typeof (value as TimestampLike).toDate === "function"
}

function hasSeconds(value: unknown): value is SecondsLike {
  return typeof value === "object" && value !== null && typeof (value as SecondsLike).seconds === "number"
}

/** Firestore Timestamp | `{seconds}` | Date | ISO string | millis → Date. */
export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (hasToDate(value)) {
    const d = value.toDate()
    return isNaN(d.getTime()) ? null : d
  }
  if (hasSeconds(value)) return new Date(value.seconds * 1000)
  if (typeof value === "number") return new Date(value)
  if (typeof value === "string") {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function toMillis(value: unknown): number | null {
  return toDate(value)?.getTime() ?? null
}

/** Midnight at the start of the day containing `now`. */
export function startOfDay(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(now: number): number {
  const d = new Date(now)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** "just now" · "12m ago" · "3h ago" · "2d ago". Empty string during SSR. */
export function timeAgo(value: unknown, now: number): string {
  const date = toDate(value)
  if (!date || !now) return ""
  const mins = Math.round((now - date.getTime()) / 60000)
  if (mins < 0) return "scheduled"
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/**
 * Relative time in both directions: "3h ago" for the past, "in 2h" for the
 * future. `timeAgo` collapses every future timestamp to the word "scheduled",
 * which is useless on a follow-up queue where the whole question is *when*.
 */
export function formatRelative(value: unknown, now: number): string {
  const date = toDate(value)
  if (!date || !now) return ""

  const deltaMs = date.getTime() - now
  const future = deltaMs > 0
  const mins = Math.round(Math.abs(deltaMs) / 60000)

  if (mins < 1) return "now"
  const label =
    mins < 60
      ? `${mins}m`
      : mins < 1440
        ? `${Math.round(mins / 60)}h`
        : `${Math.round(mins / 1440)}d`

  return future ? `in ${label}` : `${label} ago`
}

/** 24-hour clock time, e.g. "14:05". */
export function formatTime(value: unknown): string {
  const date = toDate(value)
  if (!date) return ""
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
}

/** "6 Aug" — short day label for chart axes and lists. */
export function formatDayShort(value: unknown): string {
  const date = toDate(value)
  if (!date) return ""
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/**
 * "07 May 2025, 12:45 PM" — the full stamp for a "Created at" table column,
 * where the year matters and a relative "3mo ago" does not help anyone.
 */
export function formatDateTime(value: unknown): string {
  const date = toDate(value)
  if (!date) return ""
  const day = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  return `${day}, ${time.toUpperCase()}`
}
