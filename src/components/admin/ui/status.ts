/**
 * Status → tone mapping for the whole CRM.
 *
 * Colour is decided by what a status *means*, not by where it sits in the
 * pipeline. Seven tones cover leads, disbursal approvals, payout ledgers and
 * account states, so a new status never needs a new colour — only a new row in
 * `STATUS_TONES`. Unknown statuses fall back to `neutral` rather than throwing.
 */

export type Tone = "neutral" | "info" | "violet" | "cyan" | "warn" | "success" | "danger" | "subtle"

/** Utility classes for a tone, driven entirely by the admin token layer. */
export const TONE_CLASSES: Record<Tone, { soft: string; dot: string; text: string }> = {
  neutral: {
    soft: "bg-tone-neutral text-tone-neutral-fg border-tone-neutral-bd",
    dot: "bg-tone-neutral-fg",
    text: "text-tone-neutral-fg",
  },
  subtle: {
    soft: "bg-tone-neutral text-tone-neutral-fg border-tone-neutral-bd",
    dot: "bg-tone-neutral-fg",
    text: "text-tone-neutral-fg",
  },
  info: {
    soft: "bg-tone-info text-tone-info-fg border-tone-info-bd",
    dot: "bg-tone-info-fg",
    text: "text-tone-info-fg",
  },
  violet: {
    soft: "bg-tone-violet text-tone-violet-fg border-tone-violet-bd",
    dot: "bg-tone-violet-fg",
    text: "text-tone-violet-fg",
  },
  cyan: {
    soft: "bg-tone-cyan text-tone-cyan-fg border-tone-cyan-bd",
    dot: "bg-tone-cyan-fg",
    text: "text-tone-cyan-fg",
  },
  warn: {
    soft: "bg-tone-warn text-tone-warn-fg border-tone-warn-bd",
    dot: "bg-tone-warn-fg",
    text: "text-tone-warn-fg",
  },
  success: {
    soft: "bg-tone-success text-tone-success-fg border-tone-success-bd",
    dot: "bg-tone-success-fg",
    text: "text-tone-success-fg",
  },
  danger: {
    soft: "bg-tone-danger text-tone-danger-fg border-tone-danger-bd",
    dot: "bg-tone-danger-fg",
    text: "text-tone-danger-fg",
  },
}

/**
 * Every status string written to Firestore today, lower-cased.
 * neutral = dormant · info = needs first touch · violet = engaged ·
 * cyan = with the bank · warn = waiting on someone · success = won ·
 * danger = lost or broken.
 */
const STATUS_TONES: Record<string, Tone> = {
  // Lead pipeline
  "new": "info",
  "new lead": "info",
  // The bot qualified it and nobody has called yet — waiting on us.
  "system qualified": "warn",
  "contacted": "info",
  "interested": "violet",
  "future prospect": "violet",
  "documents received": "violet",
  "documents pending": "warn",
  "login to bank": "cyan",
  "processed": "cyan",
  "under process": "neutral",
  "approved": "success",
  "sanctioned": "success",
  "bank processing": "cyan",
  "disbursement approval pending": "warn",
  "disbursed": "success",
  "not interested": "neutral",
  "rejected": "danger",
  "cnr": "neutral",
  "switch off": "neutral",
  "invalid number": "danger",

  // Disbursal approval state
  "pending": "warn",

  // Payout / commission ledgers
  "earned": "success",
  "under settlement": "warn",
  "paid": "success",
  "settled": "success",
  "reversed": "neutral",

  // Account + integration states
  "active": "success",
  "inactive": "neutral",
  "disabled": "danger",
  "live": "success",
  "draft": "neutral",
  "failed": "danger",
  "error": "danger",
}

export function toneForStatus(status?: string | null): Tone {
  if (!status) return "neutral"
  return STATUS_TONES[status.trim().toLowerCase()] ?? "neutral"
}
