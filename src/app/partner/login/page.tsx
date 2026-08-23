"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Mail,
  Lock,
  ArrowRight,
  Smartphone,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3,
  IndianRupee,
} from "lucide-react"
import WhatsAppOtpModal from "@/components/onboarding/WhatsAppOtpModal"
import { AdminButton } from "@/components/admin/ui"
import { Field, TextInput } from "@/components/admin/leads/fields"
import { cn } from "@/lib/utils"

/**
 * Reads a message off an unknown throw without widening it to `any`.
 * Firebase and `fetch` both reject with Error-shaped values here, but nothing
 * in the type system guarantees it, so narrow rather than assert.
 */
function messageFor(err: unknown, fallback: string): string {
  const detail = (err as { message?: string })?.message
  return detail || fallback
}

/** Benefit cards on the branding panel. */
const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Multiple Loan Products",
    desc: "Access a wide range of financial products across 50+ leading banks and NBFCs.",
  },
  {
    icon: Users,
    title: "Easy Lead Management",
    desc: "Submit, track and manage every customer application from a single dashboard.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Tracking",
    desc: "Monitor every file from submission to final disbursement in real time.",
  },
  {
    icon: IndianRupee,
    title: "Transparent Earnings",
    desc: "Track your commissions, payouts and monthly earnings with full transparency.",
  },
]

/**
 * Login controls are taller than the CRM's dense `h-9`: this form is the only
 * thing on the screen and it is usually filled with a thumb. Same reasoning,
 * and same measurement, as the staff login at `app/admin/login`.
 */
const LOGIN_INPUT = "h-11 sm:h-10"

/**
 * One reserved line under every field, so a validation message appears in
 * space that was already there instead of shoving the submit button down as
 * you type.
 *
 * `1.5em`, not a rem value: `--text-admin-xs` carries line-height 1.5, and `em`
 * resolves against this element's own font-size, so the reserved box matches
 * the rendered line exactly. A rem figure is measured against the root instead,
 * which ramps 15px -> 17.5px across breakpoints and left the box a pixel short.
 */
const ERROR_SLOT = "block min-h-[1.5em] text-admin-xs text-tone-danger-fg"

type AuthMethod = "whatsapp" | "email"

export default function PartnerLogin() {
  const { loginWithEmailAndPassword, signInWithGooglePopup } = useAuth()
  const router = useRouter()

  const [authMethod, setAuthMethod] = useState<AuthMethod>("whatsapp")

  // WhatsApp OTP state
  const [mobileNumber, setMobileNumber] = useState("")
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  // Email / Password state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber)
  const mobileInvalid = mobileNumber.length > 0 && !isMobileValid

  // ── WhatsApp OTP ──────────────────────────────────────────────────────────
  const handleSendMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMobileValid) {
      setError("Please enter a valid 10-digit Indian mobile number.")
      return
    }
    setOtpLoading(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP")
      setShowOtpModal(true)
    } catch (err) {
      setError(messageFor(err, "We couldn't send the OTP. Please try again."))
    } finally {
      setOtpLoading(false)
    }
  }

  // The modal passes a verification token; routing here keys off the
  // application record instead, so the parameter is deliberately not taken.
  const handleOtpVerified = async () => {
    setShowOtpModal(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/onboarding/status?mobile=${mobileNumber}`)
      const data = await res.json()

      if (res.ok && data.application) {
        const status = data.application.status
        if (status === "approved") {
          // Fully approved DSA partner → enter portal
          router.push("/partner")
        } else {
          // submitted / under_review / queried / rejected → show status tracker
          router.push(`/application-status?mobile=${mobileNumber}`)
        }
      } else {
        // No application at all → start fresh onboarding
        router.push("/onboarding")
      }
    } catch {
      // Network error → fallback to onboarding
      router.push("/onboarding")
    } finally {
      setLoading(false)
    }
  }

  // ── Email login ───────────────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await loginWithEmailAndPassword(email, password)
      /*
       * Was `const cred = await loginWithEmailAndPassword(...)` then
       * `cred?.user?.email || email`. `loginWithEmailAndPassword` is declared
       * `Promise<void>` in AuthContext, so `cred` was always `undefined` and
       * the `|| email` branch was the only one that ever ran — while the
       * property access was the one type error in this file. Same value, no
       * dead branch.
       */
      const res = await fetch(`/api/onboarding/status?email=${encodeURIComponent(email)}`)
      const data = await res.json()

      if (res.ok && data.application) {
        const status = data.application.status
        if (status === "approved") {
          router.push("/partner")
        } else {
          router.push(`/application-status?email=${encodeURIComponent(email)}`)
        }
      } else {
        // No application → start onboarding
        router.push("/onboarding")
      }
    } catch (err) {
      setError(messageFor(err, "Invalid email or password."))
    } finally {
      setLoading(false)
    }
  }

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      await signInWithGooglePopup()
      router.push("/partner")
    } catch (err) {
      setError(messageFor(err, "Failed to sign in with Google."))
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || otpLoading

  return (
    /*
     * `partner-root` is the Bootstrap quarantine marker, the counterpart to
     * `admin-root` in the CRM — see postcss-plugins/strip-bootstrap-important.
     * Without it Reboot's `label{display:inline-block}` collapses every `Field`
     * to the width of its placeholder, and `p-*`/`px-*` render at Bootstrap's
     * scale rather than Tailwind's. Nothing under /partner uses a Bootstrap
     * class, so excluding the tree costs nothing.
     */
    <div className="partner-root min-h-dvh flex bg-admin-bg">
      {/* ── Branding panel — hidden below lg ─────────────────────────────── */}
      {/*
       * `data-admin-theme="dark"` re-points the --admin-* custom properties
       * inside this subtree, so the panel is literally the CRM's dark surface
       * rather than a second palette invented for one page. That is why this
       * needs no new tokens and no hex.
       */}
      <aside
        data-admin-theme="dark"
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col overflow-hidden bg-admin-bg text-admin-text"
      >
        {/* Decorative field. Strokes inherit the panel's text colour, so they
            follow the token rather than a hard-coded white. */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden text-admin-text">
          <svg
            className="absolute -top-24 -left-24 opacity-[0.07]"
            width="600"
            height="600"
            viewBox="0 0 600 600"
            fill="none"
            aria-hidden
          >
            <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="210" stroke="currentColor" strokeWidth="1" />
            <circle cx="300" cy="300" r="140" stroke="currentColor" strokeWidth="0.5" />
          </svg>
          <svg
            className="absolute bottom-0 right-0 opacity-[0.07] translate-x-1/3 translate-y-1/3"
            width="500"
            height="500"
            viewBox="0 0 500 500"
            fill="none"
            aria-hidden
          >
            <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="1" />
            <circle cx="250" cy="250" r="160" stroke="currentColor" strokeWidth="0.7" />
          </svg>
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" aria-hidden>
            <defs>
              <pattern id="partner-login-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M48 0L0 48M0 0L48 48" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#partner-login-grid)" />
          </svg>
          <span className="absolute top-1/3 right-12 w-2 h-2 rounded-full bg-admin-accent-vivid opacity-70 shadow-[0_0_20px_8px_var(--admin-focus)]" />
          <span className="absolute bottom-1/3 left-16 w-1.5 h-1.5 rounded-full bg-admin-accent-vivid opacity-50 shadow-[0_0_14px_6px_var(--admin-focus)]" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <span className="w-11 h-11 rounded-admin overflow-hidden bg-admin-surface-2 border border-admin-border flex items-center justify-center shadow-admin-1">
              <Image
                src="/img/logo.webp"
                alt=""
                width={44}
                height={44}
                className="object-contain"
                // `priority` is deprecated in Next 16 in favour of `preload`
                // (next/image docs, v16.0.0 changelog).
                preload
              />
            </span>
            <span className="block">
              <span className="block text-admin-base font-semibold tracking-tight text-admin-text">
                Techstar Money
              </span>
              <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle mt-0.5">
                Solution Pvt. Ltd.
              </span>
            </span>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-admin-2xl font-semibold tracking-tight text-admin-text leading-snug">
              Grow your business
              <br />
              <span className="text-admin-accent">with Techstar Money</span>
            </h1>
            <p className="max-w-xs text-admin-sm text-admin-muted mt-3 leading-relaxed">
              Access multiple financial products, manage leads and track your partner earnings
              from one portal.
            </p>
          </div>

          {/* Benefit cards */}
          <ul className="space-y-2.5 flex-1">
            {BENEFITS.map(b => (
              <li
                key={b.title}
                className="flex items-start gap-3 p-3.5 rounded-admin border border-admin-border bg-admin-surface-2"
              >
                <span className="w-9 h-9 shrink-0 rounded-admin-sm bg-admin-accent-soft text-admin-accent flex items-center justify-center">
                  <b.icon size={17} />
                </span>
                <span className="block">
                  <span className="block text-admin-sm font-semibold text-admin-text leading-snug">
                    {b.title}
                  </span>
                  <span className="block text-admin-xs text-admin-subtle mt-0.5 leading-relaxed">
                    {b.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="flex items-center gap-2 mt-8 text-admin-2xs text-admin-subtle">
            <Shield size={13} className="shrink-0" />
            Techstar Money Partner Ecosystem — trusted by 500+ DSA partners
          </p>
        </div>
      </aside>

      {/* ── Login column ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col w-full px-4 sm:px-8 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="m-auto w-full max-w-115">
          {/* Logo, phones only — the branding panel carries it from lg up. */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <span className="w-10 h-10 rounded-admin overflow-hidden border border-admin-border bg-admin-surface shadow-admin-1 flex items-center justify-center">
              <Image
                src="/img/logo.webp"
                alt=""
                width={40}
                height={40}
                className="object-contain"
                preload
              />
            </span>
            <span className="block">
              <span className="block text-admin-base font-semibold tracking-tight text-admin-text">
                Techstar Money
              </span>
              <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle mt-0.5">
                DSA Partner Portal
              </span>
            </span>
          </div>

          <div className="bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 p-5 sm:p-6">
            {/* Card header */}
            <div className="mb-5">
              <h2 className="text-admin-2xl font-semibold tracking-tight text-admin-text">
                Welcome back
              </h2>
              <p className="text-admin-sm text-admin-muted mt-1">
                Sign in to your DSA partner portal
              </p>
            </div>

            {/* A failed sign-in is the whole reason anyone re-reads this
                screen; without a live region a screen reader never hears it. */}
            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-admin-sm bg-tone-danger border border-tone-danger-bd text-tone-danger-fg text-admin-sm"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            {/* Method switcher */}
            <div
              role="tablist"
              aria-label="Sign-in method"
              className="flex gap-1 p-1 mb-4 rounded-admin bg-admin-surface-2 border border-admin-border"
            >
              {([
                { id: "whatsapp", label: "WhatsApp OTP" },
                { id: "email", label: "Email login" },
              ] as const).map(m => {
                const active = authMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setAuthMethod(m.id)
                      setError("")
                    }}
                    className={cn(
                      "admin-focus flex-1 inline-flex items-center justify-center gap-1.5 h-11 sm:h-9 rounded-admin-sm text-admin-xs font-semibold transition-colors",
                      active
                        ? "bg-admin-surface text-admin-text border border-admin-border shadow-admin-1"
                        : "border border-transparent text-admin-muted hover:text-admin-text"
                    )}
                  >
                    {m.id === "whatsapp" ? (
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.555 4.122 1.523 5.853L0 24l6.27-1.497A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.67-.51-5.192-1.4l-.372-.22-3.724.888.934-3.622-.242-.375A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                      </svg>
                    ) : (
                      <Mail size={13} className="shrink-0" />
                    )}
                    {m.label}
                  </button>
                )
              })}
            </div>

            {/* `key` remounts on switch, which is what re-runs `autoFocus` so
                the new method's first field takes focus. */}
            {authMethod === "whatsapp" ? (
              <form key="whatsapp" onSubmit={handleSendMobileOtp} className="space-y-3" noValidate>
                <div>
                  <Field label="Mobile number">
                    {/* Prefix sits inside the control rather than as a
                        bordered input-group addon, matching the icon-inside
                        pattern the staff login already uses. */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-admin-sm text-admin-muted pointer-events-none select-none">
                        <Smartphone size={14} className="text-admin-subtle" />
                        +91
                      </span>
                      <TextInput
                        autoFocus
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        autoComplete="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={mobileNumber}
                        onChange={e => {
                          setMobileNumber(e.target.value.replace(/\D/g, ""))
                          setError("")
                        }}
                        aria-invalid={mobileInvalid}
                        aria-describedby="mobile-error"
                        className={cn(LOGIN_INPUT, "admin-num pl-16")}
                      />
                    </div>
                  </Field>
                  <span id="mobile-error" role="alert" className={ERROR_SLOT}>
                    {mobileInvalid ? "Enter a valid 10-digit Indian mobile number." : ""}
                  </span>
                </div>

                <AdminButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={otpLoading}
                  disabled={busy || !isMobileValid}
                >
                  Send WhatsApp OTP
                  {!otpLoading && <ArrowRight size={15} />}
                </AdminButton>
              </form>
            ) : (
              <form key="email" onSubmit={handleEmailLogin} className="space-y-3" noValidate>
                <Field label="Email address">
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle pointer-events-none"
                    />
                    <TextInput
                      autoFocus
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="Your registered email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        setError("")
                      }}
                      className={cn(LOGIN_INPUT, "pl-9")}
                    />
                  </div>
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle pointer-events-none"
                    />
                    <TextInput
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value)
                        setError("")
                      }}
                      className={cn(LOGIN_INPUT, "pl-9 pr-11")}
                    />
                    {/* `admin-touch` keeps the 14px glyph and grows only the
                        hit area to 44px — it was a 16px target. */}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="admin-touch admin-focus absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-admin-sm text-admin-subtle hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>

                <AdminButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  disabled={busy}
                >
                  Sign in
                  {!loading && <ArrowRight size={15} />}
                </AdminButton>
              </form>
            )}

            <div className="flex items-center gap-2 py-3">
              <span className="flex-1 h-px bg-admin-border" />
              <span className="text-admin-2xs uppercase tracking-wide text-admin-subtle">or</span>
              <span className="flex-1 h-px bg-admin-border" />
            </div>

            <AdminButton type="button" className="w-full" disabled={busy} onClick={handleGoogleLogin}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </AdminButton>

            <div className="mt-5 pt-4 border-t border-admin-border text-center">
              <p className="text-admin-sm text-admin-muted">
                New to Techstar Money?{" "}
                <Link
                  href="/onboarding"
                  className="admin-focus rounded-admin-sm font-semibold text-admin-accent hover:underline"
                >
                  Register as DSA partner
                </Link>
              </p>
              {/* Its own 44px row on a phone; as a bare 11px line it was the
                  smallest target on the screen. */}
              <Link
                href="/application-status"
                className="admin-focus inline-flex items-center justify-center min-h-11 sm:min-h-0 sm:mt-1 px-1 rounded-admin-sm text-admin-xs text-admin-subtle hover:text-admin-text"
              >
                Track a submitted application
              </Link>
            </div>
          </div>

          <footer className="mt-6 text-center space-y-1.5">
            <p className="text-admin-xs font-semibold text-admin-muted">
              Techstar Money Solution Pvt. Ltd.
            </p>
            <div className="flex items-center justify-center gap-1 text-admin-2xs text-admin-subtle">
              <Link
                href="/privacy-policy"
                className="admin-focus inline-flex items-center min-h-11 sm:min-h-0 px-2 rounded-admin-sm hover:text-admin-text"
              >
                Privacy Policy
              </Link>
              <span aria-hidden>·</span>
              <Link
                href="/terms-conditions"
                className="admin-focus inline-flex items-center min-h-11 sm:min-h-0 px-2 rounded-admin-sm hover:text-admin-text"
              >
                Terms &amp; Conditions
              </Link>
              <span aria-hidden>·</span>
              <a
                href="tel:9579005645"
                className="admin-focus inline-flex items-center min-h-11 sm:min-h-0 px-2 rounded-admin-sm hover:text-admin-text"
              >
                Contact Support
              </a>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-admin-2xs text-admin-subtle">
              <Shield size={12} className="text-tone-success-fg" />
              Secure and encrypted partner portal
            </p>
          </footer>
        </div>
      </main>

      {/* WhatsApp OTP Modal — functionality unchanged */}
      <WhatsAppOtpModal
        isOpen={showOtpModal}
        phoneNumber={mobileNumber}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
        onChangeNumber={() => setShowOtpModal(false)}
      />
    </div>
  )
}
