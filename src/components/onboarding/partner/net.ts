/**
 * Network and message helpers shared by every step of the wizard.
 *
 * Lifted out of the old single-file onboarding page unchanged in behaviour: a
 * partner who has lost signal must be told to check their connection, not to
 * check the form they filled in correctly.
 */

import type { ErrorKind } from "@/components/onboarding/FormErrorRegion"

/** A hung request becomes a timeout the UI can name, rather than a spinner. */
export const REQUEST_TIMEOUT_MS = 30000

export async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
}

export function messageFor(err: unknown, fallback: string): string {
  const detail = (err as { message?: string })?.message
  return detail || fallback
}

/**
 * A `fetch` that rejects rather than resolving is always transport — the server
 * never got the request or never answered. Everything that resolves with a
 * non-2xx has a real message from our own API and stays "validation".
 */
export function classifyError(err: unknown): ErrorKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline"
  const name = (err as { name?: string })?.name
  if (name === "AbortError" || name === "TimeoutError") return "timeout"
  if (err instanceof TypeError) return "network"
  return "validation"
}

/**
 * A loggable form of a thrown value.
 *
 * `console.error("...", { error: err })` renders an Error as the literal string
 * "[object Error]" in the browser overlay, which is how a plain "subscription
 * has expired" from the KYC provider reached a developer as no information at
 * all. Always log through this.
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.stack || `${err.name}: ${err.message}`
  if (typeof err === "string") return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

/**
 * Whether a failed verification is the provider's problem rather than the
 * partner's.
 *
 * Our KYC vendor answers an unpaid or misconfigured account with a 401 whose
 * body says so in as many words. That is not something an applicant can act on,
 * and showing them the raw text both alarms them and leaks our vendor
 * relationship onto a public page. Every such failure is reported as a
 * temporary outage instead — the checks are all optional, so the honest advice
 * is simply to carry on.
 */
export function isProviderOutage(status: number | undefined, message: string): boolean {
  if (status === 401 || status === 402 || status === 403) return true
  if (typeof status === "number" && status >= 500) return true
  return /subscription|auth(entication)? failed|unauthori[sz]ed|quota|credit|not configured|expired/i.test(message)
}

/**
 * What a partner is told when a check could not run. Deliberately says nothing
 * about which vendor, and deliberately says they may continue — because they
 * may: none of the instant checks gate a step.
 */
export const PROVIDER_UNAVAILABLE =
  "Instant verification is unavailable right now. This does not stop you — continue, and our team will verify this during review."

export function messageForKind(kind: ErrorKind, fallback: string): string {
  if (kind === "offline") return "You are offline. Your answers are safe on this device — reconnect and try again."
  if (kind === "timeout") return "That request took too long. Nothing was lost — press the button again to retry."
  if (kind === "network") return "Could not reach Techstar Money. Check your connection and try again."
  return fallback
}

/** "12 minutes ago" beats an ISO string when the point is "is this recent?". */
export function formatWhen(d: Date): string {
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

/**
 * How closely the name a bank or PAN record returns matches the name on the
 * application. Token-based rather than exact, because "RAHUL S PATIL" and
 * "Rahul Sudhir Patil" are the same person and an exact check would reject the
 * majority of genuine accounts.
 */
export function nameMatchScore(a: string, b: string): number {
  if (!a || !b) return 0
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  const s1 = norm(a)
  const s2 = norm(b)
  if (s1 === s2) return 100
  const t1 = s1.split(/\s+/).filter(Boolean)
  const t2 = s2.split(/\s+/).filter(Boolean)
  if (!t1.length || !t2.length) return 0
  const hits = (from: string[], against: string[]) =>
    from.filter(x => against.some(y => y.includes(x) || x.includes(y))).length
  return Math.round(Math.max((hits(t1, t2) / t1.length) * 100, (hits(t2, t1) / t2.length) * 100))
}

/** Age in whole years on a given date string, or null when unparseable. */
export function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

/** Bounds for the date-of-birth control: DSA partners must be 18 to 80. */
export function dobBounds() {
  const t = new Date()
  const iso = (d: Date) => d.toISOString().split("T")[0]
  return {
    max: iso(new Date(t.getFullYear() - 18, t.getMonth(), t.getDate())),
    min: iso(new Date(t.getFullYear() - 80, t.getMonth(), t.getDate())),
  }
}
