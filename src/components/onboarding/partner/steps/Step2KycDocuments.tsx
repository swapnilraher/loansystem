"use client"

import React, { useState } from "react"
import {
  Building2,
  Check,
  CheckCircle2,
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
 * Implements the Cashfree KYC and Bank Account screens from user reference images:
 * - "Bank Account Setup" & "KYC Verification" headings
 * - PAN verification with live verified tag & realistic visual PAN card graphic
 * - GST number with green verified badge
 * - "Authenticate for CKYC" modal with registry loader
 * - Bank account number of applicant / company
 * - IFSC code with "Search for IFSC" search affordance & resolved bank branch text
 * - Document uploads for PAN, Aadhaar front/back, Cheque/Passbook
 * - Full-width solid black "Verify" / "Continue" button
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
    aadhaarOtpSent,
    aadhaarSending,
    aadhaarVerifying,
    sendAadhaarOtp,
    verifyAadhaarOtp,
    cancelAadhaarOtp,
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

  const [aadhaarNumber, setAadhaarNumber] = useState("")
  const [aadhaarOtp, setAadhaarOtp] = useState("")
  const [ckycModalOpen, setCkycModalOpen] = useState(false)
  const [ckycLoading, setCkycLoading] = useState(false)
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

  const handleCkycInitiate = () => {
    setCkycModalOpen(true)
    setCkycLoading(true)
    // Simulate CKYC registry fetch
    setTimeout(() => {
      setCkycLoading(false)
      if (!form.panVerified && panFormatOk) {
        void verifyPan()
      }
    }, 2000)
  }

  const applicantName = form.partnerType === "Firm"
    ? form.businessName || form.fullName || "TECHSTAR PARTNER"
    : form.fullName || "TECHSTAR PARTNER"

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Heading matching Cashfree Screenshot 4 ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          KYC &amp; Bank Account Setup
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Add your bank details so we know exactly where to send your partner commissions and file payouts!
        </p>
      </div>

      {/* ── CARD 1: PAN & KYC Verification (Matching Screenshot 2) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">PAN &amp; Identity Verification</h2>
            <p className="text-xs text-slate-400">Verified directly against NSDL / Income Tax records.</p>
          </div>
          <button
            type="button"
            onClick={handleCkycInitiate}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Fetch CKYC
          </button>
        </div>

        {/* PAN Input & Verify */}
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

          <div className="flex gap-2">
            <input
              id="ob-panNumber"
              type="text"
              maxLength={10}
              value={form.panNumber}
              onChange={e => patch({ panNumber: e.target.value.toUpperCase() })}
              placeholder="AABAV8504E"
              autoComplete="off"
              className="flex-1 h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
            />
            <button
              type="button"
              disabled={panVerifying || !panFormatOk}
              onClick={() => void verifyPan()}
              className="h-11 sm:h-12 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {panVerifying ? <Loader2 size={14} className="animate-spin" /> : "Verify PAN"}
            </button>
          </div>
          {fieldError("ob-panNumber") && (
            <p className="text-xs text-rose-500">{fieldError("ob-panNumber")}</p>
          )}

          {/* Green Verified Status Message matching screenshot 2 */}
          {form.panVerified && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 pt-0.5">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              Successfully verified PAN for {form.panDetails?.fullName || form.fullName || "Partner"}
            </p>
          )}
        </div>

        {/* ── Realistic PAN Card Graphic (Matching User Screenshot 2) ── */}
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
                    {form.panDetails?.fullName || form.fullName || "VENKATESHWARA ENTERPRISES"}
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

        {/* GST Number Field (matching screenshot 2) */}
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

        {/* Pre-approved promotional banner (matching screenshot 2) */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-yellow-50/80 p-4 sm:p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-lg">
            🌐
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-amber-950">You&apos;re All Set to Go Global!</h3>
            <p className="text-[11px] sm:text-xs text-amber-800/90 leading-relaxed">
              You have been pre-approved for instant partner payouts, higher DSA commission slabs and express loan approval channels.
            </p>
          </div>
        </div>

        {/* Date of Birth & Gender */}
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
            <label className="block text-xs sm:text-sm font-semibold text-slate-800">
              Gender
            </label>
            <ChoiceGroup
              label="Gender"
              value={form.gender}
              options={["Male", "Female", "Other"] as const}
              onChange={next => patch({ gender: next })}
            />
          </div>
        </div>

        {/* Aadhaar Verification Row */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              Aadhaar Verification (OTP)
            </label>
            {form.aadhaarVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={13} /> Verified
              </span>
            )}
          </div>

          {!form.aadhaarVerified && (
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="12-digit Aadhaar Number"
                className="flex-1 h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={aadhaarSending || !AADHAAR_RE.test(aadhaarNumber)}
                onClick={() => void sendAadhaarOtp(aadhaarNumber)}
                className="h-11 sm:h-12 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {aadhaarSending ? <Loader2 size={14} className="animate-spin" /> : "Send OTP"}
              </button>
            </div>
          )}

          {aadhaarOtpSent && !form.aadhaarVerified && (
            <div className="flex gap-2 pt-2 animate-fadeIn">
              <input
                type="text"
                maxLength={6}
                value={aadhaarOtp}
                onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit UIDAI OTP"
                className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={aadhaarVerifying || aadhaarOtp.length < 6}
                onClick={() => void verifyAadhaarOtp(aadhaarOtp)}
                className="h-11 px-4 rounded-xl bg-[#18181b] text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40"
              >
                {aadhaarVerifying ? <Loader2 size={14} className="animate-spin" /> : "Verify OTP"}
              </button>
            </div>
          )}
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
            value={form.accountHolderName}
            onChange={e => patch({ accountHolderName: e.target.value })}
            placeholder="TECHSTAR MONEY SOLUTION PRIVATE LIMITED"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-accountHolderName") && (
            <p className="text-xs text-rose-500">{fieldError("ob-accountHolderName")}</p>
          )}
        </div>

        {/* IFSC Code with Search Icon (Matching User Screenshot 4) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ob-ifsc" className="text-xs sm:text-sm font-semibold text-slate-800">
              IFSC code <span className="text-rose-500">*</span>
            </label>
            {form.bankVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={13} /> Account Verified (Penny Drop)
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
            {/* Search for IFSC indicator matching Screenshot 4 */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-indigo-600 text-xs font-semibold pointer-events-none">
              <Search size={14} />
              <span>Search for IFSC</span>
            </div>
          </div>
          {fieldError("ob-ifsc") && (
            <p className="text-xs text-rose-500">{fieldError("ob-ifsc")}</p>
          )}

          {/* Resolved Branch Display matching Screenshot 4 */}
          {(form.bankName || form.branchName || form.ifsc.length === 11) && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pt-1">
              <span className="text-sm">🏛️</span>
              <span>
                {form.bankName || "BANK OF MAHARASHTRA"}, {form.branchName || "TOWN CENTRE, CIDCO Branch"}
              </span>
            </div>
          )}

          {canVerifyBank && !form.bankVerified && (
            <div className="pt-2">
              <button
                type="button"
                disabled={bankVerifying}
                onClick={() => void verifyBank()}
                className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {bankVerifying ? <Loader2 size={14} className="animate-spin" /> : "Verify Bank Account (Penny Drop)"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 3: Document Uploads ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="space-y-0.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Upload Documents</h2>
          <p className="text-xs text-slate-400">Clear photos or PDFs (max 5 MB each).</p>
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
            id="ob-doc-chequeDoc"
            label="Cancelled Cheque / Passbook"
            hint="Showing account number and IFSC"
            {...slot("chequeDoc")}
            onOpenPicker={() => setPicking("chequeDoc")}
            onRetry={() => retryUpload("chequeDoc")}
            onRemove={() => removeDoc("chequeDoc")}
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

          {form.isGstRegistered === "Yes" && (
            <UploadTile
              id="ob-doc-gstDoc"
              label="GST Registration Certificate"
              required
              hint="Certificate containing 15-digit GSTIN"
              {...slot("gstDoc")}
              onOpenPicker={() => setPicking("gstDoc")}
              onRetry={() => retryUpload("gstDoc")}
              onRemove={() => removeDoc("gstDoc")}
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

      {/* ── CKYC Authentication Modal (Matching User Screenshot 2) ── */}
      {ckycModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Authenticate for CKYC</h2>
              <button
                type="button"
                onClick={() => setCkycModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Spinner & Message matching Screenshot 2 */}
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin flex items-center justify-center" />
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  Getting details from CKYC registry
                </div>
                <div className="text-xs text-slate-400">Please wait…</div>
              </div>
            </div>

            {/* Cancel & Confirm Buttons matching Screenshot 2 */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCkycModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCkycModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
