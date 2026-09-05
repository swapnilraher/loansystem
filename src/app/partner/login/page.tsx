"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { signInWithCustomToken } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Mail, Lock, ArrowRight, Smartphone, Eye, EyeOff,
  ShieldCheck, AlertCircle, Building2, Users, Zap, Activity, CheckCircle2,
} from "lucide-react"
import { PartnerPortalHeader, PartnerPortalFooter } from "@/components/layout/PartnerPortalShell"
import { AdminButton } from "@/components/admin/ui/Button"
import { cn } from "@/lib/utils"

function messageFor(err: unknown, fallback: string): string {
  return (err as { message?: string })?.message || fallback
}

type AuthMethod = "otp" | "email"

// ── Partner Network Illustration (SVG) ───────────────────────────────────
function NetworkSVG() {
  const cx = 160, cy = 100
  const nodes = [
    { x: 60, y: 28, l: "Banks", s: "B" },
    { x: 260, y: 28, l: "NBFCs", s: "N" },
    { x: 18, y: 108, l: "DSAs", s: "D" },
    { x: 302, y: 108, l: "Lenders", s: "L" },
    { x: 160, y: 182, l: "Clients", s: "C" },
  ]
  return (
    <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full max-w-[320px]">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--brand-bright)" }} />
          <stop offset="100%" style={{ stopColor: "var(--brand-strong)" }} />
        </linearGradient>
        <filter id="ns">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodOpacity="0.1" style={{ floodColor: "var(--brand)" }} />
        </filter>
        <filter id="cs">
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodOpacity="0.22" style={{ floodColor: "var(--brand)" }} />
        </filter>
      </defs>
      {nodes.map(n => (
        <line key={n.s} x1={cx} y1={cy} x2={n.x} y2={n.y} className="stroke-brand-line" strokeWidth="1.2" strokeDasharray="4 3" />
      ))}
      {nodes.map(n => (
        <g key={n.s}>
          <circle cx={n.x} cy={n.y} r={22} className="fill-brand-node stroke-brand-ring" strokeWidth="1.2" filter="url(#ns)" />
          <text x={n.x} y={n.y - 3} textAnchor="middle" fontSize="8" fontWeight="700" className="fill-brand" fontFamily="Inter,sans-serif">{n.s}</text>
          <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize="6.5" className="fill-brand-muted" fontFamily="Inter,sans-serif">{n.l}</text>
        </g>
      ))}
      <rect x={cx - 42} y={cy - 24} width="84" height="48" rx="10" fill="url(#cg)" filter="url(#cs)" />
      <text x={cx} y={cy - 9} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="rgba(255,255,255,0.7)" fontFamily="Inter,sans-serif" letterSpacing="0.08em">TECHSTAR</text>
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="8" fontWeight="700" fill="white" fontFamily="Inter,sans-serif">MONEY</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.6)" fontFamily="Inter,sans-serif">Partner Network</text>
      <circle cx={cx} cy={cy} r={35} className="stroke-brand" strokeWidth="0.8" strokeOpacity="0.1" fill="none" />
      <circle cx={cx} cy={cy} r={48} className="stroke-brand" strokeWidth="0.6" strokeOpacity="0.06" fill="none" />
    </svg>
  )
}

export default function PartnerLogin() {
  const { loginWithEmailAndPassword, signInWithGooglePopup } = useAuth()
  const router = useRouter()

  const [authMethod, setAuthMethod] = useState<AuthMethod>("otp")
  const [mobileNumber, setMobileNumber] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [otpTimer, setOtpTimer] = useState(50)
  const [canResend, setCanResend] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isMobileVerified, setIsMobileVerified] = useState(false)

  // Guards the automatic verification so a single OTP is submitted once.
  const autoVerifiedRef = useRef("")

  const [eligibilityError, setEligibilityError] = useState<{
    message: string
    marathiMessage?: string
    redirectUrl?: string
    actionText?: string
  } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const fromQuery = new URLSearchParams(window.location.search).get("mobile")
    const clean = (fromQuery || "").replace(/\D/g, "").slice(-10)
    if (clean.length === 10) setMobileNumber(clean)
  }, [])

  const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber)
  const mobileInvalid = mobileNumber.length > 0 && !isMobileValid

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [otpSent, otpTimer])

  const handleSendMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isMobileValid) { setError("Enter a valid 10-digit mobile number."); return }
    setOtpLoading(true)
    setError("")
    setEligibilityError(null)
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, isLogin: true }),
      })
      const data = await res.json()
      if (!res.ok || data.eligible === false) {
        if (data.reason === "NOT_REGISTERED") {
          setEligibilityError({
            message: data.message || "This mobile number is not registered as a partner.",
            marathiMessage: data.marathiMessage || "हा मोबाईल नंबर पार्टनर पोर्टलवर नोंदणीकृत नाही. कृपया प्रथम नवीन पार्टनर म्हणून नोंदणी करा.",
            redirectUrl: data.redirectUrl || `/onboarding?mobile=${mobileNumber}`,
            actionText: "Register as Partner (नवीन नोंदणी करा) →",
          })
          return
        }
        if (data.reason === "NOT_APPROVED") {
          setEligibilityError({
            message: data.message || "Your account is not approved for login yet.",
            marathiMessage: data.marathiMessage || "तुमचे पार्टनर खाते अद्याप लॉगिनसाठी मंजूर झालेले नाही.",
            redirectUrl: "/application-status",
            actionText: "Track Application Status →",
          })
          return
        }
        if (data.reason === "BLOCKED") {
          setEligibilityError({
            message: data.message || "This account has been suspended.",
            marathiMessage: data.marathiMessage || "हा पार्टनर नंबर ब्लॉक किंवा नामंजूर करण्यात आला आहे. कृपया मदतीसाठी संपर्क साधा.",
            redirectUrl: "tel:09579005645",
            actionText: "Call Partner Support (095790 05645)",
          })
          return
        }
        throw new Error(data.error || "Failed to send OTP")
      }
      setOtpSent(true)
      setOtpTimer(50)
      setCanResend(false)
      setOtpValues(["", "", "", "", "", ""])
      autoVerifiedRef.current = ""
    } catch (err) {
      setError(messageFor(err, "Unable to send OTP. Check your connection."))
    } finally { setOtpLoading(false) }
  }

  const handleResendMobileOtp = async () => {
    if (!canResend || resending) return
    setResending(true); setError("")
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, isLogin: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP")
      setOtpTimer(50)
      setCanResend(false)
      setOtpValues(["", "", "", "", "", ""])
      autoVerifiedRef.current = ""
    } catch (err) {
      setError(messageFor(err, "Failed to resend OTP."))
    } finally { setResending(false) }
  }

  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const nextOtp = [...otpValues]
    nextOtp[index] = val.slice(-1)
    setOtpValues(nextOtp)
    if (val && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Pasting or autofilling the whole code fills every box at once.
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = ["", "", "", "", "", ""]
    pasted.split("").forEach((d, i) => { next[i] = d })
    setOtpValues(next)
    document.getElementById(`login-otp-${Math.min(pasted.length, 5)}`)?.focus()
  }

  /**
   * Signs the partner in and sends them to the exact step they stopped at:
   * dashboard when fully onboarded, application tracker while under review,
   * otherwise the onboarding page resumed at their pending step.
   */
  const completeLogin = async (verifyData: any) => {
    setLoading(true)
    setError("")
    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10)

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("tsm_onboarding_mobile", cleanMobile)
        localStorage.setItem("tsm_onboarding_verified", "true")
      }

      if (verifyData?.customToken) {
        try {
          await signInWithCustomToken(auth, verifyData.customToken)
        } catch (signInErr) {
          console.warn("Custom token sign in note:", signInErr)
        }
      }

      // The verify endpoint already resolved the resume target from the
      // persisted onboarding state — use it and skip a second round trip.
      if (verifyData?.resumeUrl) {
        window.location.href = verifyData.resumeUrl
        return
      }

      const res = await fetch(`/api/onboarding/status?mobile=${cleanMobile}`)
      const data = await res.json()

      if (res.ok && data.application) {
        const appSt = String(data.application.status || "").toLowerCase()
        if (appSt === "approved" || appSt === "active") {
          window.location.href = "/"
          return
        }
        if (appSt === "under_review" || appSt === "submitted") {
          const appId = data.application.applicationId || cleanMobile
          window.location.href = `/application-status?id=${appId}`
          return
        }
      }
      window.location.href = "/onboarding"
    } catch (err) {
      console.error("WhatsApp OTP login error:", err)
      window.location.href = "/onboarding"
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyInlineOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const fullOtp = otpValues.join("")
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP code.")
      return
    }

    setVerifyLoading(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, otp: fullOtp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid OTP code")

      // OTP section collapses into the green verified state, then we resume.
      setIsMobileVerified(true)
      setOtpSent(false)
      await completeLogin(data)
    } catch (err: any) {
      autoVerifiedRef.current = ""
      setError(err.message || "Failed to verify OTP.")
    } finally {
      setVerifyLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValues, mobileNumber])

  // Auto-submit as soon as all six digits are present — no manual click needed.
  useEffect(() => {
    const fullOtp = otpValues.join("")
    if (!otpSent || isMobileVerified || verifyLoading) return
    if (fullOtp.length !== 6) return
    if (autoVerifiedRef.current === fullOtp) return
    autoVerifiedRef.current = fullOtp
    handleVerifyInlineOtp()
  }, [otpValues, otpSent, isMobileVerified, verifyLoading, handleVerifyInlineOtp])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const cleanEmail = email.trim().toLowerCase()

    try {
      await loginWithEmailAndPassword(cleanEmail, password)

      const res = await fetch(`/api/onboarding/status?email=${encodeURIComponent(cleanEmail)}`)
      const data = await res.json()

      if (res.ok && data.application) {
        const appSt = String(data.application.status || "").toLowerCase()
        if (appSt === "approved" || appSt === "active") {
          window.location.href = "/"
          return
        } else if (appSt === "under_review" || appSt === "submitted") {
          window.location.href = `/application-status?id=${data.application.applicationId || encodeURIComponent(cleanEmail)}`
          return
        }
      }

      window.location.href = "/"
    } catch (err) {
      setError(messageFor(err, "Invalid email or password."))
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      await signInWithGooglePopup()
      const currentUser = auth.currentUser
      const userEmail = currentUser?.email?.toLowerCase() || ""

      if (userEmail) {
        const res = await fetch(`/api/onboarding/status?email=${encodeURIComponent(userEmail)}`)
        const data = await res.json()
        if (res.ok && data.application) {
          const appSt = String(data.application.status || "").toLowerCase()
          if (appSt === "approved" || appSt === "active") {
            window.location.href = "/"
            return
          } else if (appSt === "under_review" || appSt === "submitted") {
            window.location.href = `/application-status?id=${data.application.applicationId || encodeURIComponent(userEmail)}`
            return
          }
        }
      }

      window.location.href = "/"
    } catch (err) {
      setError(messageFor(err, "Google sign-in failed."))
      setLoading(false)
    }
  }

  const busy = loading || otpLoading

  return (
    <div className="partner-root min-h-screen flex flex-col bg-admin-bg">
      {/* ── Shared Header (same as onboarding) ── */}
      <PartnerPortalHeader subtitle="Partner Portal" rightLinkLabel="Track Application" rightLinkHref="/application-status" />

      {/* ── Main content ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT — Brand info */}
          <section className="hidden lg:flex flex-col gap-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="text-admin-2xs font-bold uppercase tracking-widest text-brand">Partner Network</span>
              <span className="flex-1 max-w-[32px] h-px bg-brand/40" />
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-extrabold text-admin-text leading-[1.2] tracking-tight">
                Powering India&apos;s<br />
                <span className="text-brand">Financial Network.</span>
              </h1>
              <p className="text-admin-sm text-admin-muted leading-relaxed">
                A secure platform for registered financial partners — submit applications,
                track approvals in real-time, and manage all your lending relationships.
              </p>
            </div>

            {/* Network SVG */}
            <NetworkSVG />

            {/* Stats — 2×2 compact */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { Icon: Building2, v: "50+", l: "Banking Partners" },
                { Icon: Users, v: "500+", l: "Verified DSAs" },
                { Icon: Zap, v: "24H", l: "Express Payouts" },
                { Icon: Activity, v: "Live", l: "File Tracking" },
              ].map(({ Icon, v, l }) => (
                <div key={l} className="flex items-center gap-3 bg-admin-surface border border-admin-border rounded-admin px-3 py-2.5 shadow-admin-1">
                  <div className="w-7 h-7 rounded-admin-sm bg-brand-soft flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-admin-sm font-bold text-admin-text leading-tight">{v}</p>
                    <p className="text-admin-2xs text-admin-muted leading-tight">{l}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT — Login Card */}
          <section className="w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 p-6 sm:p-7 space-y-5">

              {/* Heading */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-admin-text leading-tight">Welcome back</h2>
                <p className="text-admin-xs text-admin-muted">Sign in to your Techstar Money partner portal.</p>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-admin-sm bg-tone-danger border border-tone-danger-bd text-tone-danger-fg text-admin-xs">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Eligibility Notice */}
              {eligibilityError && (
                <div className="p-3.5 rounded-admin bg-amber-50 border border-amber-200 text-amber-900 text-admin-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950 text-admin-xs">
                        {eligibilityError.marathiMessage}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        {eligibilityError.message}
                      </div>
                    </div>
                  </div>
                  {eligibilityError.redirectUrl && (
                    <div className="pt-1">
                      <Link
                        href={eligibilityError.redirectUrl}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-admin-sm bg-amber-600 hover:bg-amber-700 text-white font-bold text-admin-xs text-decoration-none shadow-xs transition-colors"
                      >
                        <span>{eligibilityError.actionText || "Continue →"}</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div role="tablist" className="grid grid-cols-2 gap-1 p-1 bg-admin-bg border border-admin-border rounded-admin">
                {(["otp", "email"] as AuthMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={authMethod === m}
                    onClick={() => { setAuthMethod(m); setError("") }}
                    className={cn(
                      "admin-focus flex items-center justify-center gap-1.5 h-9 rounded-admin-sm text-admin-xs font-semibold transition-all",
                      authMethod === m
                        ? "bg-admin-surface text-brand shadow-admin-1 border border-admin-border"
                        : "text-admin-muted hover:text-admin-text"
                    )}
                  >
                    {m === "otp" ? <><Smartphone size={12} />Mobile OTP</> : <><Mail size={12} />Email Login</>}
                  </button>
                ))}
              </div>

              {/* OTP Form */}
              {authMethod === "otp" ? (
                <form onSubmit={handleSendMobileOtp} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="mobile-input" className="block text-admin-xs font-semibold text-admin-text">
                      Registered Mobile Number
                    </label>
                    <div className={cn(
                      "flex h-10 sm:h-11 rounded-admin border bg-admin-bg overflow-hidden transition-all",
                      "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15",
                      mobileInvalid ? "border-tone-danger-bd" : "border-admin-border"
                    )}>
                      <span className="flex items-center px-3 bg-admin-surface border-r border-admin-border text-admin-xs font-semibold text-admin-text select-none shrink-0">
                        +91
                      </span>
                      <input
                        id="mobile-input"
                        autoFocus
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        autoComplete="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={mobileNumber}
                        disabled={otpSent || isMobileVerified}
                        onChange={e => { setMobileNumber(e.target.value.replace(/\D/g, "")); setError("") }}
                        aria-invalid={mobileInvalid}
                        className="w-full px-3 bg-transparent text-admin-sm text-admin-text placeholder:text-admin-subtle focus:outline-none"
                      />
                    </div>
                    <p className={cn("text-admin-2xs", mobileInvalid ? "text-tone-danger-fg" : "text-admin-subtle")}>
                      {mobileInvalid ? "Enter a valid 10-digit number." : "OTP will be sent to this number."}
                    </p>
                  </div>

                  {/* Verified: the OTP section is replaced by this strip */}
                  {isMobileVerified ? (
                    <div className="flex items-center gap-2 px-3.5 py-3 rounded-admin bg-tone-success-bg border border-tone-success-bd text-tone-success-fg text-admin-sm font-semibold animate-fadeIn">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>Mobile Number Verified</span>
                      <span className="ml-auto text-admin-xs font-normal opacity-80">
                        {loading ? "Signing you in..." : "Redirecting..."}
                      </span>
                    </div>
                  ) : !otpSent ? (
                    <AdminButton
                      type="submit"
                      variant="brand"
                      loading={otpLoading}
                      disabled={busy || !isMobileValid}
                      className="group w-full shadow-admin-1"
                    >
                      {otpLoading
                        ? <>Sending OTP…</>
                        : <>Get Verification OTP <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 shrink-0" /></>
                      }
                    </AdminButton>
                  ) : (
                    /* Inline OTP Verification directly underneath mobile number */
                    <div className="space-y-4 pt-3 border-t border-admin-border animate-fadeIn">
                      <div className="flex items-center justify-between text-admin-xs">
                        <span className="text-admin-muted">
                          Code sent via WhatsApp to <strong>+91 {mobileNumber}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpValues(["", "", "", "", "", ""]); setError("") }}
                          className="admin-focus admin-touch text-brand font-bold hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      {/* 6-box OTP Input */}
                      <div className="flex justify-between gap-1.5 sm:gap-2">
                        {otpValues.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`login-otp-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            autoFocus={idx === 0}
                            value={digit}
                            onChange={e => handleOtpBoxChange(idx, e.target.value)}
                            onKeyDown={e => handleOtpBoxKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            autoComplete={idx === 0 ? "one-time-code" : "off"}
                            disabled={verifyLoading}
                            className="w-10 sm:w-12 h-11 sm:h-12 text-center text-lg font-bold rounded-admin border border-admin-border bg-admin-bg text-admin-text focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                        ))}
                      </div>

                      {/* Resend & Timer */}
                      <div className="flex items-center justify-between text-admin-xs">
                        <span className="text-admin-muted">
                          {canResend ? "Didn't receive code?" : `Resend in ${otpTimer}s`}
                        </span>
                        <button
                          type="button"
                          disabled={!canResend || resending}
                          onClick={handleResendMobileOtp}
                          className="admin-focus admin-touch text-brand font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                        >
                          {resending ? "Sending..." : "Resend OTP on WhatsApp"}
                        </button>
                      </div>

                      {/* Verify Button */}
                      <AdminButton
                        type="button"
                        variant="brand"
                        loading={verifyLoading}
                        onClick={handleVerifyInlineOtp}
                        disabled={verifyLoading || otpValues.join("").length < 6}
                        className="group w-full shadow-admin-1"
                      >
                        {verifyLoading
                          ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />Verifying OTP...</>
                          : <>Verify OTP &amp; Log In <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 shrink-0" /></>
                        }
                      </AdminButton>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email-input" className="block text-admin-xs font-semibold text-admin-text">Email Address</label>
                    <div className="relative flex items-center h-10 sm:h-11 rounded-admin border border-admin-border bg-admin-bg focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 transition-all">
                      <Mail size={13} className="absolute left-3 text-admin-subtle pointer-events-none shrink-0" />
                      <input
                        id="email-input"
                        autoFocus
                        type="email"
                        autoComplete="username"
                        required
                        placeholder="partner@domain.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError("") }}
                        className="w-full pl-9 pr-3 bg-transparent text-admin-sm text-admin-text placeholder:text-admin-subtle focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password-input" className="text-admin-xs font-semibold text-admin-text">Password</label>
                      <button type="button" className="admin-focus admin-touch text-admin-2xs font-semibold text-brand hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center h-10 sm:h-11 rounded-admin border border-admin-border bg-admin-bg focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 transition-all">
                      <Lock size={13} className="absolute left-3 text-admin-subtle pointer-events-none shrink-0" />
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError("") }}
                        className="w-full pl-9 pr-10 bg-transparent text-admin-sm text-admin-text placeholder:text-admin-subtle focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="admin-focus admin-touch absolute right-3 text-admin-subtle hover:text-admin-text transition-colors"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <AdminButton
                    type="submit"
                    variant="brand"
                    loading={loading}
                    disabled={busy}
                    className="group w-full shadow-admin-1"
                  >
                    {loading
                      ? <>Signing in…</>
                      : <>Sign In <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 shrink-0" /></>
                    }
                  </AdminButton>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-admin-border" />
                <span className="text-admin-2xs text-admin-subtle font-medium shrink-0">or continue with</span>
                <span className="flex-1 h-px bg-admin-border" />
              </div>

              {/* Google */}
              <AdminButton
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={handleGoogleLogin}
                className="w-full gap-2.5 shadow-admin-1"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </AdminButton>

              {/* Footer links */}
              <div className="flex items-center justify-between pt-1 border-t border-admin-border">
                <Link href="/onboarding" className="admin-focus admin-touch text-admin-xs font-semibold text-brand hover:underline inline-flex items-center gap-1">
                  Become a Partner <ArrowRight size={11} />
                </Link>
                <Link href="/application-status" className="admin-focus admin-touch text-admin-2xs text-admin-muted hover:text-admin-text transition-colors">
                  Track Application →
                </Link>
              </div>

              {/* SSL */}
              <div className="flex items-center justify-center gap-1.5 text-admin-2xs text-admin-subtle">
                <ShieldCheck size={11} className="text-brand shrink-0" />
                Secure partner access • Your information is encrypted
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Shared Footer (same as onboarding) ── */}
      <PartnerPortalFooter />
    </div>
  )
}
