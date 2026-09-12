"use client"

/**
 * Cashfree-inspired DSA Partner Onboarding Shell.
 *
 * Implements the streamlined 3-step partner onboarding wizard with:
 * 1. Top bar featuring Back navigation, 3-step horizontal stepper, and Help action.
 * 2. Festive/anniversary promotional banner.
 * 3. Focused, centered clean card container matching Cashfree's merchant onboarding UI.
 */

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  Clock,
  HelpCircle,
  Headphones,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  X,
} from "lucide-react"

import { FormErrorRegion } from "@/components/onboarding/FormErrorRegion"
import { LAST_INPUT_STEP, type PartnerStepId } from "@/lib/onboarding-steps"
import { cn } from "@/lib/utils"

import { useOnboarding } from "./OnboardingContext"
import { MobileGate } from "./MobileGate"
import { formatWhen } from "./net"
import { Step1PersonalBusiness } from "./steps/Step1PersonalBusiness"
import { Step2KycDocuments } from "./steps/Step2KycDocuments"
import { Step3ReviewSubmit } from "./steps/Step3ReviewSubmit"

const STEP_COMPONENTS: Record<PartnerStepId, () => React.JSX.Element> = {
  1: Step1PersonalBusiness,
  2: Step2KycDocuments,
  3: Step3ReviewSubmit,
}

export function OnboardingShell() {
  const {
    isMobileVerified,
    mobileNumber,
    form,
    step,
    goToStep,
    back,
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

  const [helpOpen, setHelpOpen] = useState(false)

  const locked = isMobileVerified ? lockReason(step) : null
  const StepBody = STEP_COMPONENTS[step] || Step1PersonalBusiness
  const canGoBack = isMobileVerified && !isSubmitted && step > 1

  return (
    <div className="min-h-dvh flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* ── Cashfree-style Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-3 sm:px-6">
          {/* Back button */}
          <button
            type="button"
            onClick={back}
            disabled={!canGoBack}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all",
              canGoBack
                ? "text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer"
                : "text-transparent pointer-events-none opacity-0"
            )}
            aria-label="Previous step"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>

          {/* Stepper with 3 circles & connecting lines (matching Cashfree) */}
          {isMobileVerified && !isSubmitted ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {[1, 2, 3].map((sId, idx) => {
                const id = sId as PartnerStepId
                const isDone = stepDone[id]
                const isActive = step === id
                const isPast = step > id || isDone

                return (
                  <React.Fragment key={sId}>
                    {idx > 0 && (
                      <div
                        className={cn(
                          "h-1 w-6 sm:w-12 rounded-full transition-all duration-300",
                          isPast ? "bg-[#16a34a]" : "bg-slate-200"
                        )}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => isDone && goToStep(id)}
                      disabled={!isDone && !isActive}
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-200",
                        isDone
                          ? "bg-[#16a34a] text-white shadow-xs hover:brightness-105 cursor-pointer"
                          : isActive
                            ? "bg-[#0f4bb4] text-white shadow-md ring-4 ring-blue-100"
                            : "bg-[#e2e8f0] text-slate-500 cursor-not-allowed"
                      )}
                      aria-label={`Step ${id}`}
                    >
                      {isDone ? <Check size={14} className="stroke-[3]" /> : id}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f4bb4] text-white font-black text-xs shadow-xs">
                TSM
              </span>
              <span className="font-bold text-slate-800 text-sm tracking-tight hidden xs:inline">
                Techstar Partner
              </span>
            </Link>
          )}

          {/* Help Button (?) */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-[#0f4bb4] transition-colors"
            aria-label="Help and support"
          >
            <HelpCircle size={20} className="stroke-[2]" />
          </button>
        </div>

        {/* ── DSA Partner Exclusive Ribbon ── */}
        <div className="bg-gradient-to-r from-[#6d28d9] via-[#4338ca] to-[#059669] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-3 text-center tracking-wide flex items-center justify-center gap-2">
          <span>DSA Partner Special Offer! Onboarding @ ₹0 Registration Fee* · Up to 2.5% Payout on Loan Disbursals · 50+ Banks &amp; NBFCs</span>
        </div>
      </header>

      {/* ── Help Modal ── */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f4bb4] flex items-center justify-center">
                  <Headphones size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Partner Helpdesk</h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Have questions regarding DSA registration, verification or commissions? Our dedicated onboarding team is here to assist.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="tel:09579005645"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-[#0f4bb4] group-hover:text-white transition-colors">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Direct Phone Call</div>
                  <div className="text-sm font-bold text-slate-800">095790 05645</div>
                </div>
              </a>

              <a
                href="https://wa.me/919579005645?text=Hello%20Techstar%20Team%2C%20I%20need%20assistance%20with%20DSA%20Partner%20Onboarding."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-[#16a34a] group-hover:text-white transition-colors">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Instant WhatsApp Support</div>
                  <div className="text-sm font-bold text-emerald-700">+91 95790 05645</div>
                </div>
              </a>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-100">
              Support Hours: Mon – Sat (10:00 AM – 7:00 PM IST)
            </div>
          </div>
        </div>
      )}

      {/* ── Main Focused Content ── */}
      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">
          {!isMobileVerified ? (
            <MobileGate />
          ) : (
            <div className="space-y-4">
              {/* Verified number badge */}
              <VerifiedStrip
                mobileNumber={mobileNumber}
                resuming={resuming}
                locked={isSubmitted}
                onDiscard={discardLocalDraft}
                onChange={resetMobile}
              />

              <FormErrorRegion message={stepError} kind={stepErrorKind} id="onboarding-step-error" />

              {restoredNote && !draftConflict && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2.5 text-xs font-semibold text-blue-900">
                  <Clock size={14} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>{restoredNote}</span>
                </div>
              )}

              {draftConflict && (
                <div className="space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="space-y-1">
                      <div className="font-bold text-sm">Two versions of this application</div>
                      <p className="leading-relaxed">
                        Your account has you on step {draftConflict.serverStep}; this device was left on step{" "}
                        {draftConflict.localStep}, {formatWhen(draftConflict.localSavedAt)}. We opened{" "}
                        {draftConflict.applied === "server" ? "the one from your account" : "the one from this device"}.
                      </p>
                    </div>
                  </div>
                  {draftConflict.applied === "server" && (
                    <div className="flex flex-wrap gap-2 pl-6 pt-1">
                      <button
                        type="button"
                        onClick={preferLocalDraft}
                        className="h-8 rounded-lg border border-amber-300 bg-white px-3 font-bold text-amber-950 hover:bg-amber-100 transition-colors"
                      >
                        Use this device&rsquo;s version
                      </button>
                      <button
                        type="button"
                        onClick={dismissDraftConflict}
                        className="h-8 rounded-lg px-3 font-semibold text-amber-800 hover:bg-amber-100/60 transition-colors"
                      >
                        Keep account&rsquo;s version
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div id="onboarding-step-pane">
                {locked ? (
                  <LockedStep reason={locked} onGo={() => goToStep(firstOpen(stepDone))} />
                ) : (
                  <StepBody />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 mt-auto">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd.</span>
          <span className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-800 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">
              Privacy Policy
            </Link>
            <a href="tel:09579005645" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">
              095790 05645
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

function firstOpen(stepDone: Record<PartnerStepId, boolean>): PartnerStepId {
  for (let id = 1; id <= LAST_INPUT_STEP; id++) {
    if (!stepDone[id as PartnerStepId]) return id as PartnerStepId
  }
  return LAST_INPUT_STEP
}

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
    <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs text-emerald-900">
      <div className="flex min-w-0 items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Check size={12} className="stroke-[3]" />
        </div>
        <span className="min-w-0 font-medium">
          <span>Verified </span>
          <strong className="font-bold tracking-wide">+91 {mobileNumber}</strong>
          {resuming && (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-700 ml-2">
              <Loader2 size={11} className="animate-spin" /> Restoring saved draft…
            </span>
          )}
        </span>
      </div>
      {!locked && (
        <div className="flex shrink-0 items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={onDiscard}
            title="Remove local browser copy"
            className="text-slate-500 hover:text-slate-800"
          >
            Clear local
          </button>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <button
            type="button"
            onClick={onChange}
            className="font-bold text-emerald-800 hover:underline"
          >
            Change
          </button>
        </div>
      )}
    </div>
  )
}

function LockedStep({ reason, onGo }: { reason: string; onGo: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Lock size={22} />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-800">This step is not open yet</h2>
        <p className="mx-auto max-w-md text-xs text-slate-500">{reason}</p>
      </div>
      <button
        type="button"
        onClick={onGo}
        className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white hover:bg-black transition-all"
      >
        <ArrowLeft size={15} /> Go to the step that needs finishing
      </button>
    </div>
  )
}
