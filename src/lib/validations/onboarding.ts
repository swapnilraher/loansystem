import { z } from "zod";

export const PartnerTypeEnum = z.enum(["Individual", "Firm"]);
export const FirmTypeEnum = z.enum(["Proprietorship", "Partnership", "Private Limited", "Limited", "LLP"]);
export const YesNoEnum = z.enum(["Yes", "No"]);
export const AccountTypeEnum = z.enum(["Savings", "Current"]);

export const Step1BasicDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Full Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  mobileNumber: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid 10-digit mobile number").optional(),
  isMobileVerified: z.boolean().optional(),
}).passthrough();

export const Step2BusinessPanSchema = z.object({
  partnerType: PartnerTypeEnum.optional(),
  firmType: FirmTypeEnum.optional(),
  businessName: z.string().trim().max(150).optional().nullable(),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid 10-character PAN format").optional(),
}).passthrough();

export const Step3ContactPersonSchema = z.object({
  contactPersonName: z.string().trim().min(2, "Contact Person Name must be at least 2 characters").optional(),
  designation: z.string().trim().min(1, "Designation is required").optional(),
  dob: z.string().trim().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
}).passthrough();

export const Step4OfficeAddressSchema = z.object({
  addressLine1: z.string().trim().min(2, "Address Line 1 is required").optional(),
  addressLine2: z.string().trim().optional(),
  area: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required").optional(),
  district: z.string().trim().optional(),
  stateName: z.string().trim().min(2, "State is required").optional(),
  pinCode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
}).passthrough();

export const Step5GstSchema = z.object({
  isGstRegistered: YesNoEnum.optional(),
  gstin: z.string().trim().optional().nullable(),
  gstValid: z.boolean().optional(),
  gstDetails: z.any().optional().nullable(),
}).passthrough();

export const Step6KycDocsSchema = z.object({
  documents: z.object({
    aadhaarFrontDoc: z.any().optional(),
    aadhaarBackDoc: z.any().optional(),
    aadhaarCombined: z.boolean().optional(),
    aadhaarDoc: z.any().optional(),
    panDoc: z.any().optional(),
  }).optional(),
  docUploadMethod: z.enum(["digilocker", "manual"]).optional(),
  aadhaarFrontDoc: z.any().optional(),
  aadhaarBackDoc: z.any().optional(),
  aadhaarDoc: z.any().optional(),
  panDoc: z.any().optional(),
}).passthrough();

export const Step7BankDetailsSchema = z.object({
  bankDetails: z.object({
    accountHolderName: z.string().trim().optional(),
    accountNumber: z.string().trim().optional(),
    ifsc: z.string().trim().optional(),
    ifscCode: z.string().trim().optional(),
    bankName: z.string().trim().optional(),
    branchName: z.string().trim().optional(),
    accountType: z.string().optional(),
    verified: z.boolean().optional(),
    verifiedAccountName: z.string().trim().optional(),
    nameMatchScore: z.number().optional(),
    verifiedAt: z.string().optional(),
  }).optional(),
  bankVerifyAttempts: z.number().optional(),
  accountHolderName: z.string().trim().optional(),
  accountNumber: z.string().trim().optional(),
  ifsc: z.string().trim().optional(),
  ifscCode: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  branchName: z.string().trim().optional(),
  accountType: AccountTypeEnum.optional(),
  bankVerified: z.boolean().optional(),
  returnedBankName: z.string().trim().optional(),
  bankMatchScore: z.number().optional(),
}).passthrough();

export const Step8ReviewSchema = z.object({
  declareTruth: z.literal(true, {
    errorMap: () => ({ message: "You must declare that all submitted information is accurate." }),
  }).optional(),
  declareTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  }).optional(),
}).passthrough();

export function validateStepPayload(step: number, payload: unknown) {
  try {
    switch (step) {
      case 1:
      case 2:
        return Step1BasicDetailsSchema.safeParse(payload);
      case 3:
        return Step2BusinessPanSchema.safeParse(payload);
      case 4:
        return Step3ContactPersonSchema.safeParse(payload);
      case 5:
        return Step4OfficeAddressSchema.safeParse(payload);
      case 6:
        return Step5GstSchema.safeParse(payload);
      case 7:
        return Step6KycDocsSchema.safeParse(payload);
      case 8:
        return Step7BankDetailsSchema.safeParse(payload);
      default:
        return { success: true, data: payload } as const;
    }
  } catch (err) {
    console.warn("Validation parse error:", err);
    return { success: true, data: payload } as const;
  }
}
