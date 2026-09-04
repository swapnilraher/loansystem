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

export const OnboardingStorage = {
  getDraft(mobile?: string): Partial<OnboardingDraftState> | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: Partial<OnboardingDraftState> = JSON.parse(raw);
      if (mobile && parsed.mobileNumber && parsed.mobileNumber !== mobile) {
        // Different mobile number draft
        return null;
      }
      return parsed;
    } catch (e) {
      console.warn("Error reading onboarding draft from storage:", e);
      return null;
    }
  },

  saveDraft(partial: Partial<OnboardingDraftState>): void {
    if (typeof window === "undefined") return;
    try {
      const current = OnboardingStorage.getDraft() || {};
      const updated: Partial<OnboardingDraftState> = {
        ...current,
        ...partial,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (updated.mobileNumber) {
        localStorage.setItem(STORAGE_MOBILE_KEY, updated.mobileNumber);
      }
      if (updated.isMobileVerified) {
        localStorage.setItem(STORAGE_VERIFIED_KEY, "true");
      }
    } catch (e) {
      console.warn("Error saving onboarding draft to storage:", e);
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
      console.warn("Error clearing onboarding draft:", e);
    }
  },
};
