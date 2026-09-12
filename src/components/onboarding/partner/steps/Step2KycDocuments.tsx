"use client"

import React, { useState } from "react"
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  HelpCircle,
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
  ChoiceGroup,
  Field,
  FieldGrid,
  Full,
  Section,
  StepHeading,
  StepNav,
  UploadTile,
} from "../ui"

const DOC_LABELS: Record<DocKey, string> = {
  panDoc: "PAN card",
  aadhaarFrontDoc: "Aadhaar — front",
  aadhaarBackDoc: "Aadhaar — back",
  chequeDoc: "Cancelled cheque or passbook",
  gstDoc: "GST certificate",
}

/**
 * Step 2 — KYC & Bank Account Setup.
 *
 * Tailored for DSA Loan Partner onboarding:
 * - Bank Account Setup & KYC Verification
 * - PAN verification with live verified tag & realistic visual PAN card graphic
 * - GST number with green verified badge
 * - Bank account number and IFSC code with live bank & branch lookup
 * - Clean document uploads for PAN and Aadhaar
 * - Full-width solid black "Verify & Continue" button
 */
export function Step2KycDocuments() {
  const {
    form,
    patch,
    fieldError,
    invalidField,
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
      uploaded: Boolean(doc?.url || (doc as any)?.driveFileId),
    }
  }

  const applicantName = form.partnerType === "Firm"
    ? form.businessName || form.fullName || "TECHSTAR PARTNER"
    : form.fullName || "TECHSTAR PARTNER"

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Heading ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          KYC &amp; Bank Account Setup
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Add your bank details so we know exactly where to send your partner commissions and file payouts!
        </p>
      </div>

      {/* ── CARD 1: PAN & KYC Verification ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="space-y-0.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">PAN &amp; Identity Details</h2>
        </div>

        {/* PAN Input (full width, no verify button) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="ob-panNumber" className="text-xs sm:text-sm font-semibold text-slate-800">
              PAN Card Number <span className="text-rose-500">*</span>
            </label>
            {form.panVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={13} /> Verified
              </span>
            )}
          </div>

          <input
            id="ob-panNumber"
            type="text"
            maxLength={10}
            value={form.panNumber}
            onChange={e => patch({ panNumber: e.target.value.toUpperCase() })}
            placeholder="AABAV8504E"
            autoComplete="off"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-panNumber") && (
            <p className="text-xs text-rose-500">{fieldError("ob-panNumber")}</p>
          )}

          {form.panVerified && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 pt-0.5">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              Verified PAN for {String(form.panDetails?.fullName || form.fullName || "Partner")}
            </p>
          )}
        </div>

        {/* ── Realistic PAN Card Graphic ── */}
        {(form.panVerified || form.panNumber.length >= 5) && (
          <div className="relative overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/95 via-sky-50/80 to-indigo-100/70 p-4 sm:p-5 shadow-xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-700 tracking-wider">
              <span>INCOME TAX DEPT.</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">🇮🇳</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">GOVT. OF INDIA</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Name</div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                    {String(form.panDetails?.fullName || form.fullName || "TECHSTAR PARTNER")}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Permanent Account Number</div>
                  <div className="text-xs sm:text-base font-black font-mono text-slate-900 tracking-widest">
                    {form.panNumber || "AABAV8504E"}
                  </div>
                </div>
              </div>

              {/* Avatar placeholder & sign graphic box */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg border border-slate-300 bg-white/90 flex items-center justify-center text-slate-300 shadow-2xs">
                  <User size={26} />
                </div>
                <div className="w-12 sm:w-14 h-4 rounded border border-slate-200 bg-white/80 flex items-center justify-center">
                  <span className="text-[8px] italic text-slate-400 font-serif">Verified</span>
                </div>
              </div>
            </div>

            {form.panVerified && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1 border-t border-blue-200/50">
                <Check size={13} strokeWidth={3} className="text-emerald-600 shrink-0" />
                <span>Government NSDL / ITD database matched</span>
              </div>
            )}
          </div>
        )}

        {/* GST Number Field */}
        {form.isGstRegistered === "Yes" && (
          <div className="space-y-1.5 pt-1">
            <label htmlFor="ob-gst-input" className="block text-xs sm:text-sm font-semibold text-slate-800">
              Your GST Number
            </label>
            <div className="flex h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3.5 items-center justify-between">
              <span className="font-mono text-sm uppercase text-slate-900 font-bold">
                {form.gstin || "27AABAV8504E1ZJ"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={13} /> Verified
              </span>
            </div>
          </div>
        )}

        {/* Date of Birth & Gender (Dropdown) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="ob-dob" className="block text-xs sm:text-sm font-semibold text-slate-800">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <input
              id="ob-dob"
              type="date"
              min={min}
              max={max}
              value={form.dob}
              onChange={e => patch({ dob: e.target.value })}
              className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
            />
            {fieldError("ob-dob") && (
              <p className="text-xs text-rose-500">{fieldError("ob-dob")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ob-gender" className="block text-xs sm:text-sm font-semibold text-slate-800">
              Gender <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="ob-gender"
                value={form.gender || ""}
                onChange={e => patch({ gender: e.target.value as any })}
                className="w-full h-11 sm:h-12 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-indigo-600 focus:outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {fieldError("ob-gender") && (
              <p className="text-xs text-rose-500">{fieldError("ob-gender")}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── CARD 2: Bank Account Setup (Matching User Screenshot 4) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="space-y-0.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Bank Account Setup</h2>
          <p className="text-xs text-slate-400">Commission disbursements are sent to this account.</p>
        </div>

        {/* Account Number Label matching Screenshot 4: Bank Account Number of TECHSTAR MONEY... */}
        <div className="space-y-1.5">
          <label htmlFor="ob-accountNumber" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Bank Account Number of <span className="uppercase text-slate-900 font-bold">{applicantName}</span> <span className="text-rose-500">*</span>
          </label>
          <input
            id="ob-accountNumber"
            type="text"
            inputMode="numeric"
            value={form.accountNumber}
            onChange={e => patch({ accountNumber: e.target.value.replace(/\D/g, "") })}
            placeholder="60591201503"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-accountNumber") && (
            <p className="text-xs text-rose-500">{fieldError("ob-accountNumber")}</p>
          )}
        </div>

        {/* Confirm Account Number */}
        <div className="space-y-1.5">
          <label htmlFor="ob-confirmAccountNumber" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Confirm Bank Account Number <span className="text-rose-500">*</span>
          </label>
          <input
            id="ob-confirmAccountNumber"
            type="text"
            inputMode="numeric"
            value={form.confirmAccountNumber}
            onChange={e => patch({ confirmAccountNumber: e.target.value.replace(/\D/g, "") })}
            placeholder="Re-enter bank account number"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-confirmAccountNumber") && (
            <p className="text-xs text-rose-500">{fieldError("ob-confirmAccountNumber")}</p>
          )}
        </div>

        {/* Account Holder Name */}
        <div className="space-y-1.5">
          <label htmlFor="ob-accountHolderName" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Account Holder Name (as per Bank) <span className="text-rose-500">*</span>
          </label>
          <input
            id="ob-accountHolderName"
            type="text"
            readOnly
            value={form.accountHolderName || ""}
            placeholder="Auto-populated once bank account is verified"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 cursor-not-allowed focus:outline-none transition-all"
          />
          {fieldError("ob-accountHolderName") && (
            <p className="text-xs text-rose-500">{fieldError("ob-accountHolderName")}</p>
          )}
        </div>

        {/* IFSC Code with Search Icon */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ob-ifsc" className="text-xs sm:text-sm font-semibold text-slate-800">
              IFSC code <span className="text-rose-500">*</span>
            </label>
            {form.bankVerified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={14} /> Account Verified
              </span>
            )}
          </div>

          <div className="relative">
            <input
              id="ob-ifsc"
              type="text"
              maxLength={11}
              value={form.ifsc}
              onChange={e => {
                const clean = e.target.value.toUpperCase()
                patch({ ifsc: clean })
                if (clean.length === 11) void lookupIfsc(clean)
              }}
              placeholder="MAHB0001327"
              className="w-full h-11 sm:h-12 pl-3.5 pr-28 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
            />
            {/* Search for IFSC indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-indigo-600 text-xs font-semibold pointer-events-none">
              <Search size={14} />
              <span>Search for IFSC</span>
            </div>
          </div>
          {fieldError("ob-ifsc") && (
            <p className="text-xs text-rose-500">{fieldError("ob-ifsc")}</p>
          )}

          {/* Resolved Branch Display */}
          {Boolean(form.bankName || form.branchName) && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pt-1">
              <span className="text-sm">🏛️</span>
              <span>
                {form.bankName}{form.branchName ? `, ${form.branchName}` : ""}
              </span>
            </div>
          )}
          {ifscLoading && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <Loader2 size={13} className="animate-spin text-indigo-600" /> Fetching bank &amp; branch details…
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
                {bankVerifying ? <Loader2 size={14} className="animate-spin" /> : "Verify Bank Account"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 3: Document Uploads ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="space-y-0.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Upload Documents</h2>
          <p className="text-xs text-slate-400">Clear photos or PDFs of PAN and Aadhaar (max 5 MB each).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UploadTile
            id="ob-doc-panDoc"
            label="PAN Card Photo / Scan"
            required
            hint="Clear scan or photo of original PAN"
            {...slot("panDoc")}
            onOpenPicker={() => setPicking("panDoc")}
            onRetry={() => retryUpload("panDoc")}
            onRemove={() => removeDoc("panDoc")}
          />

          <UploadTile
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
            <UploadTile
              id="ob-doc-aadhaarBackDoc"
              label="Aadhaar — Back Side"
              required
              hint="Back side showing address"
              {...slot("aadhaarBackDoc")}
              onOpenPicker={() => setPicking("aadhaarBackDoc")}
              onRetry={() => retryUpload("aadhaarBackDoc")}
              onRemove={() => removeDoc("aadhaarBackDoc")}
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1 select-none">
          <input
            type="checkbox"
            checked={form.aadhaarCombined}
            onChange={e => patch({ aadhaarCombined: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Both sides of Aadhaar are on a single page / photo</span>
        </label>
      </div>

      {/* Image Crop Modal */}
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

      {/* ── Full Width Black Action Button: Verify / Continue (matching Screenshot 4) ── */}
      <StepNav
        onBack={back}
        onContinue={() => void saveAndContinue()}
        loading={saving}
        continueLabel="Verify & Continue"
      />
    </div>
  )
}
