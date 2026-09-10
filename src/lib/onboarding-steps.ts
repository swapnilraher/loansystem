/**
 * Canonical onboarding step state for the DSA partner flow.
 *
 * A single source of truth shared by the API routes and the onboarding /
 * login pages so that "where is this partner right now?" is answered the
 * same way on the server and on the client.
 *
 * Two layers live here on purpose:
 *
 *   - `ONBOARDING_STEPS` is the coarse, persisted lifecycle a
 *     `partner_applications` document moves through. Admin screens and the
 *     older API responses read these, so they do not change.
 *   - `PARTNER_ONBOARDING_STEPS` is the 8-step wizard a partner actually
 *     sees. `uiStepFor` maps one onto the other, so "where is this partner
 *     right now?" is answered the same way on the server and on the client
 *     — after a refresh, on another device, or after logging out and back in.
 */

export const ONBOARDING_STEPS = [
  "MOBILE_VERIFICATION",
  "BASIC_DETAILS",
  "BUSINESS_DETAILS",
  "DOCUMENTS",
  "PREVIEW",
  "AGREEMENT",
  "COMPLETED",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type StepStatus = "pending" | "completed";

export interface OnboardingStepStatuses {
  mobileVerificationStatus: StepStatus;
  basicDetailsStatus: StepStatus;
  businessDetailsStatus: StepStatus;
  documentsStatus: StepStatus;
  previewStatus: StepStatus;
  agreementStatus: StepStatus;
}

export interface OnboardingState extends OnboardingStepStatuses {
  currentStep: OnboardingStep;
  /** 1..8 — the wizard step the onboarding page should open. */
  uiStep: PartnerStepId;
  /** Per-step completion for the 8-step wizard, keyed by step id. */
  stepDone: Record<PartnerStepId, boolean>;
  isMobileVerified: boolean;
  isSubmitted: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  isApproved: boolean;
}

/**
 * The 8 steps a partner sees. Order is the order they are walked through, and
 * the `id` is what gets persisted as `currentStep` — so renumbering these is a
 * data migration, not a cosmetic change.
 *
 * `title` is deliberately short: it has to fit a sidebar rail at 320px and a
 * phone header at 360px without truncating.
 */
export const PARTNER_ONBOARDING_STEPS = [
  { id: 1, key: "BASIC_INFO", title: "Basic information", description: "Who is applying" },
  { id: 2, key: "BUSINESS", title: "Business details", description: "Entity type & GST" },
  { id: 3, key: "CONTACT", title: "Contact & address", description: "Where we reach you" },
  { id: 4, key: "KYC", title: "KYC verification", description: "PAN, Aadhaar & date of birth" },
  { id: 5, key: "BANK", title: "Bank account", description: "Where your payouts land" },
  { id: 6, key: "DOCUMENTS", title: "Document upload", description: "Proofs we file with lenders" },
  { id: 7, key: "REVIEW", title: "Review & confirm", description: "Sign the MOU and submit" },
  { id: 8, key: "STATUS", title: "Approval status", description: "Track the review" },
] as const;

export type PartnerStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PartnerStepKey = (typeof PARTNER_ONBOARDING_STEPS)[number]["key"];

/** The last step a partner fills in. Step 8 is a read-only outcome screen. */
export const LAST_INPUT_STEP: PartnerStepId = 7;

export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PINCODE_RE = /^\d{6}$/;
export const MOBILE_RE = /^[6-9]\d{9}$/;
export const AADHAAR_RE = /^\d{12}$/;

const SUBMITTED_STATUSES = ["under_review", "submitted", "submitted_for_review", "approved", "active", "rejected"];

function done(value: unknown): StepStatus {
  return value ? "completed" : "pending";
}

/** True once the application has left the partner's hands. */
export function isApplicationSubmitted(app: any): boolean {
  if (!app) return false;
  const status = String(app.status || "").toLowerCase();
  return Boolean(
    SUBMITTED_STATUSES.includes(status) ||
      app.submittedAt ||
      app.isApplicationLocked ||
      (app.applicationId && !String(app.applicationId).startsWith("TSM-DRAFT-"))
  );
}

export function hasBasicDetails(app: any): boolean {
  if (!app) return false;
  const name = app.fullName || app.contactPersonName;
  return Boolean(
    name &&
      app.email &&
      app.panNumber &&
      app.dob &&
      app.addressLine1 &&
      app.city &&
      app.stateName &&
      app.pinCode
  );
}

export function hasBusinessDetails(app: any): boolean {
  if (!app) return false;
  // GST is optional (partners may declare "No"), bank payout details are not.
  const gstAnswered = app.isGstRegistered === "No" || Boolean(app.gstin);
  const bank = app.bankDetails || {};
  return Boolean(gstAnswered && bank.accountNumber && bank.ifsc);
}

export function hasDocuments(app: any): boolean {
  const docs = app?.documents || {};
  const hasPan = Boolean(docs.panDoc);
  const hasAadhaar = Boolean(docs.aadhaarDoc || docs.aadhaarFrontDoc);
  return hasPan && hasAadhaar;
}

export function hasSignedAgreement(app: any): boolean {
  return Boolean(app?.agreementSigned || app?.agreementStatus === "signed" || app?.agreementSignedAt);
}

/** GST is optional, but the question is not: "No" is a complete answer. */
function gstAnswered(app: any): boolean {
  if (app?.isGstRegistered === "No") return true;
  return app?.isGstRegistered === "Yes" && GSTIN_RE.test(String(app?.gstin || "").toUpperCase());
}

/**
 * Whether each of the 8 wizard steps has everything it needs.
 *
 * The one definition both sides read: the server derives `uiStep` from it so a
 * resumed draft opens on the right step, and the wizard derives its ticks and
 * its "you may jump here" rule from it so the rail never disagrees with the
 * form. Every predicate works off the same flat shape the API persists, so the
 * client can pass an unsaved in-memory draft through it unchanged.
 */
export function partnerStepCompletion(app: any): Record<PartnerStepId, boolean> {
  const a = app || {};
  const docs = a.documents || {};
  const bank = a.bankDetails || {};
  const isFirm = a.partnerType === "Firm";
  const combined = Boolean(a.aadhaarCombined || docs.aadhaarCombined);
  const aadhaarFront = Boolean(docs.aadhaarDoc || docs.aadhaarFrontDoc);
  const submitted = isApplicationSubmitted(a);

  return {
    1: Boolean(a.partnerType && (a.fullName || a.contactPersonName) && a.email),
    2: Boolean(gstAnswered(a) && (!isFirm || (a.firmType && a.businessName)) && a.designation),
    3: Boolean(
      (a.contactPersonName || a.fullName) &&
        a.addressLine1 &&
        a.city &&
        a.stateName &&
        PINCODE_RE.test(String(a.pinCode || ""))
    ),
    4: Boolean(PAN_RE.test(String(a.panNumber || "").toUpperCase()) && a.dob && a.gender),
    5: Boolean(bank.accountHolderName && bank.accountNumber && IFSC_RE.test(String(bank.ifsc || "").toUpperCase())),
    6: Boolean(docs.panDoc && aadhaarFront && (combined || docs.aadhaarBackDoc)),
    7: Boolean(submitted && hasSignedAgreement(a)),
    8: Boolean(String(a.status || "").toLowerCase() === "approved" || String(a.status || "").toLowerCase() === "active"),
  };
}

/**
 * The step a partner should land on: the first one still missing something.
 *
 * Once the application has been submitted there is nothing left to fill in, so
 * it always resolves to the status screen regardless of what step 7 thinks.
 */
export function firstIncompletePartnerStep(app: any): PartnerStepId {
  if (isApplicationSubmitted(app)) return 8;
  const done = partnerStepCompletion(app);
  for (let id = 1; id <= LAST_INPUT_STEP; id++) {
    if (!done[id as PartnerStepId]) return id as PartnerStepId;
  }
  return LAST_INPUT_STEP;
}

/**
 * Derive the full step state from a `partner_applications` document.
 * Stored `*Status` fields are honoured, but derived truth wins when the
 * underlying data is present — so a document written before this module
 * existed still resumes correctly.
 */
export function deriveOnboardingState(app: any, opts?: { mobileVerified?: boolean }): OnboardingState {
  const submitted = isApplicationSubmitted(app);
  const status = String(app?.status || "").toLowerCase();
  const approved = status === "approved" || status === "active";

  const statuses: OnboardingStepStatuses = {
    mobileVerificationStatus: done(opts?.mobileVerified ?? app?.mobileVerified ?? Boolean(app)),
    basicDetailsStatus: done(app?.basicDetailsStatus === "completed" || hasBasicDetails(app)),
    businessDetailsStatus: done(app?.businessDetailsStatus === "completed" || hasBusinessDetails(app)),
    documentsStatus: done(app?.documentsStatus === "completed" || hasDocuments(app)),
    previewStatus: done(app?.previewStatus === "completed" || submitted),
    agreementStatus: done(hasSignedAgreement(app)),
  };

  let currentStep: OnboardingStep = "MOBILE_VERIFICATION";
  if (statuses.mobileVerificationStatus === "completed") currentStep = "BASIC_DETAILS";
  if (statuses.basicDetailsStatus === "completed") currentStep = "BUSINESS_DETAILS";
  if (statuses.businessDetailsStatus === "completed") currentStep = "DOCUMENTS";
  if (statuses.documentsStatus === "completed") currentStep = "PREVIEW";
  if (statuses.previewStatus === "completed") currentStep = "AGREEMENT";
  if (statuses.agreementStatus === "completed" && (submitted || approved)) currentStep = "COMPLETED";

  return {
    ...statuses,
    currentStep,
    uiStep: firstIncompletePartnerStep(app),
    stepDone: partnerStepCompletion(app),
    isMobileVerified: statuses.mobileVerificationStatus === "completed",
    isSubmitted: submitted,
    isLocked: submitted,
    isCompleted: currentStep === "COMPLETED",
    isApproved: approved,
  };
}

/**
 * Map a canonical lifecycle step onto the wizard.
 *
 * Only for callers that hold a step key and no document — anything with the
 * document itself should use `firstIncompletePartnerStep`, which reads the real
 * data instead of a coarse status. The wizard splits BASIC_DETAILS across four
 * steps and BUSINESS_DETAILS across two, so this can only name the first step
 * of each group.
 */
export function uiStepFor(step: OnboardingStep): PartnerStepId {
  switch (step) {
    case "MOBILE_VERIFICATION":
    case "BASIC_DETAILS":
      return 1;
    case "BUSINESS_DETAILS":
      return 5;
    case "DOCUMENTS":
      return 6;
    case "PREVIEW":
    case "AGREEMENT":
      return 7;
    default:
      return 8;
  }
}

/** Canonical lifecycle step a given wizard step writes into. */
export function stepKeyForUiStep(uiStep: number): OnboardingStep {
  if (uiStep <= 4) return "BASIC_DETAILS";
  if (uiStep === 5) return "BUSINESS_DETAILS";
  if (uiStep === 6) return "DOCUMENTS";
  if (uiStep === 7) return "PREVIEW";
  return "COMPLETED";
}

/**
 * Persisted step fields for a `partner_applications` write.
 * Returns only the status columns so callers can merge them into their payload.
 */
export function stepFieldsFor(app: any, opts?: { mobileVerified?: boolean }) {
  const state = deriveOnboardingState(app, opts);
  return {
    mobileVerificationStatus: state.mobileVerificationStatus,
    basicDetailsStatus: state.basicDetailsStatus,
    businessDetailsStatus: state.businessDetailsStatus,
    documentsStatus: state.documentsStatus,
    previewStatus: state.previewStatus,
    agreementStatus: state.agreementStatus,
    currentStepKey: state.currentStep,
    currentStep: state.uiStep,
  };
}

/** Where a partner should land after logging in. */
export function resumeUrlFor(state: OnboardingState, applicationId?: string): string {
  // An approved partner always lands on the portal — the dashboard prompts for
  // the MOU if it is still unsigned.
  if (state.isApproved) return "/";
  // `isCompleted` only means every onboarding step is filled in, which happens
  // well before approval. Sending it to "/" dropped partners whose application
  // was still under review onto the public marketing homepage, which looked
  // exactly like the OTP had failed. Completed-but-unapproved belongs on the
  // status page alongside submitted.
  if (state.isSubmitted || state.isCompleted) {
    return `/application-status${applicationId ? `?id=${encodeURIComponent(applicationId)}` : ""}`;
  }
  return "/onboarding";
}
