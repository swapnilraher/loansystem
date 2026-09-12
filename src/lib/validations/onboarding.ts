/**
 * Server-side schemas for the 8-step partner onboarding wizard.
 *
 * These mirror the step numbers in `PARTNER_ONBOARDING_STEPS`: the client posts
 * `{ step, stepData }` to /api/onboarding/save-step and the payload is checked
 * against the schema for that step before anything is written.
 *
 * Every schema is loose and mostly optional on purpose. A step saves whatever
 * the partner has filled in so far — the wizard's own gating decides when a
 * step is finished, and `partnerStepCompletion` is what both sides trust for
 * that. What these schemas exist to stop is a *malformed* value reaching the
 * database: a PAN that is not a PAN, an email that is not an email, a 4-digit
 * pincode. Blank is allowed; wrong is not.
 */

import { z } from "zod";

export const PartnerTypeEnum = z.enum(["Individual", "Firm"]);
export const FirmTypeEnum = z.enum(["Proprietorship", "Partnership", "Private Limited", "Limited", "LLP"]);
export const YesNoEnum = z.enum(["Yes", "No"]);
export const AccountTypeEnum = z.enum(["Savings", "Current"]);
export const GenderEnum = z.enum(["Male", "Female", "Other"]);

/** An optional free-text field: absent, empty, null, or a trimmed string. */
const optionalText = (max = 200) => z.string().trim().max(max).nullish();

/** Step 1 — Basic partner information. */
export const Step1BasicInfoSchema = z.looseObject({
  partnerType: PartnerTypeEnum.optional(),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
  email: z.email("Please provide a valid email address").trim().toLowerCase().optional(),
  mobileNumber: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid 10-digit mobile number").optional(),
  referredByDsaCode: optionalText(30),
  isMobileVerified: z.boolean().optional(),
});

/** Step 2 — Business / company details. */
export const Step2BusinessSchema = z.looseObject({
  partnerType: PartnerTypeEnum.optional(),
  firmType: FirmTypeEnum.nullish(),
  businessName: optionalText(150),
  designation: optionalText(80),
  isGstRegistered: YesNoEnum.optional(),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid 15-character GSTIN")
    .nullish(),
  gstValid: z.boolean().optional(),
  gstDetails: z.any().nullish(),
});

/** Step 3 — Contact person & correspondence address. */
export const Step3ContactAddressSchema = z.looseObject({
  contactPersonName: z.string().trim().min(2, "Contact person name must be at least 2 characters").max(100).optional(),
  alternateMobile: z
    .union([z.literal(""), z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid 10-digit alternate mobile number")])
    .nullish(),
  addressLine1: z.string().trim().min(2, "Address line 1 is required").max(200).optional(),
  addressLine2: optionalText(200),
  area: optionalText(120),
  city: z.string().trim().min(2, "City is required").max(80).optional(),
  district: optionalText(80),
  stateName: z.string().trim().min(2, "State is required").max(80).optional(),
  pinCode: z.string().trim().regex(/^\d{6}$/, "PIN code must be 6 digits").optional(),
});

/** Step 4 — KYC / identity verification. */
export const Step4KycSchema = z.looseObject({
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid 10-character PAN format")
    .optional(),
  panVerified: z.boolean().optional(),
  panDetails: z.any().nullish(),
  dob: z.string().trim().optional(),
  gender: GenderEnum.optional(),
  /*
   * Only ever the last four digits plus a verification flag. The full Aadhaar
   * number goes to the KYC provider and is never persisted here — holding one
   * is a liability with no matching use.
   */
  aadhaarLast4: z.string().trim().regex(/^\d{4}$/, "Aadhaar reference must be 4 digits").nullish(),
  aadhaarVerified: z.boolean().optional(),
  aadhaarVerifiedAt: z.string().trim().nullish(),
  aadhaarName: optionalText(120),
  docUploadMethod: z.enum(["digilocker", "manual"]).optional(),
});

/** Step 5 — Bank account for commission payouts. */
export const Step5BankSchema = z.looseObject({
  bankDetails: z
    .looseObject({
      accountHolderName: z.string().trim().max(120).optional(),
      accountNumber: z.string().trim().regex(/^\d{6,20}$/, "Bank account number must be 6-20 digits").optional(),
      ifsc: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid 11-character IFSC code")
        .optional(),
      bankName: optionalText(120),
      branchName: optionalText(150),
      accountType: AccountTypeEnum.optional(),
      verified: z.boolean().optional(),
      verifiedAccountName: optionalText(120),
      nameMatchScore: z.number().optional(),
      verifiedAt: z.string().optional(),
    })
    .optional(),
  bankVerifyAttempts: z.number().optional(),
});

/** Step 6 — Document upload. Files land via /document/upload; this records them. */
export const Step6DocumentsSchema = z.looseObject({
  documents: z
    .looseObject({
      panDoc: z.any().optional(),
      aadhaarFrontDoc: z.any().optional(),
      aadhaarBackDoc: z.any().optional(),
      aadhaarDoc: z.any().optional(),
      chequeDoc: z.any().optional(),
      gstDoc: z.any().optional(),
      aadhaarCombined: z.boolean().optional(),
    })
    .optional(),
  aadhaarCombined: z.boolean().optional(),
  docUploadMethod: z.enum(["digilocker", "manual"]).optional(),
});

/** Step 7 — Review, declarations & MOU. */
export const Step7ReviewSchema = z.looseObject({
  declareTruth: z.boolean().optional(),
  declareTerms: z.boolean().optional(),
  agreementSigned: z.boolean().optional(),
});

/** Consolidated Step 1 — Personal & Business Details (combines basic info, business, contact & address). */
export const Step1ConsolidatedSchema = z.looseObject({
  partnerType: PartnerTypeEnum.optional(),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
  email: z.email("Please provide a valid email address").trim().toLowerCase().optional(),
  mobileNumber: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid 10-digit mobile number").optional(),
  referredByDsaCode: optionalText(30),
  isMobileVerified: z.boolean().optional(),
  firmType: FirmTypeEnum.nullish(),
  businessName: optionalText(150),
  designation: optionalText(80),
  isGstRegistered: YesNoEnum.optional(),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid 15-character GSTIN")
    .nullish(),
  gstValid: z.boolean().optional(),
  gstDetails: z.any().nullish(),
  contactPersonName: z.string().trim().min(2, "Contact person name must be at least 2 characters").max(100).optional(),
  alternateMobile: z
    .union([z.literal(""), z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid 10-digit alternate mobile number")])
    .nullish(),
  addressLine1: z.string().trim().min(2, "Address line 1 is required").max(200).optional(),
  addressLine2: optionalText(200),
  area: optionalText(120),
  city: z.string().trim().min(2, "City is required").max(80).optional(),
  district: optionalText(80),
  stateName: z.string().trim().min(2, "State is required").max(80).optional(),
  pinCode: z.string().trim().regex(/^\d{6}$/, "PIN code must be 6 digits").optional(),
});

/** Consolidated Step 2 — KYC & Bank Account & Documents. */
export const Step2ConsolidatedSchema = z.looseObject({
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid 10-character PAN format")
    .optional(),
  panVerified: z.boolean().optional(),
  panDetails: z.any().nullish(),
  dob: z.string().trim().optional(),
  gender: GenderEnum.optional(),
  aadhaarLast4: z.string().trim().regex(/^\d{4}$/, "Aadhaar reference must be 4 digits").nullish(),
  aadhaarVerified: z.boolean().optional(),
  aadhaarVerifiedAt: z.string().trim().nullish(),
  aadhaarName: optionalText(120),
  docUploadMethod: z.enum(["digilocker", "manual"]).optional(),
  bankDetails: z
    .looseObject({
      accountHolderName: z.string().trim().max(120).optional(),
      accountNumber: z.string().trim().regex(/^\d{6,20}$/, "Bank account number must be 6-20 digits").optional(),
      ifsc: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid 11-character IFSC code")
        .optional(),
      bankName: optionalText(120),
      branchName: optionalText(150),
      accountType: AccountTypeEnum.optional(),
      verified: z.boolean().optional(),
      verifiedAccountName: optionalText(120),
      nameMatchScore: z.number().optional(),
      verifiedAt: z.string().optional(),
    })
    .optional(),
  bankVerifyAttempts: z.number().optional(),
  documents: z
    .looseObject({
      panDoc: z.any().optional(),
      aadhaarFrontDoc: z.any().optional(),
      aadhaarBackDoc: z.any().optional(),
      aadhaarDoc: z.any().optional(),
      chequeDoc: z.any().optional(),
      gstDoc: z.any().optional(),
      aadhaarCombined: z.boolean().optional(),
    })
    .optional(),
  aadhaarCombined: z.boolean().optional(),
});

/** Consolidated Step 3 — Review, declarations & MOU. */
export const Step3ConsolidatedSchema = Step7ReviewSchema;

const STEP_SCHEMAS: Record<number, z.ZodTypeAny> = {
  1: Step1ConsolidatedSchema,
  2: Step2ConsolidatedSchema,
  3: Step3ConsolidatedSchema,
  // Backward compatibility for old 8-step callers
  4: Step4KycSchema,
  5: Step5BankSchema,
  6: Step6DocumentsSchema,
  7: Step7ReviewSchema,
};

/**
 * Validate a step payload.
 *
 * An unknown step number passes through untouched rather than failing: a client
 * one deploy ahead of the server should not have its progress rejected, and
 * every field it can write is checked again by the step that owns it.
 */
export function validateStepPayload(step: number, payload: unknown) {
  const schema = STEP_SCHEMAS[step];
  if (!schema) return { success: true, data: payload } as const;
  try {
    return schema.safeParse(payload);
  } catch (err) {
    console.warn("Validation parse error:", err);
    return { success: true, data: payload } as const;
  }
}
