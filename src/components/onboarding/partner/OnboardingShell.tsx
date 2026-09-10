"use client"

/**
 * The frame the eight steps sit in.
 *
 * Two columns from `lg`: a fixed rail on the left that answers "how much is
 * left?" without scrolling, and the step itself on the right. Below `lg` the
 * rail collapses into a one-line bar with a full-screen list behind it, because
 * eight rows above the fold would leave no room for the form on a phone.
 */

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Headphones, Loader2, Lock } from "lucide-react"

import { FormErrorRegion } from "@/components/onboarding/FormErrorRegion"
import { LAST_INPUT_STEP, type PartnerStepId } from "@/lib/onboarding-steps"

import { useOnboarding } from "./OnboardingContext"
import { MobileGate } from "./MobileGate"
import { MobileStepBar, MobileStepSheet, StepRail } from "./StepRail"
import { formatWhen } from "./net"
import { Step1BasicInfo } from "./steps/Step1BasicInfo"
import { Step2BusinessDetails } from "./steps/Step2BusinessDetails"
import { Step3ContactAddress } from "./steps/Step3ContactAddress"
import { Step4Kyc } from "./steps/Step4Kyc"
import { Step5BankDetails } from "./steps/Step5BankDetails"
import { Step6Documents } from "./steps/Step6Documents"
import { Step7Review } from "./steps/Step7Review"
import { Step8Status } from "./steps/Step8Status"

const STEP_COMPONENTS: Record<PartnerStepId, () => React.JSX.Element> = {
  1: Step1BasicInfo,
  2: Step2BusinessDetails,
  3: Step3ContactAddress,
  4: Step4Kyc,
  5: Step5BankDetails,
  6: Step6Documents,
  7: Step7Review,
  8: Step8Status,
}

export function OnboardingShell() {
  const {
    isMobileVerified,
    mobileNumber,
    form,
    step,
    goToStep,
    stepDone,
    lockReason,
    stepError,
    stepErrorKind,
    resuming,
    restoredNote,
    draftConflict,
    preferLocalDraft,
    dismissDraftConflict,
    discardLocalDraft,
    resetMobile,
    isSubmitted,
  } = useOnboarding()

  const [sheetOpen, setSheetOpen] = useState(false)

  const locked = isMobileVerified ? lockReason(step) : null
  const StepBody = STEP_COMPONENTS[step]
  const identity = form.fullName || form.businessName || (mobileNumber ? `+91 ${mobileNumber}` : "New partner")

  return (
    <div className="partner-root flex min-h-dvh flex-col bg-admin-bg font-sans text-admin-text">
      <TopBar showSteps={isMobileVerified && !isSubmitted} onOpenSteps={() => setSheetOpen(true)} step={step} stepDone={stepDone} />

      {isMobileVerified && !isSubmitted && (
        <MobileStepSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          current={step}
          stepDone={stepDone}
          lockReason={lockReason}
          onJump={goToStep}
        />
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        {/* ── Rail ───────────────────────────────────────────────────────── */}
        {isMobileVerified && !isSubmitted && (
          <aside className="hidden w-80 shrink-0 border-r border-admin-border bg-admin-surface p-6 lg:block xl:w-88">
            <div className="sticky top-20 space-y-6">
              <div className="flex items-center gap-3 border-b border-admin-border pb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-lg bg-brand text-admin-sm font-black text-brand-fg shadow-admin-2">
                  {identity.replace(/^\+91\s*/, "").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-admin-sm font-extrabold text-admin-text">{identity}</span>
                  <span className="block truncate text-admin-2xs font-semibold text-admin-subtle">
                    {form.partnerType}
                    {form.partnerType === "Firm" ? ` · ${form.firmType}` : ""}
                  </span>
                </span>
              </div>

              <StepRail current={step} stepDone={stepDone} lockReason={lockReason} onJump={goToStep} />

              <div className="space-y-2 border-t border-admin-border pt-5 text-admin-2xs text-admin-subtle">
                <div className="flex items-center gap-1.5 text-admin-xs font-bold text-admin-text">
                  <Headphones size={14} className="text-brand" /> Stuck on something?
                </div>
                <p className="leading-relaxed text-admin-muted">
                  Our partner desk in Chhatrapati Sambhajinagar can walk you through any step.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                  <a href="tel:09579005645" className="admin-focus font-bold text-admin-text hover:text-brand">
                    095790 05645
                  </a>
                  <a
                    href="https://wa.me/919579005645"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-focus font-bold text-tone-success-fg hover:brightness-95"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── Step ───────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-admin-surface px-3.5 py-5 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-3xl">
            {!isMobileVerified ? (
              <MobileGate />
            ) : (
              <div className="space-y-4">
                <VerifiedStrip
                  mobileNumber={mobileNumber}
                  resuming={resuming}
                  locked={isSubmitted}
                  onDiscard={discardLocalDraft}
                  onChange={resetMobile}
                />

                <FormErrorRegion message={stepError} kind={stepErrorKind} id="onboarding-step-error" />

                {restoredNote && !draftConflict && (
                  <div className="flex items-start gap-2 rounded-admin border border-tone-info-bd bg-tone-info px-3.5 py-2.5 text-admin-xs font-semibold text-tone-info-fg">
                    <Clock size={14} className="mt-px shrink-0" />
                    <span>{restoredNote}</span>
                  </div>
                )}

                {draftConflict && (
                  <div className="space-y-2.5 rounded-admin-lg border border-tone-warn-bd bg-tone-warn p-3.5 text-admin-xs text-tone-warn-fg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={15} className="mt-px shrink-0" />
                      <div className="space-y-1">
                        <div className="font-bold">Two versions of this application</div>
                        <p className="leading-relaxed">
                          Your account has you on step {draftConflict.serverStep}; this device was left on step{" "}
                          {draftConflict.localStep}, {formatWhen(draftConflict.localSavedAt)}. We opened{" "}
                          {draftConflict.applied === "server" ? "the one from your account" : "the one from this device"}.
                        </p>
                      </div>
                    </div>
                    {draftConflict.applied === "server" && (
                      <div className="flex flex-wrap gap-2 pl-6">
                        <button
                          type="button"
                          onClick={preferLocalDraft}
                          className="admin-focus h-9 rounded-admin border border-tone-warn-bd bg-admin-surface px-3 font-bold text-admin-text hover:bg-admin-surface-2"
                        >
                          Use this device&rsquo;s version
                        </button>
                        <button
                          type="button"
                          onClick={dismissDraftConflict}
                          className="admin-focus h-9 rounded-admin px-3 font-bold hover:bg-tone-warn-bd"
                        >
                          Keep my account&rsquo;s version
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div id="onboarding-step-pane">
                  {locked ? <LockedStep reason={locked} onGo={() => goToStep(firstOpen(stepDone))} /> : <StepBody />}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-admin-border bg-admin-surface px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-admin-2xs text-admin-subtle">
          <span>© {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd.</span>
          <span className="flex items-center gap-3">
            <Link href="/terms" className="font-semibold hover:text-admin-text">
              Terms
            </Link>
            <Link href="/privacy" className="font-semibold hover:text-admin-text">
              Privacy
            </Link>
            <a href="tel:09579005645" className="font-semibold hover:text-admin-text">
              095790 05645
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

/**
 * The first step that still needs work — where "go fix it" sends you.
 *
 * Capped at the last input step: step 8 is never "done" until an application is
 * approved, so an uncapped search would send a partner who has filled in
 * everything to the one screen they cannot open.
 */
function firstOpen(stepDone: Record<PartnerStepId, boolean>): PartnerStepId {
  for (let id = 1; id <= LAST_INPUT_STEP; id++) {
    if (!stepDone[id as PartnerStepId]) return id as PartnerStepId
  }
  return LAST_INPUT_STEP
}

function TopBar({
  showSteps,
  onOpenSteps,
  step,
  stepDone,
}: {
  showSteps: boolean
  onOpenSteps: () => void
  step: PartnerStepId
  stepDone: Record<PartnerStepId, boolean>
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-admin-border bg-admin-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="admin-focus group flex min-w-0 items-center gap-2.5 no-underline">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-admin border border-brand-strong/20 bg-brand shadow-admin-1">
            <Image src="/img/logo.webp" alt="Techstar Money Solution" width={36} height={36} className="object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-admin-sm font-extrabold tracking-tight text-admin-text">
              Techstar Money Solution
            </span>
            <span className="block truncate text-admin-2xs font-bold uppercase tracking-widest text-admin-subtle">
              Partner onboarding
            </span>
          </span>
        </Link>

        <a
          href="tel:09579005645"
          aria-label="Call partner support on 095790 05645"
          className="admin-focus flex h-10 w-10 shrink-0 items-center justify-center rounded-admin border border-admin-border bg-admin-surface-2 text-brand hover:bg-admin-surface-3"
        >
          <Headphones size={17} />
        </a>
      </div>
      {showSteps && <MobileStepBar current={step} stepDone={stepDone} onOpen={onOpenSteps} />}
    </header>
  )
}

/** The verified-number strip that sits above every step. */
function VerifiedStrip({
  mobileNumber,
  resuming,
  locked,
  onDiscard,
  onChange,
}: {
  mobileNumber: string
  resuming: boolean
  locked: boolean
  onDiscard: () => void
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-admin border border-tone-success-bd bg-tone-success px-3.5 py-2.5 text-admin-xs text-tone-success-fg">
      <div className="flex min-w-0 items-center gap-2">
        <CheckCircle2 size={16} className="shrink-0" />
        <span className="min-w-0">
          <span>Verified </span>
          <strong className="admin-num whitespace-nowrap font-bold">+91 {mobileNumber}</strong>
          {resuming && (
            <span className="flex items-center gap-1 text-admin-2xs font-semibold opacity-80">
              <Loader2 size={11} className="animate-spin" /> Restoring your saved progress…
            </span>
          )}
        </span>
      </div>
      {!locked && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            title="Remove the copy of this application saved in this browser"
            className="admin-focus text-admin-2xs font-semibold opacity-80 hover:opacity-100"
          >
            Discard local copy
          </button>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <button type="button" onClick={onChange} className="admin-focus text-admin-2xs font-bold hover:underline">
            Change number
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * A step reached by deep link, a stale tab, or the browser's Back button whose
 * prerequisites are not met. It says what is missing rather than rendering an
 * empty shell the partner cannot submit.
 */
function LockedStep({ reason, onGo }: { reason: string; onGo: () => void }) {
  return (
    <div className="space-y-3 rounded-admin-lg border border-admin-border bg-admin-surface-2 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-admin-surface-3 text-admin-muted">
        <Lock size={20} />
      </div>
      <div className="space-y-1">
        <h2 className="text-admin-lg font-bold text-admin-text">This step is not open yet</h2>
        <p className="mx-auto max-w-md text-admin-sm text-admin-muted">{reason}</p>
      </div>
      <button
        type="button"
        onClick={onGo}
        className="admin-focus inline-flex h-11 items-center gap-1.5 rounded-admin bg-brand px-4 text-admin-sm font-bold text-brand-fg hover:bg-brand-hover"
      >
        <ArrowLeft size={15} /> Go to the step that needs finishing
      </button>
    </div>
  )
}
