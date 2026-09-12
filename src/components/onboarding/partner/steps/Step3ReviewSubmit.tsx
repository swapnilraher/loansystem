"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react"

import PartnerAgreementModal from "@/components/partner/PartnerAgreementModal"
import { PARTNER_ONBOARDING_STEPS, type PartnerStepId } from "@/lib/onboarding-steps"
import { cn } from "@/lib/utils"

import { useOnboarding } from "../OnboardingContext"
import {
  Callout,
  CheckRow,
  Fact,
  ReviewCard,
  SectionCard,
  StepHeading,
  StepNav,
  VerifyPill,
} from "../ui"

/**
 * Step 3 — Review, Submit & Status.
 *
 * Before submission:
 * - Accordion review sections (Personal & Business, KYC, Bank Account, Documents)
 * - Partner agreement MOU execution card
 * - Accessible declarations with clickable legal links
 * - Ready to submit notice & sticky CTA bar
 *
 * After submission:
 * - Polished fintech Application Submitted success screen with real Application ID
 */
export function Step3ReviewSubmit() {
  const {
    form,
    patch,
    mobileNumber,
    stepDone,
    goToStep,
    back,
    submitApplication,
    submitting,
    invalidField,
    isSubmitted,
    applicationId,
    outcome,
    application,
    refreshStatus,
    refreshingStatus,
    resetMobile,
  } = useOnboarding()

  if (isSubmitted) {
    return (
      <StatusView
        applicationId={applicationId}
        mobileNumber={mobileNumber}
        outcome={outcome}
        application={application}
        refreshStatus={refreshStatus}
        refreshingStatus={refreshingStatus}
        resetMobile={resetMobile}
      />
    )
  }

  return (
    <ReviewView
      form={form}
      patch={patch}
      mobileNumber={mobileNumber}
      stepDone={stepDone}
      goToStep={goToStep}
      back={back}
      submitApplication={submitApplication}
      submitting={submitting}
      invalidField={invalidField}
    />
  )
}

/* ─── Review (Pre-Submission) ────────────────────────────────────────────── */

function ReviewView({
  form,
  patch,
  mobileNumber,
  stepDone,
  goToStep,
  back,
  submitApplication,
  submitting,
  invalidField,
}: {
  form: any
  patch: (p: any) => void
  mobileNumber: string
  stepDone: Record<PartnerStepId, boolean>
  goToStep: (id: PartnerStepId) => void
  back: () => void
  submitApplication: () => Promise<void>
  submitting: boolean
  invalidField: string | null
}) {
  const agreementSynced = useRef(false)

  useEffect(() => {
    if (agreementSynced.current || !mobileNumber || form.agreementSigned) return
    agreementSynced.current = true
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/partner/agreement/sign?mobile=${encodeURIComponent(mobileNumber)}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data?.exists || !data.agreement?.agreementSigned) return
        patch({
          agreementSigned: true,
          agreementPdfUrl: data.agreement.agreementDocumentUrl || null,
        })
      } catch (err) {
        console.warn("[onboarding] agreement status lookup failed", err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mobileNumber, form.agreementSigned, patch])

  const isFirm = form.partnerType === "Firm"
  const edit = (id: PartnerStepId) => () => goToStep(id)
  const docName = (key: keyof typeof form.documents) => form.documents[key]?.fileName
  const ready = form.agreementSigned && form.declareTruth && form.declareTerms

  // Summary lines for collapsed accordion state
  const summaryPersonal = `${form.fullName || "Partner"} · ${form.partnerType}${
    isFirm ? ` (${form.businessName || form.firmType})` : ""
  } · ${form.city || ""}`

  const summaryKyc = `PAN: ${form.panNumber || "—"} (${
    form.panVerified ? "Verified" : "Pending"
  }) · DOB: ${form.dob || "—"}`

  const summaryBank = `${form.bankName || "Bank"} · ••••${
    form.accountNumber?.slice(-4) || "—"
  } · ${form.bankVerified ? "Verified" : "Added"}`

  const summaryDocs = `${docName("panDoc") ? "PAN Card" : ""}${
    docName("aadhaarFrontDoc") ? ", Aadhaar Front" : ""
  }${form.aadhaarCombined ? " (Combined)" : docName("aadhaarBackDoc") ? ", Aadhaar Back" : ""}`

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page Heading ── */}
      <StepHeading
        eyebrow="Step 3 of 3"
        title="Review & Submit"
        description="Please review all your information carefully before submitting your partner application."
      />

      {/* ── Accordion Review Sections (Requirement 28) ── */}
      <div className="space-y-3.5">
        {/* Section 1: Personal & Business Details */}
        <ReviewCard
          step={1}
          title="Personal & Business Details"
          summary={summaryPersonal}
          onEdit={edit(1)}
          complete={stepDone[1]}
          defaultExpanded={true}
        >
          <Fact label="Full Name" value={form.fullName} />
          <Fact label="Applying As" value={form.partnerType} />
          <Fact label="Email Address" value={form.email} />
          <Fact label="Mobile Number" value={`+91 ${mobileNumber}`} mono />
          {form.alternateMobile && (
            <Fact label="Alternate Mobile" value={`+91 ${form.alternateMobile}`} mono />
          )}
          {isFirm && <Fact label="Constitution" value={form.firmType} />}
          {isFirm && <Fact label="Business Name" value={form.businessName} />}
          <Fact label="Designation" value={form.designation} />
          <Fact
            label="GST Registration"
            value={
              form.isGstRegistered === "Yes"
                ? `${form.gstin} · ${form.gstValid ? "Verified" : "Provided"}`
                : "Not Registered"
            }
            mono={form.isGstRegistered === "Yes"}
          />
          <Fact
            label="Operating Address"
            value={[form.addressLine1, form.area].filter(Boolean).join(", ")}
          />
          <Fact label="City & State" value={[form.city, form.stateName].filter(Boolean).join(", ")} />
          <Fact label="PIN Code" value={form.pinCode} mono />
        </ReviewCard>

        {/* Section 2: KYC Details */}
        <ReviewCard
          step={2}
          title="KYC Details"
          summary={summaryKyc}
          onEdit={edit(2)}
          complete={stepDone[2]}
          defaultExpanded={false}
        >
          <Fact
            label="PAN Number"
            value={form.panVerified ? `${form.panNumber} (Verified)` : form.panNumber}
            mono
          />
          <Fact label="Date of Birth" value={form.dob} mono />
          <Fact label="Gender" value={form.gender} />
        </ReviewCard>

        {/* Section 3: Bank Account */}
        <ReviewCard
          step={2}
          title="Bank Account Setup"
          summary={summaryBank}
          onEdit={edit(2)}
          complete={stepDone[2]}
          defaultExpanded={false}
        >
          <Fact label="Account Holder" value={form.accountHolderName} />
          <Fact
            label="Account Number"
            value={form.accountNumber ? `••••••••${form.accountNumber.slice(-4)}` : ""}
            mono
          />
          <Fact label="IFSC Code" value={form.ifsc} mono />
          <Fact
            label="Bank & Branch"
            value={[form.bankName, form.branchName].filter(Boolean).join(" — ")}
          />
          <Fact
            label="Account Status"
            value={form.bankVerified ? "Verified with Bank Records" : "Details Submitted"}
          />
        </ReviewCard>

        {/* Section 4: Uploaded Documents */}
        <ReviewCard
          step={2}
          title="Documents"
          summary={summaryDocs}
          onEdit={edit(2)}
          complete={stepDone[2]}
          defaultExpanded={false}
        >
          <Fact label="PAN Card Photo" value={docName("panDoc") || "Uploaded"} />
          <Fact label="Aadhaar Front" value={docName("aadhaarFrontDoc") || "Uploaded"} />
          <Fact
            label="Aadhaar Back"
            value={form.aadhaarCombined ? "Same file as front (Combined)" : docName("aadhaarBackDoc") || "Uploaded"}
          />
          {docName("gstDoc") && <Fact label="GST Certificate" value={docName("gstDoc")} />}
          {docName("chequeDoc") && <Fact label="Bank Document" value={docName("chequeDoc")} />}
        </ReviewCard>
      </div>

      {/* ── Partner Agreement MOU (Requirement 26) ── */}
      <SectionCard
        title="Partner Agreement (MOU)"
        hint="Digitally executed and recorded via verified WhatsApp authentication."
      >
        {form.agreementSigned ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Agreement Successfully Executed
                  </div>
                  <p className="text-xs text-slate-500">
                    Your DSA partner agreement has been digitally signed and recorded.
                  </p>
                </div>
              </div>
              <VerifyPill state="verified" label="Executed" />
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              {form.agreementPdfUrl ? (
                <a
                  href={form.agreementPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Eye size={14} className="text-slate-500" />
                  <span>View Signed Agreement</span>
                </a>
              ) : (
                <PartnerAgreementModal
                  partnerData={{
                    mobileNumber,
                    email: form.email,
                    fullName: form.fullName || form.contactPersonName,
                    agreementSigned: true,
                  }}
                  onSigned={() => patch({ agreementSigned: true })}
                />
              )}
            </div>
          </div>
        ) : (
          <div id="ob-agreement" tabIndex={-1} className="space-y-3">
            <PartnerAgreementModal
              partnerData={{
                mobileNumber,
                email: form.email,
                fullName: form.fullName || form.contactPersonName,
                agreementSigned: false,
              }}
              onSigned={() => patch({ agreementSigned: true })}
            />
          </div>
        )}
      </SectionCard>

      {/* ── Declarations (Requirement 27) ── */}
      <SectionCard
        title="Declarations & Authorisation"
        hint="Both confirmations are required before your application can be filed."
      >
        <div id="ob-declarations" tabIndex={-1} className="space-y-3">
          <CheckRow
            id="ob-declareTruth"
            checked={form.declareTruth}
            onChange={(next) => patch({ declareTruth: next })}
          >
            I confirm that every detail and document in this application is true, complete and my
            own, and I understand that a false declaration can end my partnership and any
            commission owed under it.
          </CheckRow>

          <CheckRow
            id="ob-declareTerms"
            checked={form.declareTerms}
            onChange={(next) => patch({ declareTerms: next })}
          >
            I accept the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-bold text-slate-900 underline underline-offset-2 hover:text-indigo-600"
            >
              Partner Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-bold text-slate-900 underline underline-offset-2 hover:text-indigo-600"
            >
              Privacy Policy
            </Link>{" "}
            and I authorise Techstar Money Solution to verify my KYC and bank details with the
            relevant authorities.
          </CheckRow>
        </div>

        {(invalidField === "ob-declarations" || invalidField === "ob-agreement") && (
          <Callout tone="danger">
            {invalidField === "ob-agreement"
              ? "Please sign the partner MOU agreement before submitting."
              : "Please accept both declarations above to continue."}
          </Callout>
        )}
      </SectionCard>

      {/* ── Ready to Submit Card (Requirement 29) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-slate-900">Ready to submit?</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please review your information before submitting your partner application.
          </p>
        </div>
      </div>

      {/* ── Sticky Mobile Action CTA Bar ── */}
      <div className="sticky bottom-0 z-30 -mx-3 sm:mx-0 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f8fafc]/90 backdrop-blur-md border-t border-slate-200/80 sm:border-t-0 sm:bg-transparent">
        <button
          type="button"
          onClick={() => void submitApplication()}
          disabled={submitting || !ready}
          className="w-full h-12 sm:h-13 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm sm:text-base font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Submitting Application…</span>
            </>
          ) : (
            <>
              <span>Submit Application</span>
              <Send size={16} />
            </>
          )}
        </button>

        {!ready && (
          <p className="text-center text-xs text-slate-500 pt-2">
            Please accept both declarations and sign the MOU agreement to enable submission.
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Status & Success Screen (Requirement 30) ───────────────────────────── */

function StatusView({
  applicationId,
  mobileNumber,
  outcome,
  application,
  refreshStatus,
  refreshingStatus,
  resetMobile,
}: {
  applicationId: string | null
  mobileNumber: string
  outcome: "under_review" | "approved" | "rejected"
  application: Record<string, any> | null
  refreshStatus: () => Promise<void>
  refreshingStatus: boolean
  resetMobile: () => void
}) {
  const [copied, setCopied] = useState(false)

  const look = {
    under_review: {
      Icon: ShieldCheck,
      tone: "border-blue-200 bg-blue-50/80 text-blue-700",
      badge: "Under Review",
      BadgeIcon: Lock,
      heading: "Application Submitted",
      marathi: "तुमचा DSA Partner अर्ज यशस्वीरित्या सबमिट झालेला असून तो पडताळणी अंतर्गत आहे.",
      note: "Our partner operations desk is checking your KYC and bank details. Most applications are decided within one working day, and every update arrives on WhatsApp.",
    },
    approved: {
      Icon: CheckCircle2,
      tone: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
      badge: "Approved & Active",
      BadgeIcon: CheckCircle2,
      heading: "You are a Techstar Money Partner!",
      marathi: "तुमचा DSA Partner अर्ज मंजूर झाला आहे. आता तुम्ही partner portal मध्ये लॉगिन करू शकता.",
      note: "Sign in to the partner portal to start submitting loan files and tracking your commission payouts.",
    },
    rejected: {
      Icon: AlertTriangle,
      tone: "border-rose-200 bg-rose-50/80 text-rose-700",
      badge: "Not Approved",
      BadgeIcon: AlertTriangle,
      heading: "This application was not approved",
      marathi: "तुमचा अर्ज सध्या मंजूर होऊ शकला नाही. कृपया आमच्या partner desk शी संपर्क साधा.",
      note: "Our desk can tell you exactly what fell short and whether you can reapply.",
    },
  }[outcome]

  const stages = [
    { label: "Application submitted", done: true },
    { label: "KYC & document check", done: outcome !== "under_review" },
    { label: "Bank account verification", done: outcome === "approved" },
    { label: "Partner account activated", done: outcome === "approved" },
  ]

  const timeline: { title?: string; description?: string; timestamp?: string }[] = Array.isArray(
    application?.timeline
  )
    ? application!.timeline
    : []

  const copyId = () => {
    if (!applicationId) return
    void navigator.clipboard.writeText(applicationId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page Heading ── */}
      <StepHeading
        eyebrow="Step 3 of 3"
        title="Application Status"
        description="Track the verification and activation status of your DSA partner registration."
      />

      {/* ── Main Status Card (Requirement 30) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
        <div
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full border shadow-inner",
            look.tone
          )}
        >
          <look.Icon size={32} />
        </div>

        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
              look.tone
            )}
          >
            <look.BadgeIcon size={12} /> {look.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {look.heading}
          </h2>
          <p className="mx-auto max-w-lg text-xs sm:text-sm font-semibold text-slate-800">
            {look.marathi}
          </p>
          <p className="mx-auto max-w-lg text-xs text-slate-500 leading-relaxed">
            {look.note}
          </p>
        </div>

        {/* Reference & Actions Box */}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
              Application ID
            </span>
            <span className="block truncate font-mono text-lg sm:text-xl font-extrabold text-slate-900">
              {applicationId || "TS-PENDING"}
            </span>
            <span className="block text-xs text-slate-500">
              Updates sent to WhatsApp +91 {mobileNumber}
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={copyId}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-slate-400" />
                  <span>Copy ID</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={refreshingStatus}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={cn(refreshingStatus && "animate-spin text-indigo-600")} />
              <span>Refresh</span>
            </button>

            {outcome === "approved" && (
              <Link
                href="/partner/login"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#18181b] hover:bg-black px-4 text-xs font-semibold text-white transition-all"
              >
                <span>Go to Partner Login</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress Stages ── */}
      <SectionCard
        title="What Happens Next"
        hint="Each stage is confirmed on WhatsApp as it completes."
      >
        <ol className="relative space-y-1">
          {stages.map((stage, index) => (
            <li key={stage.label} className="relative flex items-start gap-3 py-2">
              {index < stages.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[13px] top-9 h-[calc(100%-1.25rem)] w-px",
                    stage.done ? "bg-emerald-400" : "bg-slate-200"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2",
                  stage.done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-400"
                )}
              >
                {stage.done ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  "pt-1 text-xs sm:text-sm font-semibold",
                  stage.done ? "text-slate-900" : "text-slate-400"
                )}
              >
                {stage.label}
              </span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* ── Timeline Activity ── */}
      {timeline.length > 0 && (
        <SectionCard title="Application Activity" hint="Recorded milestones for this application.">
          <ul className="space-y-2.5">
            {timeline
              .slice()
              .reverse()
              .map((entry, index) => (
                <li
                  key={`${entry.timestamp ?? index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-bold text-slate-900">
                      {entry.title || "Update"}
                    </span>
                    {entry.timestamp && (
                      <span className="shrink-0 font-mono text-[11px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{entry.description}</p>
                  )}
                </li>
              ))}
          </ul>
        </SectionCard>
      )}

      {/* ── Action Footers ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={resetMobile}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          ← Onboard another account
        </button>

        <a
          href={`https://wa.me/919579005645?text=${encodeURIComponent(
            `Hello Techstar Money, my DSA application ID is ${applicationId ?? ""}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <MessageSquare size={14} /> WhatsApp Support
        </a>
      </div>
    </div>
  )
}
