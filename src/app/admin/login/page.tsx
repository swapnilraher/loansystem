"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react"
import { AdminButton } from "@/components/admin/ui"
import { Field, TextInput } from "@/components/admin/leads/fields"

/** Firebase auth errors we can phrase better than the SDK does. */
const CREDENTIAL_ERRORS = new Set([
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
])

function messageFor(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code && CREDENTIAL_ERRORS.has(code)) return "Invalid email or password."
  const detail = (err as { message?: string })?.message || code || "Unknown error"
  return `Authentication failed: ${detail}`
}

/**
 * Which request is in flight, not merely whether one is. A single boolean put
 * the spinner on the submit button no matter what the user pressed, so
 * "Sign in with Google" — which opens a popup and can sit there for seconds —
 * gave no feedback at all beyond going grey.
 */
type Busy = "password" | "google" | "otp" | "reset" | null

/** Login fields are taller than the CRM's dense `h-9` controls: this form is
 *  the one thing on the screen, and it is usually filled with a thumb. */
const LOGIN_INPUT = "h-11 sm:h-10"

export default function AdminLoginPage() {
  const router = useRouter()
  const {
    loginWithEmailAndPassword,
    signInWithGooglePopup,
    requestPasswordReset,
    resetPasswordWithOTP,
    user,
    profile,
    adminRole,
  } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loading = busy !== null

  // Password reset runs over an emailed OTP rather than a Firebase reset link.
  const [otpMode, setOtpMode] = useState(false)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    if (user) {
      if (adminRole) {
        router.push("/admin")
      } else if (profile?.role === "partner" || profile?.dsaCode || profile?.dsaStatus) {
        setError("Partner users cannot sign in to the Staff Admin Portal. Please use the Partner Portal.")
      } else if (profile) {
        setError("Your account is not authorized for Staff Admin Portal access.")
      }
    }
  }, [user, adminRole, profile, router])

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.")
      return
    }
    setBusy("password")
    setError(null)
    setNotice(null)
    try {
      await loginWithEmailAndPassword(email.trim(), password.trim())
      router.push("/admin")
    } catch (err) {
      console.error("Login error:", err)
      setError(messageFor(err))
    } finally {
      setBusy(null)
    }
  }

  const sendOtp = async () => {
    if (!email.trim()) {
      setError("Enter your email address first, then request a reset code.")
      setNotice(null)
      return
    }
    setBusy("otp")
    setError(null)
    setNotice(null)
    try {
      await requestPasswordReset(email)
      setNotice("Reset code sent. Check your inbox.")
      setOtpMode(true)
    } catch (err) {
      console.error("Password reset error:", err)
      setError("Failed to send the reset code. Check the email address and try again.")
    } finally {
      setBusy(null)
    }
  }

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!otp.trim() || !newPassword.trim()) {
      setError("Enter the code and your new password.")
      return
    }
    setBusy("reset")
    setError(null)
    setNotice(null)
    try {
      await resetPasswordWithOTP(email, otp, newPassword)
      setNotice("Password reset. Sign in with your new password.")
      setOtpMode(false)
      setOtp("")
      setNewPassword("")
      setPassword("")
    } catch (err) {
      console.error("OTP verification failed:", err)
      setError("Could not reset the password. The code may be wrong or expired.")
    } finally {
      setBusy(null)
    }
  }

  const googleSignIn = async () => {
    setBusy("google")
    setError(null)
    try {
      await signInWithGooglePopup()
      // Deliberately still busy: the redirect above is what ends this state.
    } catch (err) {
      console.error("Google sign in failed:", err)
      setError("Google sign in failed.")
      setBusy(null)
    }
  }

  return (
    /*
      `m-auto` on the card rather than `justify-center` on the container. The
      page used to nest its own `min-h-dvh` centred box inside the layout's,
      and a centred flex child that outgrows its parent overflows *both* ways —
      so on a short screen, or a phone with the keyboard up, or the reset form
      with both banners showing, the top of the card sat above scroll position
      zero where it could never be reached. Auto margins centre identically and
      collapse instead of overflowing.
    */
    <div className="flex-1 flex w-full px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="m-auto w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="mx-auto w-14 h-14 rounded-admin-lg overflow-hidden border border-admin-border bg-admin-surface shadow-admin-1 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.jpeg" alt="" className="w-full h-full object-cover" />
          </span>
          {/* `text-admin-xl` is the size for a CRM page header sitting above a
              dense table. Here the title is the only thing on the screen, so it
              takes the top of the scale. */}
          <h1 className="text-admin-2xl font-semibold tracking-tight text-admin-text mt-3">
            Techstar Money Solution
          </h1>
          <p className="text-admin-xs text-admin-subtle mt-1">Staff portal</p>
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 p-5">
          {/* A failed sign-in is the whole reason anyone re-reads this screen;
              without a live region a screen reader never hears about it. */}
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-admin-sm bg-tone-danger border border-tone-danger-bd text-tone-danger-fg text-admin-sm"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-admin-sm bg-tone-success border border-tone-success-bd text-tone-success-fg text-admin-sm"
            >
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              {notice}
            </p>
          )}

          {otpMode ? (
            <form onSubmit={resetPassword} className="space-y-3">
              <Field label="Reset code" hint={`Sent to ${email}`}>
                <TextInput
                  autoFocus
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  // A phone should offer the number pad and the SMS/mail
                  // autofill chip for this, not a full QWERTY keyboard.
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  // `tracking-widest` spaced the placeholder out into something
                  // unreadable. `admin-num` alone keeps the typed digits on a
                  // stable tabular grid, which was the point of it.
                  className={`${LOGIN_INPUT} admin-num`}
                />
              </Field>

              <Field label="New password">
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Choose a new password"
                  className={LOGIN_INPUT}
                />
              </Field>

              <AdminButton
                type="submit"
                variant="primary"
                className="w-full"
                loading={busy === "reset"}
                disabled={loading}
              >
                Reset password
              </AdminButton>
              <AdminButton
                type="button"
                variant="ghost"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  setOtpMode(false)
                  setError(null)
                  setNotice(null)
                }}
              >
                Back to sign in
              </AdminButton>
            </form>
          ) : (
            <form onSubmit={signIn} className="space-y-3">
              <Field label="Work email">
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle pointer-events-none"
                  />
                  <TextInput
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    // "you@techstarsolution.in" is a valid-looking address, so
                    // it read as a value already in the box. "name@" keeps the
                    // domain hint but can only be read as a template.
                    placeholder="name@techstarsolution.in"
                    className={`${LOGIN_INPUT} pl-9`}
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    // No bullet placeholder: in a masked field a row of dots is
                    // indistinguishable from a password that is already typed,
                    // so people tapped Sign in on an empty box. The label and
                    // the lock icon already say what this is.
                    className={`${LOGIN_INPUT} pl-9 pr-11`}
                  />
                  {/* `admin-touch` keeps the 14px glyph but grows the hit area
                      to 44px on a touch screen — it was a 22px target. */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="admin-touch admin-focus absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-admin-sm text-admin-subtle hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              {/* Its own 44px row on a phone. As a bare 17px-tall line of text
                  it was the smallest target on the screen, sitting 12px under
                  an input people tap constantly. */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="admin-focus inline-flex items-center min-h-11 sm:min-h-0 px-1 -mx-1 rounded-admin-sm text-admin-xs font-semibold text-admin-accent hover:underline disabled:opacity-50 disabled:pointer-events-none"
                >
                  {busy === "otp" ? "Sending reset code…" : "Forgot password?"}
                </button>
              </div>

              <AdminButton
                type="submit"
                variant="primary"
                className="w-full"
                loading={busy === "password"}
                disabled={loading}
              >
                Sign in
              </AdminButton>

              <div className="flex items-center gap-2 py-1">
                <span className="flex-1 h-px bg-admin-border" />
                <span className="text-admin-2xs uppercase tracking-wide text-admin-subtle">or</span>
                <span className="flex-1 h-px bg-admin-border" />
              </div>

              <AdminButton
                type="button"
                className="w-full"
                loading={busy === "google"}
                disabled={loading}
                onClick={googleSignIn}
              >
                {busy !== "google" && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Sign in with Google
              </AdminButton>
            </form>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 mt-4 text-admin-2xs text-admin-subtle">
          <ShieldCheck size={12} className="text-tone-success-fg" />
          Staff access is role-based and audited
        </p>
      </div>
    </div>
  )
}
