"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
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
import { Callout, CheckRow, Fact, ReviewCard, Section, StepHeading } from "../ui"

/**
 * Step 3 — Review, Submit & Status.
 *
 * Before submission: shows a review summary of all data, MOU signing,
 * declarations, and the submit button.
 * After submission: shows the application status screen.
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

  // If submitted, show the status screen
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

/* ─── Review (pre-submission) ──────────────────────────────────────────── */

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileNumber, form.agreementSigned])

  const isFirm = form.partnerType === "Firm"
  const edit = (id: PartnerStepId) => () => goToStep(id)
  const docName = (key: keyof typeof form.documents) => form.documents[key]?.fileName
  const ready = form.agreementSigned && form.declareTruth && form.declareTerms

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 3 of 3"
        title="Review & Submit"
        description="Check every line. Once you submit, the application locks for review and can only be changed by our desk."
      />

      <div className="space-y-3">
        <ReviewCard step={1} title="1. Personal & Business Details" onEdit={edit(1)} complete={stepDone[1]}>
          <Fact label="Applying as" value={form.partnerType} />
          <Fact label="Full name" value={form.fullName} />
          <Fact label="Email" value={form.email} />
          <Fact label="Mobile" value={`+91 ${mobileNumber}`} mono />
          {form.referredByDsaCode ? <Fact label="Referred by" value={form.referredByDsaCode} mono /> : null}
          {isFirm ? <Fact label="Constitution" value={form.firmType} /> : null}
          {isFirm ? <Fact label="Business name" value={form.businessName} /> : null}
          <Fact label="Designation" value={form.designation} />
          <Fact label="GST registered" value={form.isGstRegistered} />
          {form.isGstRegistered === "Yes" ? (
            <Fact label="GSTIN" value={form.gstValid ? `${form.gstin} · verified` : form.gstin} mono />
          ) : null}
          {form.alternateMobile ? <Fact label="Alternate mobile" value={`+91 ${form.alternateMobile}`} mono /> : null}
          <Fact
            label="Address"
            value={[form.addressLine1, form.addressLine2, form.area].filter(Boolean).join(", ")}
          />
          <Fact label="City & state" value={[form.city, form.stateName].filter(Boolean).join(", ")} />
          <Fact label="PIN code" value={form.pinCode} mono />
        </ReviewCard>

        <ReviewCard step={2} title="2. KYC & Bank Account" onEdit={edit(2)} complete={stepDone[2]}>
          <Fact label="PAN" value={form.panVerified ? `${form.panNumber} · verified` : form.panNumber} mono />
          <Fact label="Date of birth" value={form.dob} mono />
          <Fact label="Gender" value={form.gender} />
          <Fact label="Account holder" value={form.accountHolderName} />
          <Fact
            label="Account number"
            value={form.accountNumber ? `••••••${form.accountNumber.slice(-4)}` : ""}
            mono
          />
          <Fact label="IFSC" value={form.ifsc} mono />
          <Fact label="Bank" value={[form.bankName, form.branchName].filter(Boolean).join(" — ")} />
          <Fact label="Type" value={`${form.accountType}${form.bankVerified ? " · verified" : ""}`} />
          <Fact label="PAN card" value={docName("panDoc")} />
          <Fact label="Aadhaar front" value={docName("aadhaarFrontDoc")} />
          <Fact label="Aadhaar back" value={form.aadhaarCombined ? "Same file as front" : docName("aadhaarBackDoc")} />
        </ReviewCard>
      </div>

      <Section title="Partner agreement (MOU)" hint="Signed with a one-time code sent to your verified WhatsApp number.">
        <div id="ob-agreement" tabIndex={-1} className="admin-focus rounded-admin">
          <PartnerAgreementModal
            partnerData={{
              mobileNumber,
              email: form.email,
              fullName: form.fullName || form.contactPersonName,
              agreementSigned: form.agreementSigned,
            }}
            onSigned={() => patch({ agreementSigned: true })}
          />
        </div>
      </Section>

      <Section title="Declarations" hint="Both are required. They form part of the record we file.">
        <div id="ob-declarations" tabIndex={-1} className="admin-focus space-y-2.5 rounded-admin">
          <CheckRow id="ob-declareTruth" checked={form.declareTruth} onChange={next => patch({ declareTruth: next })}>
            I confirm that every detail and document in this application is true, complete and my own, and I understand
            that a false declaration can end my partnership and any commission owed under it.
          </CheckRow>
          <CheckRow id="ob-declareTerms" checked={form.declareTerms} onChange={next => patch({ declareTerms: next })}>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="font-bold underline underline-offset-2">
              partner terms and conditions
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" target="_blank" className="font-bold underline underline-offset-2">
              privacy policy
            </Link>
            , and I authorise Techstar Money Solution to verify my KYC and bank details with the relevant authorities.
          </CheckRow>
        </div>
        {invalidField === "ob-declarations" || invalidField === "ob-agreement" ? (
          <Callout tone="danger">
            {invalidField === "ob-agreement"
              ? "Sign the partner MOU above before submitting."
              : "Tick both confirmations above before submitting."}
          </Callout>
        ) : null}
      </Section>

      <div className="sticky bottom-0 z-20 -mx-3.5 sm:mx-0 pt-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f8fafc]/90 backdrop-blur-md">
        <button
          type="button"
          onClick={() => void submitApplication()}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>{submitting ? "Submitting Application…" : "Submit Application"}</span>
        </button>
      </div>

      {!ready && (
        <p className="text-center text-xs text-slate-400">
          Still to do: sign the MOU and tick both declarations above.
        </p>
      )}
    </div>
  )
}

/* ─── Status (post-submission) ─────────────────────────────────────────── */

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
      tone: "border-tone-info-bd bg-tone-info text-tone-info-fg",
      badge: "Submitted & locked",
      BadgeIcon: Lock,
      heading: "Your application is under review",
      marathi: "तुमचा DSA Partner अर्ज यशस्वीरित्या सबमिट झालेला असून तो सुरक्षिततेसाठी लॉक करण्यात आला आहे.",
      note: "Our partner operations desk is checking your KYC and bank details. Most applications are decided within one working day, and every update arrives on WhatsApp.",
    },
    approved: {
      Icon: CheckCircle2,
      tone: "border-tone-success-bd bg-tone-success text-tone-success-fg",
      badge: "Approved",
      BadgeIcon: CheckCircle2,
      heading: "You are a Techstar Money partner",
      marathi: "तुमचा DSA Partner अर्ज मंजूर झाला आहे. आता तुम्ही partner portal मध्ये लॉगिन करू शकता.",
      note: "Sign in to the partner portal to start submitting files and tracking your commission.",
    },
    rejected: {
      Icon: AlertTriangle,
      tone: "border-tone-danger-bd bg-tone-danger text-tone-danger-fg",
      badge: "Not approved",
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

  const timeline: { title?: string; description?: string; timestamp?: string }[] = Array.isArray(application?.timeline)
    ? application!.timeline
    : []

  const copyId = () => {
    if (!applicationId) return
    void navigator.clipboard.writeText(applicationId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      <StepHeading eyebrow="Step 3 of 3" title="Application Status" description="Where your application has got to." />

      <section className="space-y-4 rounded-admin-lg border border-admin-border bg-admin-surface p-5 text-center shadow-admin-2 sm:p-7">
        <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full border", look.tone)}>
          <look.Icon size={32} />
        </div>

        <div className="space-y-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-admin-2xs font-bold uppercase tracking-widest",
              look.tone
            )}
          >
            <look.BadgeIcon size={12} /> {look.badge}
          </span>
          <h2 className="text-admin-2xl font-black tracking-tight text-admin-text">{look.heading}</h2>
          <p className="mx-auto max-w-xl text-admin-sm font-semibold text-admin-text">{look.marathi}</p>
          <p className="mx-auto max-w-xl text-admin-xs leading-relaxed text-admin-muted">{look.note}</p>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-admin-lg border border-admin-border bg-admin-surface-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="block text-admin-2xs font-bold uppercase tracking-wide text-admin-subtle">
              Application reference
            </span>
            <span className="admin-num block truncate font-mono text-admin-xl font-black text-admin-text">
              {applicationId || "—"}
            </span>
            <span className="admin-num block text-admin-2xs text-admin-muted">
              Updates go to WhatsApp +91 {mobileNumber}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={copyId}
              className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin border border-admin-border-strong bg-admin-surface px-3.5 text-admin-xs font-bold text-admin-text hover:bg-admin-surface-2"
            >
              <Check size={14} className={cn("transition-opacity", copied ? "opacity-100" : "hidden")} />
              <Copy size={14} className={cn(copied && "hidden")} />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={refreshingStatus}
              className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin border border-admin-border-strong bg-admin-surface px-3.5 text-admin-xs font-bold text-admin-text hover:bg-admin-surface-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(refreshingStatus && "animate-spin")} />
              Refresh
            </button>
            {outcome === "rejected" ? (
              <a
                href="tel:09579005645"
                className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin bg-brand px-4 text-admin-xs font-bold text-brand-fg hover:bg-brand-hover"
              >
                <Phone size={14} /> Call partner desk
              </a>
            ) : (
              <Link
                href={outcome === "approved" ? "/partner/login" : `/application-status?id=${applicationId ?? ""}`}
                className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin bg-brand px-4 text-admin-xs font-bold text-brand-fg hover:bg-brand-hover"
              >
                {outcome === "approved" ? "Go to partner login" : "Track live"} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <Section title="What happens next" hint="Each stage is confirmed on WhatsApp as it completes.">
        <ol className="relative space-y-0.5">
          {stages.map((stage, index) => (
            <li key={stage.label} className="relative flex items-start gap-3 py-1.5">
              {index < stages.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[13px] top-9 h-[calc(100%-1.5rem)] w-px",
                    stage.done ? "bg-tone-success-bd" : "bg-admin-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "admin-num relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-admin-2xs font-bold",
                  stage.done
                    ? "border-tone-success-bd bg-tone-success text-tone-success-fg"
                    : "border-admin-border bg-admin-surface text-admin-subtle"
                )}
              >
                {stage.done ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  "pt-1 text-admin-xs font-semibold",
                  stage.done ? "text-admin-text" : "text-admin-subtle"
                )}
              >
                {stage.label}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {timeline.length > 0 && (
        <Section title="Activity" hint="Everything recorded against this application so far.">
          <ul className="space-y-2.5">
            {timeline
              .slice()
              .reverse()
              .map((entry, index) => (
                <li key={`${entry.timestamp ?? index}`} className="rounded-admin border border-admin-border bg-admin-surface-2 px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-admin-xs font-bold text-admin-text">{entry.title || "Update"}</span>
                    {entry.timestamp && (
                      <span className="admin-num shrink-0 text-admin-2xs text-admin-subtle">
                        {new Date(entry.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                  {entry.description && <p className="mt-0.5 text-admin-2xs text-admin-muted">{entry.description}</p>}
                </li>
              ))}
          </ul>
        </Section>
      )}

      {outcome === "under_review" && (
        <Callout tone="info" title="Nothing more to do">
          You do not need to keep this page open. We message you on WhatsApp the moment a decision is made, and you can
          come back to the tracker any time with your reference number.
        </Callout>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border pt-4">
        <button
          type="button"
          onClick={resetMobile}
          className="admin-focus text-admin-xs font-bold text-admin-muted hover:text-admin-text"
        >
          ← Onboard another account
        </button>
        <a
          href={`https://wa.me/919579005645?text=${encodeURIComponent(
            `Hello Techstar Money, my DSA application ID is ${applicationId ?? ""}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-focus inline-flex items-center gap-1.5 text-admin-xs font-bold text-tone-success-fg hover:brightness-95"
        >
          <MessageSquare size={14} /> WhatsApp support
        </a>
      </div>
    </div>
  )
}
