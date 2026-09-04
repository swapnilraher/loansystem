/**
 * Canonical onboarding step state for the DSA partner flow.
 *
 * A single source of truth shared by the API routes and the onboarding /
 * login pages so that "where is this partner right now?" is answered the
 * same way on the server and on the client.
 *
 * The visible onboarding page groups these into 3 panes (see `uiStepFor`),
 * but progress is persisted at this finer granularity so a partner always
 * resumes exactly where they stopped — after a refresh, on another device,
 * or after logging out and back in.
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
  /** 1 | 2 | 3 — the pane the onboarding page should open. */
  uiStep: number;
  isMobileVerified: boolean;
  isSubmitted: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  isApproved: boolean;
}

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
    uiStep: uiStepFor(currentStep),
    isMobileVerified: statuses.mobileVerificationStatus === "completed",
    isSubmitted: submitted,
    isLocked: submitted,
    isCompleted: currentStep === "COMPLETED",
    isApproved: approved,
  };
}

/** Map a canonical step onto the 3-pane onboarding UI. */
export function uiStepFor(step: OnboardingStep): number {
  switch (step) {
    case "MOBILE_VERIFICATION":
    case "BASIC_DETAILS":
      return 1;
    case "BUSINESS_DETAILS":
    case "DOCUMENTS":
      return 2;
    default:
      return 3;
  }
}

/** Canonical step reached after saving a given UI pane. */
export function stepKeyForUiStep(uiStep: number): OnboardingStep {
  if (uiStep <= 1) return "BASIC_DETAILS";
  if (uiStep === 2) return "BUSINESS_DETAILS";
  return "PREVIEW";
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
  if (state.isApproved || state.isCompleted) return "/";
  if (state.isSubmitted) {
    return `/application-status${applicationId ? `?id=${encodeURIComponent(applicationId)}` : ""}`;
  }
  return "/onboarding";
}
