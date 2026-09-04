/**
 * Browser Local/Async Storage Manager for Techstar Money Onboarding
 * Ensures no draft data is lost on page refreshes, tab closures, or network cuts.
 */

export interface OnboardingDraftState {
  mobileNumber: string;
  isMobileVerified: boolean;
  currentStep: number;
  lastSavedAt: string;

  /** Canonical step key mirrored from the server (see `onboarding-steps`). */
  currentStepKey: string;

  // Step 1
  fullName: string;
  email: string;
  referredByDsaCode: string;

  // Step 2
  partnerType: "Individual" | "Firm";
  firmType: "Proprietorship" | "Partnership" | "Private Limited" | "Limited" | "LLP";
  businessName: string;
  panNumber: string;
  panValid: boolean;

  // Step 3
  contactPersonName: string;
  designation: string;
  dob: string;
  gender: string;

  // Step 4
  addressLine1: string;
  addressLine2: string;
  area: string;
  city: string;
  district: string;
  stateName: string;
  pinCode: string;

  // Step 5
  isGstRegistered: "Yes" | "No";
  gstin: string;
  gstValid: boolean;
  gstDetails?: any;

  // Step 6
  docUploadMethod: "digilocker" | "manual";
  aadhaarFrontDoc: any;
  aadhaarBackDoc: any;
  aadhaarCombined: boolean;
  panDoc: any;

  /** Nested shapes as persisted server-side, so a server draft rehydrates as-is. */
  bankDetails?: Record<string, any>;
  documents?: Record<string, any>;

  // Step 7
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: "Savings" | "Current";
  ifscValid: boolean;
  bankVerified: boolean;
  returnedBankName: string | null;
  bankMatchScore: number | null;

  // Step 8 & Status
  agreementSigned: boolean;
  agreementPdfUrl: string | null;
  submittedAppId: string | null;
}

const STORAGE_KEY = "tsm_onboarding_draft_v2";
const STORAGE_MOBILE_KEY = "tsm_onboarding_mobile";
const STORAGE_VERIFIED_KEY = "tsm_onboarding_verified";

/**
 * A local draft is a convenience for finishing a form on the same device, not
 * a record. Past this age it is dropped on read: onboarding takes days, not
 * weeks, and a month-old draft sitting on a shared or kiosk machine is a
 * liability rather than a feature.
 */
const DRAFT_TTL_DAYS = 7;
const DRAFT_TTL_MS = DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Never written to localStorage.
 *
 * The server draft is authoritative for every one of these (see
 * /api/onboarding/save-step and /api/onboarding/resume), so a second copy in
 * devtools-readable storage buys nothing and leaves a PAN, a GSTIN and a full
 * bank account number one `localStorage.getItem` away from whoever uses the
 * machine next. The mobile number stays -- it is the key the draft is looked
 * up by, and it already lives in `tsm_onboarding_mobile`.
 */
const PII_FIELDS = ["panNumber", "gstin", "email", "accountNumber", "confirmAccountNumber"] as const;

function stripPii(draft: Partial<OnboardingDraftState>): Partial<OnboardingDraftState> {
  const out: Record<string, unknown> = { ...draft };
  for (const f of PII_FIELDS) delete out[f];

  // The same fields again, in the nested shapes a server draft round-trips.
  if (out.bankDetails && typeof out.bankDetails === "object") {
    const { accountNumber: _dropped, ...restBank } = out.bankDetails as Record<string, unknown>;
    out.bankDetails = restBank;
  }
  return out as Partial<OnboardingDraftState>;
}

/** What the UI needs to tell the user what was restored, and from when. */
export interface DraftMeta {
  savedAt: Date | null;
  currentStep: number | null;
  /** Set when a draft was found but had aged past DRAFT_TTL_DAYS and was dropped. */
  expired: boolean;
}

export const OnboardingStorage = {
  /**
   * Returns the local draft, or null if there is none, it belongs to a
   * different mobile number, or it has aged out. An expired draft is deleted
   * here rather than merely ignored, so the PII inside it stops existing the
   * first time anyone opens the page.
   */
  getDraft(mobile?: string): Partial<OnboardingDraftState> | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: Partial<OnboardingDraftState> = JSON.parse(raw);

      if (OnboardingStorage.isExpired(parsed)) {
        OnboardingStorage.clearDraft();
        return null;
      }
      if (mobile && parsed.mobileNumber && parsed.mobileNumber !== mobile) {
        // Draft belongs to a different number.
        return null;
      }
      return parsed;
    } catch (e) {
      console.error("Error reading onboarding draft from storage:", e);
      return null;
    }
  },

  isExpired(draft: Partial<OnboardingDraftState>): boolean {
    if (!draft.lastSavedAt) return false;
    const saved = new Date(draft.lastSavedAt).getTime();
    if (Number.isNaN(saved)) return false;
    return Date.now() - saved > DRAFT_TTL_MS;
  },

  /**
   * When the local draft was last written and how far it claims to have got.
   * The page compares this against the server draft's own timestamp so a
   * disagreement is shown to the partner rather than resolved by whichever
   * request happened to land second.
   */
  getDraftMeta(): DraftMeta {
    const empty: DraftMeta = { savedAt: null, currentStep: null, expired: false };
    if (typeof window === "undefined") return empty;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const parsed: Partial<OnboardingDraftState> = JSON.parse(raw);
      if (OnboardingStorage.isExpired(parsed)) return { ...empty, expired: true };
      const saved = parsed.lastSavedAt ? new Date(parsed.lastSavedAt) : null;
      return {
        savedAt: saved && !Number.isNaN(saved.getTime()) ? saved : null,
        currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : null,
        expired: false,
      };
    } catch (e) {
      console.error("Error reading onboarding draft metadata:", e);
      return empty;
    }
  },

  saveDraft(partial: Partial<OnboardingDraftState>): void {
    if (typeof window === "undefined") return;
    try {
      const current = OnboardingStorage.getDraft() || {};
      const updated: Partial<OnboardingDraftState> = stripPii({
        ...current,
        ...partial,
      });
      updated.lastSavedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (updated.mobileNumber) {
        localStorage.setItem(STORAGE_MOBILE_KEY, updated.mobileNumber);
      }
      if (updated.isMobileVerified) {
        localStorage.setItem(STORAGE_VERIFIED_KEY, "true");
      }
    } catch (e) {
      console.error("Error saving onboarding draft to storage:", e);
    }
  },

  getSavedMobile(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_MOBILE_KEY) || null;
  },

  isVerified(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_VERIFIED_KEY) === "true";
  },

  clearDraft(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_MOBILE_KEY);
      localStorage.removeItem(STORAGE_VERIFIED_KEY);
    } catch (e) {
      console.error("Error clearing onboarding draft:", e);
    }
  },
};
