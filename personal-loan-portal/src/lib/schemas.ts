import { z } from "zod";

export const leadFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  monthlyIncome: z.string().min(1, "Income is required"),
  employmentType: z.enum(["Salaried", "Self-Employed"]),
  city: z.string().min(2, "City is required"),
  loanAmount: z.string().min(1, "Loan amount is required"),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
