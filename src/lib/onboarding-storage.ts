/**
 * The copy of an in-progress onboarding kept in this browser.
 *
 * Purely a convenience for finishing a form on the same device after a refresh,
 * a dropped connection, or a closed tab. The server draft in
 * `partner_applications` is the record; this is a cache in front of it, and
 * every disagreement between the two is resolved in the server's favour and
 * shown to the partner rather than silently applied.
 */

/** Bookkeeping the page needs; the rest is whatever the wizard hands over. */
export interface OnboardingDraftMetaFields {
  mobileNumber?: string
  isMobileVerified?: boolean
  /** 1..8 — the wizard step this device was left on. */
  currentStep?: number
  /** Canonical lifecycle key mirrored from the server (see `onboarding-steps`). */
  currentStepKey?: string
  lastSavedAt?: string
}

export type OnboardingDraftState = OnboardingDraftMetaFields & Record<string, unknown>

const STORAGE_KEY = "tsm_onboarding_draft_v2"
const STORAGE_MOBILE_KEY = "tsm_onboarding_mobile"
const STORAGE_VERIFIED_KEY = "tsm_onboarding_verified"

/**
 * Past this age a local draft is dropped on read: onboarding takes days, not
 * weeks, and a month-old draft sitting on a shared or kiosk machine is a
 * liability rather than a feature.
 */
const DRAFT_TTL_DAYS = 7
const DRAFT_TTL_MS = DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000

/**
 * Never written to localStorage.
 *
 * The server draft is authoritative for every one of these, so a second copy in
 * devtools-readable storage buys nothing and leaves a PAN, a GSTIN and a full
 * bank account number one `localStorage.getItem` away from whoever uses the
 * machine next. The mobile number stays — it is the key the draft is looked up
 * by, and it already lives in `tsm_onboarding_mobile`.
 */
const PII_FIELDS = [
  "panNumber",
  "panDetails",
  "gstin",
  "gstDetails",
  "email",
  "dob",
  "aadhaarLast4",
  "aadhaarName",
  "accountNumber",
  "confirmAccountNumber",
  "alternateMobile",
] as const

function stripPii(draft: OnboardingDraftState): OnboardingDraftState {
  const out: Record<string, unknown> = { ...draft }
  for (const f of PII_FIELDS) delete out[f]

  // The same fields again, in the nested shapes a server draft round-trips.
  if (out.bankDetails && typeof out.bankDetails === "object") {
    const { accountNumber: _dropped, ...restBank } = out.bankDetails as Record<string, unknown>
    out.bankDetails = restBank
  }
  return out as OnboardingDraftState
}

/** What the UI needs to tell the partner what was restored, and from when. */
export interface DraftMeta {
  savedAt: Date | null
  currentStep: number | null
  /** Set when a draft was found but had aged past DRAFT_TTL_DAYS and was dropped. */
  expired: boolean
}

export const OnboardingStorage = {
  /**
   * The local draft, or null if there is none, it belongs to a different mobile
   * number, or it has aged out. An expired draft is deleted here rather than
   * merely ignored, so the PII inside it stops existing the first time anyone
   * opens the page.
   */
  getDraft(mobile?: string): OnboardingDraftState | null {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed: OnboardingDraftState = JSON.parse(raw)

      if (OnboardingStorage.isExpired(parsed)) {
        OnboardingStorage.clearDraft()
        return null
      }
      if (mobile && parsed.mobileNumber && parsed.mobileNumber !== mobile) return null
      return parsed
    } catch (e) {
      console.error("Error reading onboarding draft from storage:", e)
      return null
    }
  },

  isExpired(draft: OnboardingDraftState): boolean {
    if (!draft.lastSavedAt) return false
    const saved = new Date(draft.lastSavedAt).getTime()
    if (Number.isNaN(saved)) return false
    return Date.now() - saved > DRAFT_TTL_MS
  },

  /**
   * When the local draft was last written and how far it claims to have got.
   * The page compares this against the server draft so a disagreement is shown
   * to the partner rather than resolved by whichever request landed second.
   */
  getDraftMeta(): DraftMeta {
    const empty: DraftMeta = { savedAt: null, currentStep: null, expired: false }
    if (typeof window === "undefined") return empty
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return empty
      const parsed: OnboardingDraftState = JSON.parse(raw)
      if (OnboardingStorage.isExpired(parsed)) return { ...empty, expired: true }
      const saved = parsed.lastSavedAt ? new Date(parsed.lastSavedAt) : null
      return {
        savedAt: saved && !Number.isNaN(saved.getTime()) ? saved : null,
        currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : null,
        expired: false,
      }
    } catch (e) {
      console.error("Error reading onboarding draft metadata:", e)
      return empty
    }
  },

  saveDraft(partial: OnboardingDraftState): void {
    if (typeof window === "undefined") return
    try {
      const current = OnboardingStorage.getDraft() || {}
      const updated = stripPii({ ...current, ...partial })
      updated.lastSavedAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      if (updated.mobileNumber) localStorage.setItem(STORAGE_MOBILE_KEY, updated.mobileNumber)
      if (updated.isMobileVerified) localStorage.setItem(STORAGE_VERIFIED_KEY, "true")
    } catch (e) {
      console.error("Error saving onboarding draft to storage:", e)
    }
  },

  getSavedMobile(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(STORAGE_MOBILE_KEY) || null
  },

  isVerified(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_VERIFIED_KEY) === "true"
  },

  clearDraft(): void {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_MOBILE_KEY)
      localStorage.removeItem(STORAGE_VERIFIED_KEY)
    } catch (e) {
      console.error("Error clearing onboarding draft:", e)
    }
  },
}
