import type { Lead } from "@/lib/hooks/useLeads"
import { CLOSED_STATUSES, STATUS_PENDING_APPROVAL } from "@/lib/disbursement"
import { endOfDay, startOfDay, toMillis } from "@/lib/dates"

/**
 * The WhatsApp bot answered every qualification question and the lead passed.
 *
 * Sits between "New Lead" and "Contacted": the file is ready for a human but no
 * human has touched it, which is exactly what makes it worth its own queue. The
 * webhook writes this string too — see `STATUS_SYSTEM_QUALIFIED` in
 * `src/app/api/whatsapp/webhook/route.ts`.
 */
export const STATUS_SYSTEM_QUALIFIED = "System Qualified"

/**
 * Statuses a staff member's first real contact moves on to "Contacted".
 *
 * `System Qualified` belongs here for the same reason `New Lead` does: nobody
 * has spoken to the customer yet. Without it a qualified lead would stay in the
 * bot's queue forever, however many times it had been called.
 */
export const PRE_CONTACT_STATUSES: string[] = ["New Lead", "New", STATUS_SYSTEM_QUALIFIED]

/** Every status a lead can be moved to, in pipeline order. */
export const STATUS_OPTIONS = [
  "New Lead",
  STATUS_SYSTEM_QUALIFIED,
  "Contacted",
  "Interested",
  "Bank Processing",
  STATUS_PENDING_APPROVAL,
  "Approved",
  "Disbursed",
  "Rejected",
] as const

/** The subset shown as quick filter chips above the table. */
export const QUICK_STATUSES = [
  "New Lead",
  STATUS_SYSTEM_QUALIFIED,
  "Contacted",
  "Interested",
  "Bank Processing",
  STATUS_PENDING_APPROVAL,
  "Approved",
  "Disbursed",
  "Rejected",
]

/** Bilingual chip labels — staff read the Marathi first. */
export const STATUS_LABELS: Record<string, string> = {
  "All Statuses": "सर्व (All)",
  "New Lead": "नवीन (New)",
  [STATUS_SYSTEM_QUALIFIED]: "सिस्टम क्वालिफाईड (Qualified)",
  Contacted: "संपर्कित (Contacted)",
  Interested: "इच्छुक (Interested)",
  "Bank Processing": "बँक प्रोसेसिंग (Processing)",
  [STATUS_PENDING_APPROVAL]: "मंजुरी बाकी (Pending)",
  Approved: "मंजूर (Approved)",
  Disbursed: "डिस्बर्स (Disbursed)",
  Rejected: "रिजेक्टेड (Rejected)",
}

export const ALL_STATUSES = "All Statuses"
export const ALL_SOURCES = "All Sources"
export const ALL_PARTNERS = "All Partners"
export const ALL_TYPES = "All Types"
export const ALL_TIME = "All Time"
/** Midnight-to-midnight on the day the staff member is looking at the screen. */
export const TODAY = "Today"

export const SOURCE_OPTIONS = ["Landing", "Portal", "Bulk", "Chatbot", "Whatsapp ads"]
export const DATE_PRESETS = [ALL_TIME, TODAY, "Last 7 Days", "Last Month", "Custom Range"]

/**
 * "What needs me?" — orthogonal to status, because a lead can be overdue in
 * any status. Kept out of the status chips on purpose: mixing the two into one
 * row makes it impossible to ask for "overdue *and* Interested".
 */
export type Attention = "all" | "overdue" | "untouched" | "unassigned"

export const ATTENTION_LABELS: Record<Attention, string> = {
  all: "सर्व",
  overdue: "थकीत (Overdue)",
  untouched: "नवीन (Untouched)",
  unassigned: "Unassigned",
}

/**
 * Which side of the delete flag the screen is looking at.
 *
 * Admin only — every other role is served `active` whatever this says, because
 * `useLeads` never hands them a deleted lead in the first place. It sits in the
 * filter set rather than in a separate screen so a restored lead reappears
 * exactly where it was: New, Interested, Disbursed, wherever it had got to.
 */
export type DeletedView = "active" | "deleted" | "all"

export const DELETED_VIEW_LABELS: Record<DeletedView, string> = {
  active: "चालू (Active)",
  deleted: "काढलेल्या (Deleted)",
  all: "सर्व (All)",
}

export interface LeadFilters {
  search: string
  status: string
  attention: Attention
  source: string
  partner: string
  type: string
  datePreset: string
  dateRange: { start: string; end: string }
  cities: string[]
  deleted: DeletedView
}

export const EMPTY_FILTERS: LeadFilters = {
  search: "",
  status: ALL_STATUSES,
  attention: "all",
  source: ALL_SOURCES,
  partner: ALL_PARTNERS,
  type: ALL_TYPES,
  datePreset: ALL_TIME,
  dateRange: { start: "", end: "" },
  cities: [],
  // Deleted leads stay out of "clear all" — clearing the filters must not
  // suddenly fill an Admin's pipeline with files somebody removed.
  deleted: "active",
}

/**
 * How many of the *sheet's* filters are set. Search, status and attention are
 * excluded because each has its own always-visible control — counting them
 * would badge the "Filters" button for something the sheet cannot show.
 */
export function countActiveFilters(f: LeadFilters): number {
  return (
    (f.source !== ALL_SOURCES ? 1 : 0) +
    (f.partner !== ALL_PARTNERS ? 1 : 0) +
    (f.type !== ALL_TYPES ? 1 : 0) +
    (f.datePreset !== ALL_TIME ? 1 : 0) +
    (f.cities.length > 0 ? 1 : 0)
  )
}

/** A lead is overdue when its follow-up time has passed and the file is open. */
export function isOverdue(lead: Lead, now: number): boolean {
  if (CLOSED_STATUSES.includes(lead.status)) return false
  const due = toMillis(lead.followUpDate)
  return due !== null && due < now
}

/** A brand-new lead nobody has touched — these get the attention dot. */
export function isUntouched(lead: Lead): boolean {
  return (lead.status === "New Lead" || lead.status === "New") && !lead.lastActivityNote
}

/** The default status the Leads screen opens on. */
const DEFAULT_STATUS = "New Lead"

/**
 * What the screen opens on for a staff member who has never touched the
 * filters: today's new leads. `EMPTY_FILTERS` stays wide open on purpose, so
 * "Clear all" still means clear rather than "back to today".
 */
export const DEFAULT_FILTERS: LeadFilters = {
  ...EMPTY_FILTERS,
  status: DEFAULT_STATUS,
  datePreset: TODAY,
}

/**
 * Rebuilds a filter set from untrusted JSON (the saved cookie), keeping the
 * defaults for anything missing or of the wrong shape. A stale cookie written
 * by an older build must never be able to crash the screen.
 */
export function sanitizeFilters(value: unknown): LeadFilters | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const str = (key: string, fallback: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : fallback
  const range = (raw.dateRange ?? {}) as Record<string, unknown>

  return {
    search: str("search", ""),
    status: str("status", DEFAULT_STATUS),
    attention: (["all", "overdue", "untouched", "unassigned"] as const).includes(
      raw.attention as Attention
    )
      ? (raw.attention as Attention)
      : "all",
    source: str("source", ALL_SOURCES),
    partner: str("partner", ALL_PARTNERS),
    type: str("type", ALL_TYPES),
    datePreset: DATE_PRESETS.includes(str("datePreset", "")) ? str("datePreset", TODAY) : TODAY,
    dateRange: {
      start: typeof range.start === "string" ? range.start : "",
      end: typeof range.end === "string" ? range.end : "",
    },
    cities: Array.isArray(raw.cities) ? raw.cities.filter(c => typeof c === "string") : [],
    deleted: (["active", "deleted", "all"] as const).includes(raw.deleted as DeletedView)
      ? (raw.deleted as DeletedView)
      : "active",
  }
}

/**
 * Does this lead belong under `status`?
 *
 * Firestore holds both "New Lead" and "New" for brand-new files, which is why
 * `isUntouched` above checks for both. The status filter and the chip counts
 * were doing a plain `lead.status === status`, so every lead written with the
 * short spelling was invisible under the "नवीन (New)" chip and uncounted on it.
 * That was survivable while the screen opened on All Statuses; it is not now
 * that it opens on New Lead.
 */
export function matchesStatus(lead: Lead, status: string): boolean {
  if (status === ALL_STATUSES) return true
  if (status === "New Lead") return lead.status === "New Lead" || lead.status === "New"
  return lead.status === status
}

/**
 * The last remark a colleague actually typed about this lead.
 *
 * `lastActivityNote` holds whatever the CRM logged most recently, which is
 * usually the CRM describing itself — "Changed status to Approved", "Opened
 * direct WhatsApp chat panel". Those are not notes, and they buried the real
 * ones. `lastNote` is written only for hand-typed remarks (see
 * `logLeadActivity`); the fallback covers leads last touched before that field
 * existed, where the activity type is the only signal available.
 */
export function lastManualNote(lead: Lead): string {
  if (lead.lastNote) return lead.lastNote
  if (
    lead.lastActivityType === "Note" &&
    lead.lastActivityNote &&
    !lead.lastActivityNote.startsWith("Lead created manually by") &&
    !lead.lastActivityNote.includes("Placed a quick call") &&
    !lead.lastActivityNote.includes("Redirected to external WhatsApp") &&
    !lead.lastActivityNote.includes("Opened direct WhatsApp") &&
    !lead.lastActivityNote.startsWith("Partner initiated ")
  ) {
    return lead.lastActivityNote
  }
  return ""
}

/** Whole days a follow-up has been sitting past its due time. 0 when on time. */
export function overdueDays(lead: Lead, now: number): number {
  if (!isOverdue(lead, now)) return 0
  const due = toMillis(lead.followUpDate)
  return due === null ? 0 : Math.max(1, Math.floor((now - due) / 86_400_000))
}

/**
 * Applied separately from `applyFilters` so the segmented control can show a
 * live count for each option against the same search / date / city selection.
 */
export function filterByAttention(leads: Lead[], attention: Attention, now: number): Lead[] {
  switch (attention) {
    case "overdue":
      return leads.filter(lead => isOverdue(lead, now))
    case "untouched":
      return leads.filter(lead => isUntouched(lead))
    case "unassigned":
      return leads.filter(lead => !lead.assignedTo)
    default:
      return leads
  }
}

/**
 * Everything except the status filter, so the status chips can show live counts
 * for the current search / date / city selection.
 */
export function applyFilters(leads: Lead[], f: LeadFilters, now: number): Lead[] {
  const search = f.search.trim().toLowerCase()

  let from = 0
  let to = Number.POSITIVE_INFINITY
  if (f.datePreset === TODAY) {
    from = startOfDay(now)
    to = endOfDay(now)
  } else if (f.datePreset === "Last 7 Days") {
    from = now - 7 * 86_400_000
  } else if (f.datePreset === "Last Month") {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    from = d.getTime()
  } else if (f.datePreset === "Custom Range" && f.dateRange.start && f.dateRange.end) {
    from = new Date(f.dateRange.start).getTime()
    const end = new Date(f.dateRange.end)
    end.setHours(23, 59, 59, 999)
    to = end.getTime()
  }

  return leads.filter(lead => {
    // First, because it is the only filter that can hide a lead from a whole
    // role rather than from a search.
    if (f.deleted === "active" && lead.deleted === true) return false
    if (f.deleted === "deleted" && lead.deleted !== true) return false

    if (search) {
      const haystack = [lead.name, lead.fullName, lead.panName, lead.phone, lead.mobile, lead.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }

    if (f.source !== ALL_SOURCES && (lead.category || "Landing") !== f.source) return false
    if (f.partner !== ALL_PARTNERS && lead.partnerName !== f.partner) return false
    if (f.type !== ALL_TYPES && lead.type !== f.type) return false
    if (f.cities.length > 0 && !f.cities.includes((lead.city || "").trim())) return false

    if (from > 0 || to < Number.POSITIVE_INFINITY) {
      const created = toMillis(lead.createdAt)
      if (created === null || created < from || created > to) return false
    }

    return true
  })
}

/**
 * Sorts leads so that leads whose STATUS was changed (New, Contacted, Interested,
 * Processing, Pending, Disbursed, Rejected) rank at the VERY TOP of the list.
 * Editing general information (name, city, amount, remarks) does NOT move rank to top.
 */
export function sortLeads(leads: Lead[], now: number): Lead[] {
  return [...leads].sort((a, b) => {
    const statusTimeA = toMillis(a.statusUpdatedAt) ?? 0
    const statusTimeB = toMillis(b.statusUpdatedAt) ?? 0

    if (statusTimeA !== statusTimeB) {
      return statusTimeB - statusTimeA
    }

    const createdA = toMillis(a.createdAt) ?? toMillis(a.updatedAt) ?? 0
    const createdB = toMillis(b.createdAt) ?? toMillis(b.updatedAt) ?? 0
    return createdB - createdA
  })
}

/** Distinct values used to populate the filter sheet's dropdowns. */
export function facetsOf(leads: Lead[]) {
  const partners = new Set<string>()
  const types = new Set<string>()
  const cities = new Set<string>()

  leads.forEach(lead => {
    if (lead.category === "Partner" && lead.partnerName) partners.add(lead.partnerName)
    if (lead.type) types.add(lead.type)
    if (lead.city?.trim()) cities.add(lead.city.trim())
  })

  return {
    partners: Array.from(partners).sort(),
    types: Array.from(types).sort(),
    cities: Array.from(cities).sort(),
  }
}

/** Display name, in the order the business prefers it. */
export function leadName(lead: Lead): string {
  return lead.panName || lead.fullName || lead.name || "Name Pending"
}

export function leadPhone(lead: Lead): string {
  return lead.phone || lead.mobile || ""
}

/**
 * The key two records for the same customer share: the last ten digits, so
 * "9876543210", "+91 98765 43210" and "919876543210" all land together.
 */
function phoneKey(lead: Lead): string {
  const clean = leadPhone(lead).replace(/\D/g, "")
  return clean.length > 10 ? clean.slice(-10) : clean
}

export interface DedupedLeads {
  /** One row per customer — the most recently touched file for that number. */
  rows: Lead[]
  /** How many rows were folded away, for the count line. */
  merged: number
  /** Kept lead id → how many files share its number (always ≥ 2 when present). */
  copies: Map<string, number>
}

/**
 * One customer, one row.
 *
 * The same person reaches us more than once — the landing page, then a
 * WhatsApp ad, then a colleague typing them in — and every copy carried its own
 * follow-up date and status, so the pipeline counted one person as three and
 * two telecallers could work the same number without knowing.
 *
 * Nothing is deleted: the newest file wins the row and the older ones are
 * folded behind a badge on it. A lead with no phone number can never be matched
 * to anything, so it is always kept.
 */
export function dedupeLeads(leads: Lead[]): DedupedLeads {
  const freshness = (lead: Lead) =>
    toMillis(lead.updatedAt) ?? toMillis(lead.createdAt) ?? 0

  const kept = new Map<string, Lead>()
  const counts = new Map<string, number>()
  const rows: Lead[] = []
  let merged = 0

  for (const lead of leads) {
    const key = phoneKey(lead)
    if (!key) {
      rows.push(lead)
      continue
    }
    const existing = kept.get(key)
    if (!existing) {
      kept.set(key, lead)
      counts.set(key, 1)
      continue
    }
    merged++
    counts.set(key, (counts.get(key) ?? 1) + 1)
    if (freshness(lead) > freshness(existing)) kept.set(key, lead)
  }

  const copies = new Map<string, number>()
  for (const [key, lead] of kept) {
    rows.push(lead)
    const total = counts.get(key) ?? 1
    if (total > 1) copies.set(lead.id, total)
  }

  return { rows, merged, copies }
}

/** 10-digit local number → 91XXXXXXXXXX for wa.me links. */
export function whatsAppNumber(lead: Lead): string {
  const clean = leadPhone(lead).replace(/\D/g, "")
  return clean.length === 10 ? `91${clean}` : clean
}
