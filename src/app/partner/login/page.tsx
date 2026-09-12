"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signInWithCustomToken } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Headphones,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

function messageFor(err: unknown, fallback: string): string {
  return (err as { message?: string })?.message || fallback
}

type AuthMethod = "otp" | "email"

export default function PartnerLogin() {
  const { loginWithEmailAndPassword, signInWithGooglePopup } = useAuth()
  const router = useRouter()

  const [authMethod, setAuthMethod] = useState<AuthMethod>("otp")
  const [mobileNumber, setMobileNumber] = useState("")
  const [whatsappUpdates, setWhatsappUpdates] = useState(true)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [otpTimer, setOtpTimer] = useState(50)
  const [canResend, setCanResend] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

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

  // Trigger green success toast when OTP is sent
  useEffect(() => {
    if (otpSent) {
      setShowToast(true)
      const t = setTimeout(() => setShowToast(false), 5000)
      return () => clearTimeout(t)
    }
  }, [otpSent])

  const handleSendMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isMobileValid) {
      setError("Enter a valid 10-digit mobile number.")
      return
    }
    setOtpLoading(true)
    setError("")
    setEligibilityError(null)

    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendMobileOtp = async () => {
    if (!canResend || resending) return
    setResending(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, isLogin: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP")
      setOtpTimer(50)
      setCanResend(false)
      setOtpValues(["", "", "", "", "", ""])
      autoVerifiedRef.current = ""
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    } catch (err) {
      setError(messageFor(err, "Failed to resend OTP."))
    } finally {
      setResending(false)
    }
  }

  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    autoVerifiedRef.current = ""
    const nextOtp = [...otpValues]
    nextOtp[index] = val.slice(-1)
    setOtpValues(nextOtp)
    if (val && index < 5) {
      const nextInput = document.getElementById(`login-modal-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`login-modal-otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    autoVerifiedRef.current = ""
    const next = ["", "", "", "", "", ""]
    pasted.split("").forEach((d, i) => { next[i] = d })
    setOtpValues(next)
    document.getElementById(`login-modal-otp-${Math.min(pasted.length, 5)}`)?.focus()
  }

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
      console.error("Partner OTP login error:", err)
      window.location.href = "/onboarding"
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtpSubmit = useCallback(async (e?: React.FormEvent) => {
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
        body: JSON.stringify({ phoneNumber: mobileNumber, otp: fullOtp, isLogin: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid OTP code")

      setIsMobileVerified(true)
      setOtpSent(false)
      await completeLogin(data)
    } catch (err: any) {
      // Keep autoVerifiedRef.current so it does NOT auto-retry the exact same failed code!
      setError(err.message || "Failed to verify OTP.")
    } finally {
      setVerifyLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValues, mobileNumber])

  // Auto-submit as soon as all six digits are present
  useEffect(() => {
    const fullOtp = otpValues.join("")
    if (!otpSent || isMobileVerified || verifyLoading) return
    if (fullOtp.length !== 6) return
    if (autoVerifiedRef.current === fullOtp) return
    autoVerifiedRef.current = fullOtp
    handleVerifyOtpSubmit()
  }, [otpValues, otpSent, isMobileVerified, verifyLoading, handleVerifyOtpSubmit])

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

  const busy = loading || otpLoading || verifyLoading

  // Masked phone for authenticate modal
  const maskedPhone =
    mobileNumber.length === 10
      ? `+91xxxxxx${mobileNumber.slice(-4)}`
      : `+91 ${mobileNumber}`

  return (
    <div className="min-h-dvh flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* ── Cashfree-style Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-3 sm:px-6">
          {/* Logo */}
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

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/application-status"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Track Status
            </Link>

            {/* Help Button (?) */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-[#0f4bb4] transition-colors cursor-pointer"
              aria-label="Help and support"
            >
              <HelpCircle size={20} className="stroke-[2]" />
            </button>
          </div>
        </div>

        {/* ── DSA Partner Exclusive Ribbon ── */}
        <div className="bg-gradient-to-r from-[#6d28d9] via-[#4338ca] to-[#059669] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-3 text-center tracking-wide flex items-center justify-center gap-2">
          <span>DSA Partner Special Offer! Onboarding @ ₹0 Registration Fee* · Up to 2.5% Payout on Loan Disbursals · 50+ Banks &amp; NBFCs</span>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-md py-2 sm:py-4 space-y-6 animate-fadeIn">
          {/* Brand Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Partner Login.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in to your Techstar DSA Partner portal to manage loan files and payouts.
            </p>
          </div>

          {/* Error Banner */}
          {error && !otpSent && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-fadeIn"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Eligibility Notice (Not Registered / Not Approved / Blocked) */}
          {eligibilityError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 text-xs">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-black text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    <span>{eligibilityError.actionText || "Continue →"}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Main Form Card ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-5">
            {/* Auth Method Selector (Mobile OTP vs Email) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("otp")
                  setError("")
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  authMethod === "otp"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Smartphone size={14} />
                <span>Mobile OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("email")
                  setError("")
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  authMethod === "email"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Mail size={14} />
                <span>Email Login</span>
              </button>
            </div>

            {/* Form Content: Mobile OTP */}
            {authMethod === "otp" ? (
              <form onSubmit={handleSendMobileOtp} noValidate className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="mobile-input" className="block text-xs font-semibold text-slate-700">
                    Registered Mobile Number
                  </label>
                  <div
                    className={cn(
                      "flex h-12 rounded-xl border bg-white overflow-hidden transition-all",
                      "focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10",
                      mobileInvalid ? "border-rose-400" : "border-slate-200"
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
                      id="mobile-input"
                      autoFocus
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      autoComplete="tel"
                      placeholder=""
                      value={mobileNumber}
                      disabled={otpSent || isMobileVerified || otpLoading}
                      onChange={(e) => {
                        setMobileNumber(e.target.value.replace(/\D/g, ""))
                        setError("")
                        setEligibilityError(null)
                      }}
                      className="w-full px-3.5 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  {mobileInvalid && (
                    <p className="text-xs text-rose-500">Please enter a valid 10-digit mobile number.</p>
                  )}
                </div>

                {/* WhatsApp Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={whatsappUpdates}
                    onChange={(e) => setWhatsappUpdates(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    Receive account updates via WhatsApp
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px]">
                      💬
                    </span>
                  </span>
                </label>

                {/* Black Action Button */}
                <button
                  type="submit"
                  disabled={busy || !isMobileValid}
                  className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending OTP…</span>
                    </>
                  ) : (
                    <span>Get Verification OTP</span>
                  )}
                </button>
              </form>
            ) : (
              /* Form Content: Email Login */
              <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative flex items-center h-12 rounded-xl border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10 transition-all">
                    <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0" />
                    <input
                      id="email-input"
                      autoFocus
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="partner@domain.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError("")
                      }}
                      className="w-full pl-10 pr-3.5 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password-input" className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <a
                      href="https://wa.me/919579005645?text=Hello%20Techstar,%20I%20forgot%20my%20partner%20password."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-[#0f4bb4] hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative flex items-center h-12 rounded-xl border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10 transition-all">
                    <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0" />
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError("")
                      }}
                      className="w-full pl-10 pr-10 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <span>Sign In to Portal</span>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-medium shrink-0">or continue with</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google Sign-in */}
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleLogin}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Footer Registration Link */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">New to Techstar?</span>
              <Link
                href="/onboarding"
                className="font-bold text-[#0f4bb4] hover:underline inline-flex items-center gap-1"
              >
                Register as Partner <ArrowRight size={13} />
              </Link>
            </div>

            {/* Facing Issues */}
            <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5">
              <span className="text-xs text-slate-500">Facing issues?</span>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-3.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Need help?
              </button>
            </div>
          </div>

          {/* ── DSA Partner Benefit Card (Cashfree aesthetic) ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-[#064e3b] to-slate-900 p-5 text-white shadow-md border border-emerald-800/40">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  DSA Partner Benefit
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  HIGHEST <span className="text-emerald-400 text-lg font-bold">Commission Slabs*</span>
                </div>
                <p className="text-xs text-emerald-100/80 max-w-[220px]">
                  Earn up to 2.5% DSA payout on loan disbursements across 50+ Banks &amp; NBFCs.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-full border border-emerald-400/30 bg-emerald-900/50 shadow-inner">
                <span className="text-xl font-black text-amber-300">2.5%</span>
                <span className="text-[9px] uppercase font-bold text-emerald-200 text-center">Max Payout</span>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Bank-grade 256-bit encryption • ISO 9001:2015 certified</span>
          </div>
        </div>
      </main>

      {/* ── Cashfree Authenticate Modal / Bottom Sheet ── */}
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
                className="text-white/80 hover:text-white cursor-pointer"
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
                onClick={() => {
                  setOtpSent(false)
                  setOtpValues(["", "", "", "", "", ""])
                  setError("")
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the 6-digit OTP sent to your phone number{" "}
                <strong className="text-slate-900">{maskedPhone}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false)
                  setOtpValues(["", "", "", "", "", ""])
                  setError("")
                }}
                className="text-xs font-semibold text-[#0f4bb4] hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                Edit phone number
              </button>
            </div>

            {/* Error inside modal */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 6 Individual Digit Boxes */}
            <div className="flex justify-between gap-1.5 sm:gap-2">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  id={`login-modal-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={idx === 0}
                  value={digit}
                  onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  disabled={verifyLoading}
                  className="w-11 sm:w-12 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all outline-none"
                />
              ))}
            </div>

            {/* Resend & Timer */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">
                {canResend ? "Didn't receive OTP?" : `Resend in ${otpTimer}s`}
              </span>
              <button
                type="button"
                disabled={!canResend || resending}
                onClick={handleResendMobileOtp}
                className="font-semibold text-[#0f4bb4] hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {resending ? "Sending OTP..." : "Resend OTP on WhatsApp"}
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              disabled={verifyLoading || otpValues.join("").length < 6}
              onClick={() => handleVerifyOtpSubmit()}
              className="w-full h-12 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {verifyLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying OTP…</span>
                </>
              ) : (
                <span>Verify &amp; Log In</span>
              )}
            </button>

            {/* Facing issues */}
            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
              >
                Need help authenticating?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Partner Helpdesk Modal ── */}
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
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Our partner onboarding specialists are here to assist you with login, document verification, and registration.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="tel:09579005645"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone size={14} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Call Support</div>
                  <div>095790 05645</div>
                </div>
              </a>

              <a
                href="https://wa.me/919579005645?text=Hello%20Techstar,%20I%20need%20assistance%20logging%20in%20to%20the%20partner%20portal."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp Desk</div>
                  <div>Chat with Partner Team</div>
                </div>
              </a>

              <a
                href="mailto:support@techstarsolution.in"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail size={14} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Email Support</div>
                  <div>support@techstarsolution.in</div>
                </div>
              </a>
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-2">
              Operational Hours: Mon – Sat, 9:30 AM – 7:00 PM IST
            </p>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="py-4 px-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} Techstar Money Solution. All rights reserved. • ISO 9001:2015 Certified
      </footer>
    </div>
  )
}
