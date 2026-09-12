"use client"

import React, { useState } from "react"
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react"

import { AADHAAR_RE, IFSC_RE, PAN_RE } from "@/lib/onboarding-steps"
import ImageCropModal from "@/components/onboarding/ImageCropModal"

import { useOnboarding } from "../OnboardingContext"
import { docHref, type DocKey } from "../types"
import { dobBounds } from "../net"
import {
  Callout,
  DocumentUploadCard,
  Field,
  FieldGrid,
  Full,
  SectionCard,
  StepHeading,
  StepNav,
  TextInput,
  VerifyPill,
} from "../ui"

const DOC_LABELS: Record<DocKey, string> = {
  panDoc: "PAN Card",
  aadhaarFrontDoc: "Aadhaar — Front Side",
  aadhaarBackDoc: "Aadhaar — Back Side",
  chequeDoc: "Cancelled Cheque or Bank Passbook",
  gstDoc: "GST Certificate",
}

/**
 * Step 2 — KYC & Bank Account Setup.
 *
 * Implements the redesigned Step 2 matching Techstar fintech design system:
 * - Clear 3-section layout: PAN & Identity Details, Bank Account Setup, Upload Documents
 * - Compact, highly credible PAN verification card
 * - Proper Date of Birth date-input with format cues and bounds
 * - Bank account fields with confirm matching & IFSC branch lookup
 * - Reusable DocumentUploadCard with upload progress, file view/replace/delete
 * - Sticky bottom CTA bar with safe-area padding
 */
export function Step2KycDocuments() {
  const {
    form,
    patch,
    fieldError,
    saving,
    saveAndContinue,
    back,
    verifyPan,
    panVerifying,
    panNote,
    lookupIfsc,
    ifscLoading,
    ifscValid,
    ifscNote,
    verifyBank,
    bankVerifying,
    uploadDoc,
    removeDoc,
    retryUpload,
    uploadProgress,
    uploadFailed,
    uploadingDoc,
    setStepError,
  } = useOnboarding()

  const [picking, setPicking] = useState<DocKey | null>(null)

  const { min, max } = dobBounds()
  const panFormatOk = PAN_RE.test(form.panNumber.trim().toUpperCase())

  const canVerifyBank =
    /^\d{6,20}$/.test(form.accountNumber.trim()) &&
    form.accountNumber.trim() === form.confirmAccountNumber.trim() &&
    IFSC_RE.test(form.ifsc.trim().toUpperCase())

  const slot = (key: DocKey) => {
    const doc = form.documents[key]
    return {
      fileName: doc?.fileName,
      fileSize: doc?.sizeBytes,
      href: docHref(doc),
      progress: uploadProgress[key],
      failed: uploadFailed === key,
      uploading: uploadingDoc === key,
      uploaded: Boolean(doc?.url || (doc as any)?.driveFileId),
    }
  }

  const applicantName =
    form.partnerType === "Firm"
      ? form.businessName || form.fullName || "Techstar Partner"
      : form.fullName || "Techstar Partner"

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page Heading ── */}
      <StepHeading
        eyebrow="Step 2 of 3"
        title="KYC & Bank Account Setup"
        description="Add your identity and bank details so commission payouts can be deposited securely."
      />

      {/* ── SECTION 1: PAN & Identity Details ── */}
      <SectionCard
        title="PAN & Identity Details"
        hint="Verified directly against Income Tax Department records."
      >
        {/* PAN Card Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ob-panNumber" className="text-xs sm:text-sm font-semibold text-slate-800">
              PAN Card Number <span className="text-rose-500">*</span>
            </label>
            {form.panVerified && <VerifyPill state="verified" label="PAN Verified" />}
          </div>

          <div className="flex gap-2">
            <input
              id="ob-panNumber"
              type="text"
              maxLength={10}
              value={form.panNumber}
              onChange={(e) => patch({ panNumber: e.target.value.toUpperCase() })}
              placeholder="AABAV8504E"
              autoComplete="off"
              className="flex-1 h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
            />
            {panFormatOk && !form.panVerified && (
              <button
                type="button"
                disabled={panVerifying}
                onClick={() => void verifyPan()}
                className="h-11 sm:h-12 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                {panVerifying ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin text-indigo-600" /> Verifying…
                  </span>
                ) : (
                  "Verify PAN"
                )}
              </button>
            )}
          </div>

          {fieldError("ob-panNumber") && (
            <p className="text-xs text-rose-500">{fieldError("ob-panNumber")}</p>
          )}
          {panNote && <Callout tone="info">{panNote}</Callout>}
        </div>

        {/* Compact PAN Result Card (Requirement 21) */}
        {(form.panVerified || form.panNumber.length >= 5) && (
          <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-indigo-50/60 p-3.5 sm:p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 tracking-wider">
              <span className="uppercase">INCOME TAX DEPARTMENT</span>
              <span className="flex items-center gap-1">
                <span>🇮🇳</span>
                <span className="uppercase font-semibold">GOVT. OF INDIA</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="min-w-0">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Name</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase truncate">
                  {String(form.panDetails?.fullName || form.fullName || "TECHSTAR PARTNER")}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">PAN Number</div>
                <div className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-wider">
                  {form.panNumber || "AABAV8504E"}
                </div>
              </div>
            </div>

            {form.panVerified && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1 border-t border-blue-200/50">
                <Check size={12} strokeWidth={3} className="text-emerald-600 shrink-0" />
                <span>Verified with NSDL &amp; Income Tax records</span>
              </div>
            )}
          </div>
        )}

        {/* Date of Birth & Gender (Requirement 22) */}
        <FieldGrid>
          <Field
            id="ob-dob"
            label="Date of Birth"
            required
            hint="Must match your official PAN card record."
            error={fieldError("ob-dob")}
          >
            <input
              id="ob-dob"
              type="date"
              min={min}
              max={max}
              value={form.dob}
              onChange={(e) => patch({ dob: e.target.value })}
              className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
            />
          </Field>

          <Field id="ob-gender" label="Gender" required error={fieldError("ob-gender")}>
            <div className="relative">
              <select
                id="ob-gender"
                value={form.gender || ""}
                onChange={(e) => patch({ gender: e.target.value as any })}
                className="w-full h-11 sm:h-12 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="" disabled>
                  Select Gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </Field>
        </FieldGrid>
      </SectionCard>

      {/* ── SECTION 2: Bank Account Setup (Requirement 23) ── */}
      <SectionCard
        title="Bank Account Setup"
        hint="Commission disbursements are sent to this account."
      >
        {/* Account Number */}
        <Field
          id="ob-accountNumber"
          label={`Bank Account Number of ${applicantName}`}
          required
          error={fieldError("ob-accountNumber")}
        >
          <TextInput
            id="ob-accountNumber"
            type="text"
            inputMode="numeric"
            value={form.accountNumber}
            onChange={(e) => patch({ accountNumber: e.target.value.replace(/\D/g, "") })}
            placeholder="60591201503"
            invalid={Boolean(fieldError("ob-accountNumber"))}
          />
        </Field>

        {/* Confirm Account Number */}
        <Field
          id="ob-confirmAccountNumber"
          label="Confirm Bank Account Number"
          required
          error={fieldError("ob-confirmAccountNumber")}
        >
          <TextInput
            id="ob-confirmAccountNumber"
            type="text"
            inputMode="numeric"
            value={form.confirmAccountNumber}
            onChange={(e) => patch({ confirmAccountNumber: e.target.value.replace(/\D/g, "") })}
            placeholder="Re-enter bank account number"
            invalid={Boolean(fieldError("ob-confirmAccountNumber"))}
          />
        </Field>

        {/* Account Holder Name */}
        <Field
          id="ob-accountHolderName"
          label="Account Holder Name (as per Bank)"
          required
          hint="Auto-populated once bank account is verified."
          error={fieldError("ob-accountHolderName")}
        >
          <input
            id="ob-accountHolderName"
            type="text"
            readOnly
            value={form.accountHolderName || ""}
            placeholder="Auto-populated once bank account is verified"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 cursor-not-allowed focus:outline-none transition-all"
          />
        </Field>

        {/* IFSC Code with Search & Verification */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ob-ifsc" className="text-xs sm:text-sm font-semibold text-slate-800">
              IFSC Code <span className="text-rose-500">*</span>
            </label>
            {form.bankVerified && <VerifyPill state="verified" label="Account Verified" />}
          </div>

          <div className="relative">
            <input
              id="ob-ifsc"
              type="text"
              maxLength={11}
              value={form.ifsc}
              onChange={(e) => {
                const clean = e.target.value.toUpperCase()
                patch({ ifsc: clean })
                if (clean.length === 11) void lookupIfsc(clean)
              }}
              placeholder="SBIN0017526"
              className="w-full h-11 sm:h-12 pl-3.5 pr-24 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-indigo-600 text-xs font-semibold pointer-events-none">
              <Search size={14} />
              <span>Lookup</span>
            </div>
          </div>

          {fieldError("ob-ifsc") && (
            <p className="text-xs text-rose-500">{fieldError("ob-ifsc")}</p>
          )}

          {/* Resolved Bank & Branch Display */}
          {Boolean(form.bankName || form.branchName) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 pt-1">
              <Landmark size={14} className="text-indigo-600 shrink-0" />
              <span>
                {form.bankName}
                {form.branchName ? ` · ${form.branchName}` : ""}
              </span>
            </div>
          )}

          {ifscLoading && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <Loader2 size={13} className="animate-spin text-indigo-600" /> Looking up branch details…
            </p>
          )}

          {canVerifyBank && !form.bankVerified && (
            <div className="pt-2">
              <button
                id="ob-verify-bank-btn"
                type="button"
                disabled={bankVerifying}
                onClick={() => void verifyBank()}
                className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {bankVerifying ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Verifying Bank Account…
                  </>
                ) : (
                  "Verify Bank Account"
                )}
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── SECTION 3: Upload Documents (Requirements 24 & 25) ── */}
      <SectionCard
        title="Upload Documents"
        hint="Clear photos or PDFs of PAN and Aadhaar (JPG, PNG, WEBP or PDF · max 5 MB each)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocumentUploadCard
            id="ob-doc-panDoc"
            label="PAN Card Photo / Scan"
            required
            hint="Clear scan or photo of original PAN"
            {...slot("panDoc")}
            onOpenPicker={() => setPicking("panDoc")}
            onRetry={() => retryUpload("panDoc")}
            onRemove={() => removeDoc("panDoc")}
          />

          <DocumentUploadCard
            id="ob-doc-aadhaarFrontDoc"
            label="Aadhaar — Front Side"
            required
            hint="Front side showing photo and address"
            {...slot("aadhaarFrontDoc")}
            onOpenPicker={() => setPicking("aadhaarFrontDoc")}
            onRetry={() => retryUpload("aadhaarFrontDoc")}
            onRemove={() => removeDoc("aadhaarFrontDoc")}
          />

          {!form.aadhaarCombined && (
            <DocumentUploadCard
              id="ob-doc-aadhaarBackDoc"
              label="Aadhaar — Back Side"
              required
              hint="Back side showing complete address"
              {...slot("aadhaarBackDoc")}
              onOpenPicker={() => setPicking("aadhaarBackDoc")}
              onRetry={() => retryUpload("aadhaarBackDoc")}
              onRemove={() => removeDoc("aadhaarBackDoc")}
            />
          )}
        </div>

        {/* Aadhaar Combined Checkbox */}
        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer pt-1 select-none">
          <input
            type="checkbox"
            checked={form.aadhaarCombined}
            onChange={(e) => patch({ aadhaarCombined: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span>Both sides of Aadhaar are on a single page / photo</span>
        </label>
      </SectionCard>

      {/* Image Crop & Upload Modal */}
      {picking && (
        <ImageCropModal
          isOpen={Boolean(picking)}
          title={DOC_LABELS[picking]}
          onClose={() => setPicking(null)}
          onConfirm={(file: File) => {
            const currentPicking = picking
            setPicking(null)
            void uploadDoc(currentPicking, file)
          }}
        />
      )}

      {/* ── Sticky Mobile Action CTA Bar (Verify & Continue) ── */}
      <StepNav
        onBack={back}
        onContinue={() => void saveAndContinue()}
        loading={saving}
        continueLabel="Verify & Continue"
      />
    </div>
  )
}
