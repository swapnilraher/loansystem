"use client"

/**
 * The gate in front of the wizard: prove the WhatsApp number is yours.
 *
 * Everything downstream is keyed by this number — the draft, the documents, the
 * partner record — so it is verified before a single field is collected rather
 * than at the end, where a wrong digit would mean re-keying the whole form.
 */

import React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react"

import { FormErrorRegion } from "@/components/onboarding/FormErrorRegion"
import { cn } from "@/lib/utils"

import { MAX_OTP_ATTEMPTS, useOnboarding, type EligibilityBlock } from "./OnboardingContext"
import { PrefixedInput } from "./ui"

export function MobileGate() {
  const {
    mobileNumber,
    setMobileNumber,
    otpSent,
    otpValues,
    setOtpDigit,
    pasteOtp,
    otpTimer,
    canResend,
    otpLockedOut,
    sendingOtp,
    resendingOtp,
    verifyingOtp,
    sendOtp,
    resendOtp,
    verifyOtp,
    mobileError,
    mobileErrorKind,
    eligibility,
    clearEligibility,
    resetMobile,
  } = useOnboarding()

  const valid = /^[6-9]\d{9}$/.test(mobileNumber)

  if (eligibility) {
    return (
      <OutcomeScreen
        block={eligibility}
        onUseAnotherNumber={() => {
          clearEligibility()
          resetMobile()
        }}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 py-4 sm:py-8">
      <div className="space-y-1.5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-tone-success-bd bg-tone-success px-2.5 py-1 text-admin-2xs font-bold uppercase tracking-wider text-tone-success-fg">
          <ShieldCheck size={12} /> Secure onboarding
        </span>
        <h1 className="text-admin-2xl font-black tracking-tight text-admin-text">Become a Techstar Money partner</h1>
        <p className="text-admin-sm text-admin-muted">
          Eight short steps, about ten minutes. Start by confirming the WhatsApp number your partner account will live on.
        </p>
      </div>

      <FormErrorRegion message={mobileError} kind={mobileErrorKind} id="onboard-mobile-error" />

      <div className="space-y-5 rounded-admin-lg border border-admin-border bg-admin-surface p-5 shadow-admin-2 sm:p-6">
        <div className="space-y-1.5">
          <label htmlFor="onboard-mobile" className="block text-admin-2xs font-bold uppercase tracking-wide text-admin-subtle">
            Mobile number (WhatsApp enabled) <span className="text-tone-danger-fg">*</span>
          </label>
          <PrefixedInput
            prefix="+91"
            id="onboard-mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            disabled={otpSent}
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value)}
            invalid={Boolean(mobileError)}
            aria-describedby="onboard-mobile-error"
            autoComplete="tel-national"
          />
        </div>

        {!otpSent ? (
          <button
            type="button"
            disabled={sendingOtp || !valid}
            onClick={() => void sendOtp()}
            className="admin-focus flex h-12 w-full items-center justify-center gap-2 rounded-admin bg-brand text-admin-sm font-bold text-brand-fg shadow-admin-2 transition-all hover:bg-brand-hover disabled:opacity-50 disabled:shadow-none active:scale-[0.99]"
          >
            {sendingOtp ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sending code…
              </>
            ) : (
              <>
                Get WhatsApp verification code <ArrowRight size={16} />
              </>
            )}
          </button>
        ) : (
          <div className="animate-fadeIn space-y-4 border-t border-admin-border pt-4">
            <div className="flex items-center justify-between gap-2 text-admin-xs">
              <span className="text-admin-muted">
                Code sent on WhatsApp to <strong className="admin-num text-admin-text">+91 {mobileNumber}</strong>
              </span>
              <button
                type="button"
                onClick={resetMobile}
                className="admin-focus shrink-0 font-bold text-brand hover:underline"
              >
                Change
              </button>
            </div>

            <div className="flex justify-between gap-1.5 sm:gap-2">
              {otpValues.map((digit, i) => (
                <input
                  key={i}
                  id={`onboard-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                  value={digit}
                  disabled={verifyingOtp || otpLockedOut}
                  aria-label={`Digit ${i + 1} of 6`}
                  aria-describedby="onboard-mobile-error"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  onChange={e => {
                    setOtpDigit(i, e.target.value)
                    if (e.target.value && i < 5) document.getElementById(`onboard-otp-${i + 1}`)?.focus()
                  }}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !otpValues[i] && i > 0) {
                      document.getElementById(`onboard-otp-${i - 1}`)?.focus()
                    }
                  }}
                  onPaste={e => {
                    const text = e.clipboardData.getData("text")
                    if (!/\d/.test(text)) return
                    e.preventDefault()
                    pasteOtp(text)
                    document.getElementById(`onboard-otp-5`)?.focus()
                  }}
                  className="admin-focus h-13 w-full rounded-admin border border-admin-border-strong bg-admin-surface-2 text-center text-admin-xl font-black text-admin-text transition-all focus:border-brand focus:bg-admin-surface disabled:opacity-50"
                />
              ))}
            </div>

            {otpLockedOut && (
              <div role="alert" className="space-y-1.5 rounded-admin border border-tone-warn-bd bg-tone-warn p-3.5 text-admin-xs text-tone-warn-fg">
                <div className="font-bold">That is {MAX_OTP_ATTEMPTS} incorrect attempts on this code.</div>
                <p className="leading-relaxed">
                  For your security this code is now closed. Request a new one below, or call our partner desk on
                  095790 05645 if the code is not arriving on WhatsApp.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 text-admin-xs text-admin-muted">
              <span>
                {canResend ? (
                  "Didn't receive the code?"
                ) : (
                  // Saying only "disabled" invites repeated tapping.
                  <>
                    Resend available in <span className="admin-num font-bold text-admin-text">{otpTimer}s</span>
                  </>
                )}
              </span>
              <button
                type="button"
                disabled={!canResend || resendingOtp}
                onClick={() => void resendOtp()}
                title={canResend ? undefined : `You can ask for a new code in ${otpTimer} seconds`}
                className="admin-focus font-bold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resendingOtp ? "Sending…" : "Resend on WhatsApp"}
              </button>
            </div>

            <button
              type="button"
              disabled={verifyingOtp || otpLockedOut || otpValues.join("").length < 6}
              onClick={() => void verifyOtp()}
              className="admin-focus flex h-12 w-full items-center justify-center gap-2 rounded-admin bg-brand text-admin-sm font-bold text-brand-fg shadow-admin-2 transition-all hover:bg-brand-hover disabled:opacity-50 active:scale-[0.99]"
            >
              {verifyingOtp ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Verify and start <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-admin-2xs leading-relaxed text-admin-subtle">
        Your details are used only to assess and open your DSA partner account. Read our{" "}
        <Link href="/privacy" className="font-semibold text-brand hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  )
}

/**
 * A number that cannot start a new application.
 *
 * A full screen rather than a banner: an approved partner, a submitted
 * application and a blocked number are three different situations with three
 * different next actions, and a banner above a form the partner could still
 * type into reads as a warning about the form rather than an answer about their
 * account. The escape hatch is explicit, because someone who mistyped a digit
 * needs a way back that is not the browser's Back button.
 */
function OutcomeScreen({ block, onUseAnotherNumber }: { block: EligibilityBlock; onUseAnotherNumber: () => void }) {
  const look = {
    ALREADY_APPROVED: {
      Icon: CheckCircle2,
      tone: "border-tone-success-bd bg-tone-success text-tone-success-fg",
      heading: "You are already a Techstar Money partner",
    },
    ALREADY_SUBMITTED: {
      Icon: Clock,
      tone: "border-tone-info-bd bg-tone-info text-tone-info-fg",
      heading: "Your application is already with us",
    },
    BLOCKED: {
      Icon: AlertTriangle,
      tone: "border-tone-danger-bd bg-tone-danger text-tone-danger-fg",
      heading: "This number cannot be onboarded",
    },
  }[block.reason]

  const href = block.redirectUrl

  return (
    <div className="mx-auto w-full max-w-lg animate-fadeIn space-y-4 rounded-admin-lg border border-admin-border bg-admin-surface p-6 text-center shadow-admin-2 sm:p-8">
      <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full border", look.tone)}>
        <look.Icon size={26} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-admin-xl font-black tracking-tight text-admin-text">{look.heading}</h2>
        <p className="mx-auto max-w-md text-admin-sm font-semibold text-admin-text">{block.marathiMessage}</p>
        <p className="mx-auto max-w-md text-admin-sm leading-relaxed text-admin-muted">{block.message}</p>
      </div>

      <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row sm:justify-center">
        {href &&
          (href.startsWith("tel:") ? (
            <a
              href={href}
              className="admin-focus inline-flex h-11 items-center justify-center rounded-admin bg-brand px-4 text-admin-sm font-bold text-brand-fg hover:bg-brand-hover"
            >
              {block.actionText || "Call partner support"}
            </a>
          ) : (
            <Link
              href={href}
              className="admin-focus inline-flex h-11 items-center justify-center rounded-admin bg-brand px-4 text-admin-sm font-bold text-brand-fg hover:bg-brand-hover"
            >
              {block.actionText || "Continue"}
            </Link>
          ))}
        <button
          type="button"
          onClick={onUseAnotherNumber}
          className="admin-focus inline-flex h-11 items-center justify-center rounded-admin px-4 text-admin-sm font-bold text-admin-muted hover:bg-admin-surface-2 hover:text-admin-text"
        >
          Use a different number
        </button>
      </div>
    </div>
  )
}
