/**
 * Reading timestamps in the browser, whatever shape they arrive in.
 *
 * During the move off Firestore the same field can reach a component as a Firestore
 * `Timestamp` (from a component not yet migrated), as an ISO string (from an API route
 * going through `serializeDoc`), or as a `Date`. Rather than a flag day, every consumer
 * goes through `toDate()` and stops caring which it got.
 *
 * This replaces the ad-hoc comparators scattered across the app — `a.createdAt.seconds
 * - b.createdAt.seconds` and friends — which return `NaN` or `0` the moment the value
 * stops being a Firestore Timestamp, silently leaving lists in insertion order.
 */

export type TimeLike =
  | Date
  | string
  | number
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | { _seconds: number; _nanoseconds?: number }
  | null
  | undefined

/** A `Date`, or null when the value is missing or unparseable. Never throws. */
export function toDate(value: TimeLike): Date | null {
  if (value === null || value === undefined || value === "") return null

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number }
  if (typeof v.toDate === "function") {
    try {
      const d = v.toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  if (typeof v._seconds === "number") return new Date(v._seconds * 1000)
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000)

  return null
}

/** Epoch milliseconds, or 0 when absent — safe to subtract directly in a comparator. */
export function toMillis(value: TimeLike): number {
  const d = toDate(value)
  return d ? d.getTime() : 0
}

/**
 * Comparator for newest-first sorting.
 *
 * Documents with no usable timestamp sort last rather than first, which is what the
 * lists want: a record missing `createdAt` is nearly always incomplete, not newest.
 */
export function byNewest<T>(getTime: (item: T) => TimeLike) {
  return (a: T, b: T): number => {
    const ta = toMillis(getTime(a))
    const tb = toMillis(getTime(b))
    if (ta === tb) return 0
    if (ta === 0) return 1
    if (tb === 0) return -1
    return tb - ta
  }
}

/** Comparator for oldest-first sorting, used by chat threads. */
export function byOldest<T>(getTime: (item: T) => TimeLike) {
  return (a: T, b: T): number => {
    const ta = toMillis(getTime(a))
    const tb = toMillis(getTime(b))
    if (ta === tb) return 0
    if (ta === 0) return 1
    if (tb === 0) return -1
    return ta - tb
  }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "Just now", "5m ago", "3h ago", "2d ago", then a plain date. */
export function timeAgo(value: TimeLike, now: number = Date.now()): string {
  const d = toDate(value)
  if (!d) return ""

  const delta = now - d.getTime()
  if (delta < 0) return "Just now"
  if (delta < MINUTE) return "Just now"
  if (delta < HOUR) return Math.floor(delta / MINUTE) + "m ago"
  if (delta < DAY) return Math.floor(delta / HOUR) + "h ago"
  if (delta < 7 * DAY) return Math.floor(delta / DAY) + "d ago"

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

/** Date and time in the Indian format the rest of the UI uses. Empty string when absent. */
export function formatDateTime(value: TimeLike): string {
  const d = toDate(value)
  if (!d) return ""
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Date only, in the Indian format. Empty string when absent. */
export function formatDate(value: TimeLike): string {
  const d = toDate(value)
  if (!d) return ""
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

/** Clock time only, used by chat bubbles. Empty string when absent. */
export function formatTime(value: TimeLike): string {
  const d = toDate(value)
  if (!d) return ""
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}
