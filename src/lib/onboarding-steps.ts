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
 *   - `PARTNER_ONBOARDING_STEPS` is the 3-step wizard a partner actually
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
  /** 1..3 — the wizard step the onboarding page should open. */
  uiStep: PartnerStepId;
  /** Per-step completion for the 3-step wizard, keyed by step id. */
  stepDone: Record<PartnerStepId, boolean>;
  isMobileVerified: boolean;
  isSubmitted: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  isApproved: boolean;
}

/**
 * The 3 steps a partner sees. Order is the order they are walked through, and
 * the `id` is what gets persisted as `currentStep` — so renumbering these is a
 * data migration, not a cosmetic change.
 *
 * `title` is deliberately short: it has to fit a sidebar rail at 320px and a
 * phone header at 360px without truncating.
 */
export const PARTNER_ONBOARDING_STEPS = [
  { id: 1, key: "PERSONAL_BUSINESS", title: "Personal & Business Details", description: "Who you are and your business" },
  { id: 2, key: "KYC_DOCUMENTS", title: "KYC & Bank Account", description: "Verification, bank & documents" },
  { id: 3, key: "REVIEW_SUBMIT", title: "Review & Submit", description: "Check everything and submit" },
] as const;

export type PartnerStepId = 1 | 2 | 3;
export type PartnerStepKey = (typeof PARTNER_ONBOARDING_STEPS)[number]["key"];

/** The last step a partner fills in. Step 3 includes review + status. */
export const LAST_INPUT_STEP: PartnerStepId = 3;

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
 * Whether each of the 3 wizard steps has everything it needs.
 *
 * Step 1 (Personal & Business): basic info + business details + contact/address
 * Step 2 (KYC & Documents): KYC + bank account + document uploads
 * Step 3 (Review & Submit): declarations signed + agreement + submitted
 */
export function partnerStepCompletion(app: any): Record<PartnerStepId, boolean> {
  const a = app || {};
  const docs = a.documents || {};
  const bank = a.bankDetails || {};
  const isFirm = a.partnerType === "Firm";
  const combined = Boolean(a.aadhaarCombined || docs.aadhaarCombined);
  const aadhaarFront = Boolean(docs.aadhaarDoc || docs.aadhaarFrontDoc);
  const submitted = isApplicationSubmitted(a);

  // Step 1: basic info + business + contact/address
  const step1BasicInfo = Boolean(a.partnerType && (a.fullName || a.contactPersonName) && a.email);
  const step1Business = Boolean(gstAnswered(a) && (!isFirm || (a.firmType && a.businessName)) && a.designation);
  const step1Contact = Boolean(
    (a.contactPersonName || a.fullName) &&
      a.addressLine1 &&
      a.city &&
      a.stateName &&
      PINCODE_RE.test(String(a.pinCode || ""))
  );

  // Step 2: KYC + bank + documents
  const step2Kyc = Boolean(PAN_RE.test(String(a.panNumber || "").toUpperCase()) && a.dob && a.gender);
  const step2Bank = Boolean(bank.accountHolderName && bank.accountNumber && IFSC_RE.test(String(bank.ifsc || "").toUpperCase()));
  const step2Docs = Boolean(docs.panDoc && aadhaarFront && (combined || docs.aadhaarBackDoc));

  // Step 3: review + submit
  const step3 = Boolean(submitted && hasSignedAgreement(a));

  return {
    1: step1BasicInfo && step1Business && step1Contact,
    2: step2Kyc && step2Bank && step2Docs,
    3: step3,
  };
}

/**
 * The step a partner should land on: the first one still missing something.
 *
 * Once the application has been submitted there is nothing left to fill in, so
 * it always resolves to step 3 (review/status) regardless.
 */
export function firstIncompletePartnerStep(app: any): PartnerStepId {
  if (isApplicationSubmitted(app)) return 3;
  const completion = partnerStepCompletion(app);
  for (let id = 1; id <= 2; id++) {
    if (!completion[id as PartnerStepId]) return id as PartnerStepId;
  }
  return 3;
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
 * The 3-step wizard groups: step 1 = personal/business, step 2 = KYC/docs/bank,
 * step 3 = review/submit/status.
 */
export function uiStepFor(step: OnboardingStep): PartnerStepId {
  switch (step) {
    case "MOBILE_VERIFICATION":
    case "BASIC_DETAILS":
    case "BUSINESS_DETAILS":
      return 1;
    case "DOCUMENTS":
      return 2;
    case "PREVIEW":
    case "AGREEMENT":
      return 3;
    default:
      return 3;
  }
}

/** Canonical lifecycle step a given wizard step writes into. */
export function stepKeyForUiStep(uiStep: number): OnboardingStep {
  if (uiStep <= 1) return "BASIC_DETAILS";
  if (uiStep === 2) return "DOCUMENTS";
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
