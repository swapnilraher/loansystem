"use client"

/**
 * Techstar DSA Partner Portal - Onboarding Shell.
 *
 * Implements the unified partner onboarding layout:
 * 1. Compact header with Back navigation, 3-step progress stepper, and Help action.
 * 2. Branded purple -> teal gradient promotional ribbon.
 * 3. Focused, centered card container matching fintech partner platforms.
 * 4. Responsive mobile & desktop layout with safe-area spacing.
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
  RefreshCw,
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

const STEP_TITLES: Record<PartnerStepId, string> = {
  1: "Business Details",
  2: "KYC & Bank Setup",
  3: "Review & Submit",
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
      {/* ── Top Header ── */}
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

          {/* Stepper with 3 connected circles */}
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
                          isPast ? "bg-emerald-600" : "bg-slate-200"
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
                          ? "bg-emerald-600 text-white shadow-xs hover:brightness-105 cursor-pointer"
                          : isActive
                            ? "bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      )}
                      aria-label={`Step ${id}: ${STEP_TITLES[id]}`}
                      title={STEP_TITLES[id]}
                    >
                      {isDone ? <Check size={14} className="stroke-[3]" /> : id}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 no-underline">
              <Image
                src="/img/logo.webp"
                alt="Techstar Money Solution logo"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold text-slate-800 text-sm tracking-tight hidden xs:inline">
                Techstar Partner
              </span>
            </Link>
          )}

          {/* Help Button (?) */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
            aria-label="Help and support"
          >
            <HelpCircle size={20} className="stroke-[2]" />
          </button>
        </div>

        {/* ── DSA Partner Exclusive Promotional Ribbon ── */}
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
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Headphones size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Partner Helpdesk</h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="Close help"
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
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Direct Phone Call</div>
                  <div className="text-sm font-bold text-slate-900">095790 05645</div>
                </div>
              </a>

              <a
                href="https://wa.me/919579005645?text=Hello%20Techstar%20Team%2C%20I%20need%20assistance%20with%20DSA%20Partner%20Onboarding."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
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
      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-16">
        <div className="mx-auto w-full max-w-xl">
          {!isMobileVerified ? (
            <MobileGate />
          ) : (
            <div className="space-y-5">
              <FormErrorRegion message={stepError} kind={stepErrorKind} id="onboarding-step-error" />

              {/* Resume Onboarding Banner (Item 31) */}
              {restoredNote && !draftConflict && (
                <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs text-blue-900 shadow-sm animate-fadeIn">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <RefreshCw size={16} className="text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-blue-950">Resume your application</div>
                    <p className="text-xs text-blue-800 leading-relaxed">{restoredNote}</p>
                  </div>
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
                        className="h-8 rounded-lg border border-amber-300 bg-white px-3 font-bold text-amber-950 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        Use this device&rsquo;s version
                      </button>
                      <button
                        type="button"
                        onClick={dismissDraftConflict}
                        className="h-8 rounded-lg px-3 font-semibold text-amber-800 hover:bg-amber-100/60 transition-colors cursor-pointer"
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
              Terms &amp; Conditions
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
        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#18181b] px-5 text-sm font-semibold text-white hover:bg-black transition-all cursor-pointer"
      >
        <ArrowLeft size={15} /> Go to the step that needs finishing
      </button>
    </div>
  )
}
