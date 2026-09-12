"use client"

/**
 * Cashfree-inspired Account Creation & Mobile Verification Gate.
 *
 * Implements the exact UI from user reference images:
 * - "Create your Account." heading with clean typography
 * - Flag & Country code selector: 🇮🇳 IND (+91) ⌵ with phone input
 * - Checkbox: "Receive account updates via WhatsApp"
 * - Full-width black button: "Create Account"
 * - Terms & "Facing issues? Need help?" links
 * - Festive offer banner card at the bottom
 * - "Authenticate" modal/sheet with 6-digit OTP input, resend countdown & "OTP Sent Successfully!" toast.
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react"

import { FormErrorRegion } from "@/components/onboarding/FormErrorRegion"
import { cn } from "@/lib/utils"

import { MAX_OTP_ATTEMPTS, useOnboarding, type EligibilityBlock } from "./OnboardingContext"

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

  const [whatsappUpdates, setWhatsappUpdates] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const valid = /^[6-9]\d{9}$/.test(mobileNumber)

  // Trigger green success toast when OTP is sent
  useEffect(() => {
    if (otpSent) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [otpSent])

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

  // Format phone display with masking for modal: +91xxxxxx1234
  const maskedPhone =
    mobileNumber.length === 10
      ? `+91xxxxxx${mobileNumber.slice(-4)}`
      : `+91 ${mobileNumber}`

  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-6 space-y-6 animate-fadeIn">
      {/* ── Brand Title ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Create your Account.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Sign up as a verified Techstar DSA Partner in 3 simple steps.
        </p>
      </div>

      <FormErrorRegion message={mobileError} kind={mobileErrorKind} id="onboard-mobile-error" />

      {/* ── Main Form Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-5">
        {/* Mobile Number Input */}
        <div className="space-y-2">
          <label htmlFor="onboard-mobile" className="block text-xs font-semibold text-slate-700">
            Mobile Number
          </label>
          <div
            className={cn(
              "flex h-12 rounded-xl border bg-white overflow-hidden transition-all",
              "focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10",
              mobileError ? "border-rose-400" : "border-slate-200"
            )}
          >
            {/* Country Selector: IND (+91) ⌵ */}
            <div className="flex items-center gap-1 px-3 bg-slate-50/80 border-r border-slate-200 text-xs font-semibold text-slate-800 select-none shrink-0">
              <span className="text-base" role="img" aria-label="India flag">🇮🇳</span>
              <span>IND (+91)</span>
              <svg className="w-3 h-3 text-slate-500 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <input
              id="onboard-mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9579005645"
              disabled={sendingOtp}
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value)}
              aria-describedby="onboard-mobile-error"
              autoComplete="tel-national"
              className="w-full px-3.5 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Checkbox: Receive account updates via WhatsApp */}
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
          <input
            type="checkbox"
            checked={whatsappUpdates}
            onChange={e => setWhatsappUpdates(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="flex items-center gap-1.5 font-medium">
            Receive account updates via WhatsApp
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px]">
              💬
            </span>
          </span>
        </label>

        {/* Black Action Button: Create Account */}
        <button
          type="button"
          disabled={sendingOtp || !valid}
          onClick={() => void sendOtp()}
          className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {sendingOtp ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Sending OTP…</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>

        {/* Terms */}
        <p className="text-center text-[11px] text-slate-500 leading-relaxed">
          By signing up, you accept the Techstar{" "}
          <Link href="/terms" className="text-slate-800 font-semibold underline underline-offset-2 hover:text-indigo-600">
            Terms &amp; Conditions
          </Link>
        </p>

        {/* Facing issues */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5">
          <span className="text-xs text-slate-500">Facing issues?</span>
          <button
            type="button"
            onClick={() => setHelpModalOpen(true)}
            className="text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-3.5 py-1.5 hover:bg-slate-50 transition-colors"
          >
            Need help?
          </button>
        </div>
      </div>

      {/* ── Festive Offer Promotional Banner Card (Matching User Reference) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-[#064e3b] to-slate-900 p-5 text-white shadow-md border border-emerald-800/40">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
              Festive Offer
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ZERO <span className="text-emerald-400 text-lg font-bold">Platform Fees*</span>
            </div>
            <p className="text-xs text-emerald-100/80 max-w-[220px]">
              Up to 1.5% commission on disbursed loans with 50+ banking partners.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-full border border-emerald-400/30 bg-emerald-900/50 shadow-inner">
            <span className="text-2xl font-black text-amber-300">0%</span>
            <span className="text-[9px] uppercase font-bold text-emerald-200">Setup Cost</span>
          </div>
        </div>
      </div>

      {/* ── Authenticate Modal / Bottom Sheet (Matching Screenshot 4) ── */}
      {otpSent && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          {/* Toast Notification: OTP Sent Successfully! */}
          {showToast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 flex items-center justify-between gap-3 bg-[#16a34a] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold animate-slideDown">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} /> OTP Sent Successfully!
              </span>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Authenticate</h2>
              <button
                type="button"
                onClick={resetMobile}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the 6-digit OTP sent to your phone number{" "}
                <strong className="text-slate-900 font-bold">{maskedPhone}</strong>
              </p>
            </div>

            {/* 6-box Pin Input */}
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
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  onChange={e => {
                    setOtpDigit(i, e.target.value)
                    if (e.target.value && i < 5) {
                      document.getElementById(`onboard-otp-${i + 1}`)?.focus()
                    }
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
                  className="w-11 sm:w-13 h-12 sm:h-14 rounded-xl border border-slate-300 bg-slate-50/50 text-center text-lg sm:text-xl font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {otpLockedOut && (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="font-bold">Maximum attempts exceeded.</div>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  Please wait or request a new OTP code below.
                </p>
              </div>
            )}

            {/* Resend OTP & Need help footer line */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">
                {canResend ? (
                  <button
                    type="button"
                    disabled={resendingOtp}
                    onClick={() => void resendOtp()}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    {resendingOtp ? "Sending…" : "Resend OTP"}
                  </button>
                ) : (
                  <span>
                    Resend OTP ({String(Math.floor(otpTimer / 60)).padStart(2, "0")}:
                    {String(otpTimer % 60).padStart(2, "0")})
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="font-semibold text-slate-700 hover:text-slate-900 hover:underline"
              >
                Need help?
              </button>
            </div>

            {/* Verify CTA Button */}
            <button
              type="button"
              disabled={verifyingOtp || otpLockedOut || otpValues.join("").length < 6}
              onClick={() => void verifyOtp()}
              className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {verifyingOtp ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying OTP…
                </>
              ) : (
                <span>Confirm &amp; Proceed</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Helpdesk Quick Dialog ── */}
      {helpModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Facing issues with OTP?</h3>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Ensure your mobile number is active on WhatsApp. For direct assistance, call or WhatsApp our support desk.
            </p>
            <div className="space-y-2">
              <a
                href="tel:09579005645"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800"
              >
                <Phone size={16} className="text-indigo-600" />
                <span>Call Partner Support: 095790 05645</span>
              </a>
              <a
                href="https://wa.me/919579005645"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs font-semibold text-emerald-800"
              >
                <span>💬 Chat with Support on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OutcomeScreen({ block, onUseAnotherNumber }: { block: EligibilityBlock; onUseAnotherNumber: () => void }) {
  const look = {
    ALREADY_APPROVED: {
      Icon: CheckCircle2,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      heading: "You are already a Techstar Money partner",
    },
    ALREADY_SUBMITTED: {
      Icon: Clock,
      tone: "border-blue-200 bg-blue-50 text-blue-700",
      heading: "Your application is already with us",
    },
    BLOCKED: {
      Icon: AlertTriangle,
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      heading: "This number cannot be onboarded",
    },
  }[block.reason]

  const href = block.redirectUrl

  return (
    <div className="mx-auto w-full max-w-md animate-fadeIn space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full border", look.tone)}>
        <look.Icon size={26} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{look.heading}</h2>
        <p className="mx-auto max-w-md text-xs font-semibold text-slate-800">{block.marathiMessage}</p>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">{block.message}</p>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center">
        {href &&
          (href.startsWith("tel:") ? (
            <a
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#18181b] px-5 text-xs font-bold text-white hover:bg-black transition-all"
            >
              {block.actionText || "Call partner support"}
            </a>
          ) : (
            <Link
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#18181b] px-5 text-xs font-bold text-white hover:bg-black transition-all"
            >
              {block.actionText || "Continue"}
            </Link>
          ))}
        <button
          type="button"
          onClick={onUseAnotherNumber}
          className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          Use a different number
        </button>
      </div>
    </div>
  )
}
