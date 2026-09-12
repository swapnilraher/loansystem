/**
 * The wizard's in-memory shape, and how it maps onto what the API persists.
 *
 * Everything the 3 steps collect lives in one flat `OnboardingForm` object
 * rather than forty `useState` calls: a step needs to read fields from other
 * steps (the review screen reads all of them), drafts are saved and restored
 * wholesale, and `partnerStepCompletion` wants a single object to inspect.
 */

import type { PartnerStepId } from "@/lib/onboarding-steps"

export type PartnerType = "Individual" | "Firm"
export type FirmType = "Proprietorship" | "Partnership" | "Private Limited" | "Limited" | "LLP"
export type AccountType = "Savings" | "Current"
export type Gender = "Male" | "Female" | "Other"
export type YesNo = "Yes" | "No"

export const FIRM_TYPES: readonly FirmType[] = [
  "Proprietorship",
  "Partnership",
  "Private Limited",
  "Limited",
  "LLP",
]

/**
 * Document slots. These strings are the keys under `documents` in the database
 * *and* the `documentType` posted to /api/onboarding/document/upload, so the
 * upload route's own step derivation lines up with what the wizard believes
 * without needing a second write to correct it.
 */
export const DOC_KEYS = ["panDoc", "aadhaarFrontDoc", "aadhaarBackDoc", "chequeDoc", "gstDoc"] as const
export type DocKey = (typeof DOC_KEYS)[number]

export interface DocMeta {
  fileUrl?: string
  /** Older drafts wrote `url`; read both, always write `fileUrl`. */
  url?: string
  fileName?: string
  sizeBytes?: number
  mimeType?: string
  uploadedAt?: string
  status?: string
}

export function docHref(doc?: DocMeta | null): string {
  return doc?.fileUrl || doc?.url || ""
}

export interface OnboardingForm {
  // Step 1 - basic information
  partnerType: PartnerType
  fullName: string
  email: string
  referredByDsaCode: string

  // Step 2 - business details
  firmType: FirmType
  businessName: string
  designation: string
  isGstRegistered: YesNo
  gstin: string
  gstValid: boolean
  gstDetails: Record<string, unknown> | null

  // Step 3 - contact & address
  contactPersonName: string
  alternateMobile: string
  addressLine1: string
  addressLine2: string
  area: string
  city: string
  district: string
  stateName: string
  pinCode: string

  // Step 4 - KYC
  panNumber: string
  panVerified: boolean
  panDetails: Record<string, unknown> | null
  dob: string
  gender: Gender
  aadhaarLast4: string
  aadhaarVerified: boolean
  aadhaarName: string
  docUploadMethod: "digilocker" | "manual"

  // Step 5 - bank account
  accountHolderName: string
  accountNumber: string
  confirmAccountNumber: string
  ifsc: string
  bankName: string
  branchName: string
  accountType: AccountType
  bankVerified: boolean
  bankMatchScore: number | null

  // Step 6 - documents
  documents: Partial<Record<DocKey, DocMeta>>
  aadhaarCombined: boolean

  // Step 7 - review & MOU
  declareTruth: boolean
  declareTerms: boolean
  agreementSigned: boolean
  agreementPdfUrl: string | null
}

export const EMPTY_FORM: OnboardingForm = {
  partnerType: "Individual",
  fullName: "",
  email: "",
  referredByDsaCode: "",

  firmType: "Proprietorship",
  businessName: "",
  designation: "Individual",
  isGstRegistered: "No",
  gstin: "",
  gstValid: false,
  gstDetails: null,

  contactPersonName: "",
  alternateMobile: "",
  addressLine1: "",
  addressLine2: "",
  area: "",
  city: "",
  district: "",
  stateName: "",
  pinCode: "",

  panNumber: "",
  panVerified: false,
  panDetails: null,
  dob: "",
  gender: "Male",
  aadhaarLast4: "",
  aadhaarVerified: false,
  aadhaarName: "",
  docUploadMethod: "manual",

  accountHolderName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifsc: "",
  bankName: "",
  branchName: "",
  accountType: "Savings",
  bankVerified: false,
  bankMatchScore: null,

  documents: {},
  aadhaarCombined: false,

  declareTruth: false,
  declareTerms: false,
  agreementSigned: false,
  agreementPdfUrl: null,
}

/**
 * The wizard's view of a partner, flattened into the shape the API stores.
 *
 * `partnerStepCompletion` reads a persisted document, so running it against an
 * unsaved form needs the same shape - otherwise the rail would only tick a step
 * after a round trip, and a partner who filled a step in and pressed nothing
 * would watch it sit un-ticked.
 */
export function toApplicationShape(form: OnboardingForm, mobileNumber: string) {
  return {
    mobileNumber,
    partnerType: form.partnerType,
    firmType: form.partnerType === "Firm" ? form.firmType : null,
    fullName: form.fullName.trim(),
    businessName: form.businessName.trim(),
    contactPersonName: form.contactPersonName.trim() || form.fullName.trim(),
    designation: form.designation.trim(),
    email: form.email.trim(),
    referredByDsaCode: form.referredByDsaCode.trim().toUpperCase(),

    isGstRegistered: form.isGstRegistered,
    gstin: form.isGstRegistered === "Yes" ? form.gstin.trim().toUpperCase() : null,

    alternateMobile: form.alternateMobile.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    area: form.area.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    stateName: form.stateName.trim(),
    pinCode: form.pinCode.trim(),

    panNumber: form.panNumber.trim().toUpperCase(),
    dob: form.dob,
    gender: form.gender,
    aadhaarLast4: form.aadhaarLast4,
    aadhaarVerified: form.aadhaarVerified,

    bankDetails: {
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifsc: form.ifsc.trim().toUpperCase(),
      bankName: form.bankName,
      branchName: form.branchName,
      accountType: form.accountType,
      verified: form.bankVerified,
    },

    documents: { ...form.documents, aadhaarCombined: form.aadhaarCombined },
    aadhaarCombined: form.aadhaarCombined,
    agreementSigned: form.agreementSigned,
  }
}

/** Per-step payloads posted to /api/onboarding/save-step. */
export function payloadForStep(step: PartnerStepId, form: OnboardingForm): Record<string, unknown> {
  const app = toApplicationShape(form, "")
  switch (step) {
    case 1:
      // Personal & Business Details (old steps 1-3)
      return {
        partnerType: form.partnerType,
        fullName: app.fullName,
        email: app.email,
        referredByDsaCode: app.referredByDsaCode || null,
        firmType: app.firmType,
        businessName: app.businessName || null,
        designation: app.designation,
        isGstRegistered: form.isGstRegistered,
        gstin: app.gstin,
        gstValid: form.gstValid,
        gstDetails: form.gstDetails,
        contactPersonName: app.contactPersonName,
        alternateMobile: app.alternateMobile || null,
        addressLine1: app.addressLine1,
        addressLine2: app.addressLine2 || null,
        area: app.area || null,
        city: app.city,
        district: app.district || null,
        stateName: app.stateName,
        pinCode: app.pinCode,
      }
    case 2:
      // KYC & Bank Account & Documents (old steps 4-6)
      return {
        panNumber: app.panNumber,
        panVerified: form.panVerified,
        panDetails: form.panDetails,
        dob: form.dob,
        gender: form.gender,
        aadhaarLast4: form.aadhaarLast4 || null,
        aadhaarVerified: form.aadhaarVerified,
        aadhaarName: form.aadhaarName || null,
        docUploadMethod: form.docUploadMethod,
        bankDetails: app.bankDetails,
        documents: app.documents,
        aadhaarCombined: form.aadhaarCombined,
      }
    default:
      // Review & Submit (old step 7)
      return {
        declareTruth: form.declareTruth,
        declareTerms: form.declareTerms,
        agreementSigned: form.agreementSigned,
      }
  }
}


/**
 * Rehydrate the form from a saved draft - the server's `partner_applications`
 * document, or the trimmed copy in localStorage. Missing keys keep whatever the
 * form already has, so a local draft and a server draft can be layered.
 */
export function hydrateForm(base: OnboardingForm, draft: Record<string, any> | null | undefined): OnboardingForm {
  if (!draft) return base
  const d = draft
  const bank = d.bankDetails || {}
  const docs = d.documents || {}

  const pick = <T>(value: T | undefined | null, fallback: T): T =>
    value === undefined || value === null || value === "" ? fallback : value

  const documents: Partial<Record<DocKey, DocMeta>> = { ...base.documents }
  for (const key of DOC_KEYS) {
    if (docs[key]) documents[key] = docs[key]
  }
  // Drafts written before the slots were renamed stored other key spellings.
  if (!documents.aadhaarFrontDoc) documents.aadhaarFrontDoc = docs.aadhaarDoc || docs.aadhaarFront || undefined
  if (!documents.aadhaarBackDoc) documents.aadhaarBackDoc = docs.aadhaarBack || undefined

  return {
    partnerType: pick(d.partnerType, base.partnerType),
    fullName: pick(d.fullName, base.fullName),
    email: pick(d.email, base.email),
    referredByDsaCode: pick(d.referredByDsaCode, base.referredByDsaCode),

    firmType: pick(d.firmType, base.firmType),
    businessName: pick(d.businessName, base.businessName),
    designation: pick(d.designation, base.designation),
    isGstRegistered: pick(d.isGstRegistered, base.isGstRegistered),
    gstin: pick(d.gstin, base.gstin),
    gstValid: pick(d.gstValid, base.gstValid),
    gstDetails: pick(d.gstDetails, base.gstDetails),

    contactPersonName: pick(d.contactPersonName, base.contactPersonName),
    alternateMobile: pick(d.alternateMobile, base.alternateMobile),
    addressLine1: pick(d.addressLine1, base.addressLine1),
    addressLine2: pick(d.addressLine2, base.addressLine2),
    area: pick(d.area, base.area),
    city: pick(d.city, base.city),
    district: pick(d.district, base.district),
    stateName: pick(d.stateName, base.stateName),
    pinCode: pick(d.pinCode, base.pinCode),

    panNumber: pick(d.panNumber, base.panNumber),
    panVerified: pick(d.panVerified, base.panVerified),
    panDetails: pick(d.panDetails, base.panDetails),
    dob: pick(d.dob, base.dob),
    gender: pick(d.gender, base.gender),
    aadhaarLast4: pick(d.aadhaarLast4, base.aadhaarLast4),
    aadhaarVerified: pick(d.aadhaarVerified, base.aadhaarVerified),
    aadhaarName: pick(d.aadhaarName, base.aadhaarName),
    docUploadMethod: pick(d.docUploadMethod, base.docUploadMethod),

    accountHolderName: pick(bank.accountHolderName, base.accountHolderName),
    accountNumber: pick(bank.accountNumber, base.accountNumber),
    // Restored from the server draft only, and only because the two matched
    // when it was written. The local draft never carries an account number at
    // all, so resuming on this device leaves both fields empty to re-type.
    confirmAccountNumber: pick(bank.accountNumber, base.confirmAccountNumber),
    ifsc: pick(bank.ifsc ?? bank.ifscCode, base.ifsc),
    bankName: pick(bank.bankName, base.bankName),
    branchName: pick(bank.branchName, base.branchName),
    accountType: pick(bank.accountType, base.accountType),
    bankVerified: pick(bank.verified, base.bankVerified),
    bankMatchScore: pick(bank.nameMatchScore, base.bankMatchScore),

    documents,
    aadhaarCombined: pick(d.aadhaarCombined ?? docs.aadhaarCombined, base.aadhaarCombined),

    declareTruth: pick(d.declareTruth, base.declareTruth),
    declareTerms: pick(d.declareTerms, base.declareTerms),
    agreementSigned: pick(d.agreementSigned, base.agreementSigned),
    agreementPdfUrl: pick(d.agreementPdfUrl, base.agreementPdfUrl),
  }
}
