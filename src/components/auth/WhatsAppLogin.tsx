"use client"

/**
 * Marketing-side login modal.
 *
 * NOTE ON BOOTSTRAP — this renders from `sections/Layout.tsx`, i.e. inside the
 * marketing shell, where Bootstrap is deliberately still in play. It therefore
 * must NOT carry `partner-root`: that marker is matched as
 * `body:not(:has(.partner-root))`, so mounting it here would switch Bootstrap
 * off for the entire marketing page, not just this modal.
 *
 * So this file uses the admin tokens (Bootstrap defines none of them) but
 * avoids every utility Bootstrap also declares `!important`:
 *   - `p-*`/`m-*`/`gap-*` integers 0–5   -> use 6+, `.5` steps, or `space-y-*`
 *   - bare `border` / `rounded` / `shadow` -> use `border-[1px]`,
 *     `rounded-admin*`, `shadow-admin-*`
 */

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GoogleAuthProvider, signInWithPopup, signInWithCustomToken } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { X, MessageSquare, ArrowRight, Loader2, Mail, MapPin, User } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface WhatsAppLoginProps {
  isOpen: boolean
  onClose: () => void
}

/** Reads a message off an unknown throw without widening it to `any`. */
function codeOf(err: unknown): string | undefined {
  return (err as { code?: string })?.code
}

/** Controls sized for a thumb; this modal is opened mostly on phones. */
const CONTROL =
  "admin-focus w-full h-12 px-3.5 bg-admin-surface border-[1px] border-admin-border rounded-admin-sm text-admin-base! text-admin-text! placeholder:text-admin-subtle! transition-colors"

const PROFILE_FIELDS = [
  { label: "Name (as per PAN card)", icon: User, key: "panName", placeholder: "Full name" },
  { label: "Email address", icon: Mail, key: "email", placeholder: "email@example.com" },
  { label: "City", icon: MapPin, key: "city", placeholder: "Your city" },
] as const

type FieldKey = "panName" | "email" | "city" | "mobile"

export function WhatsAppLogin({ isOpen, onClose }: WhatsAppLoginProps) {
  /*
   * Only the two pre-auth screens are stored. "completion" is *derived* from
   * whether a signed-in profile is still missing fields — as stored state it
   * had to be pushed in from an effect, which is a cascading render and the one
   * lint error in this file.
   */
  const [preAuthStep, setPreAuthStep] = useState<"login" | "otp">("login")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const { user, profile, updateProfile } = useAuth()

  /*
   * Only what the user has actually typed. The values shown fall back to the
   * profile, so the form seeds itself from `profile` by reading through rather
   * than being copied in by an effect — which was a cascading render.
   */
  const [edits, setEdits] = useState<Partial<Record<FieldKey, string>>>({})

  const profileComplete = Boolean(
    profile && profile.panName && profile.city && (profile.email || profile.mobile)
  )
  /** Signed in but still missing fields -> the profile form, whatever else. */
  const needsCompletion = Boolean(isOpen && user && profile && !profileComplete)
  const step: "login" | "otp" | "completion" = needsCompletion ? "completion" : preAuthStep

  const valueOf = (key: FieldKey): string =>
    edits[key] ?? (profile?.[key] as string | undefined) ?? (key === "mobile" ? phoneNumber : "")

  const formData = {
    panName: valueOf("panName"),
    email: valueOf("email"),
    city: valueOf("city"),
    mobile: valueOf("mobile"),
  }

  // Purely the side effect now: a complete profile leaves for the dashboard.
  useEffect(() => {
    if (isOpen && user && profile && profileComplete) {
      onClose()
      router.push("/dashboard")
    }
  }, [isOpen, user, profile, profileComplete, router, onClose])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      if (codeOf(err) !== "auth/popup-closed-by-user") {
        setError("Google login failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      setError("Please enter a valid mobile number")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })
      const data = await res.json()
      if (data.success) {
        setPreAuthStep("otp")
      } else {
        setError(data.error || "Failed to send OTP.")
      }
    } catch {
      setError("Failed to send OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      setError("Please enter the 4-digit OTP")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      })
      const data = await res.json()
      if (data.success && data.customToken) {
        await signInWithCustomToken(auth, data.customToken)
      } else {
        setError(data.error || "Invalid OTP.")
      }
    } catch {
      setError("Invalid OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async () => {
    if (!formData.panName || !formData.city || (!formData.email && !formData.mobile)) {
      setError("Please fill all required fields")
      return
    }
    setLoading(true)
    try {
      await updateProfile({
        ...formData,
        mobile: formData.mobile || phoneNumber,
      })
      onClose()
      router.push("/dashboard")
    } catch {
      setError("Failed to save info.")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case "login":
        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="wa-phone"
                className="block text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-subtle!"
              >
                WhatsApp number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-base! text-admin-muted! pointer-events-none select-none">
                  +91
                </span>
                <input
                  id="wa-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="00000 00000"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  aria-invalid={phoneNumber.length > 0 && phoneNumber.length < 10}
                  aria-describedby="wa-phone-error"
                  className={cn(CONTROL, "admin-num pl-11")}
                />
              </div>
              <span
                id="wa-phone-error"
                role="alert"
                className="block min-h-[1.5em] text-admin-xs! text-tone-danger-fg"
              >
                {phoneNumber.length > 0 && phoneNumber.length < 10
                  ? "Enter all 10 digits."
                  : ""}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length < 10}
              className="admin-focus w-full h-12 rounded-admin-sm bg-admin-accent text-admin-accent-fg! text-admin-base! font-semibold! inline-flex justify-center items-center gap-2 transition-colors hover:bg-admin-accent-hover disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  Get OTP via WhatsApp <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <span className="flex-1 h-px bg-admin-border" />
              <span className="text-admin-2xs! uppercase tracking-wide text-admin-subtle!">
                or connect with
              </span>
              <span className="flex-1 h-px bg-admin-border" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="admin-focus w-full h-12 rounded-admin-sm bg-admin-surface border-[1px] border-admin-border text-admin-base! font-semibold! text-admin-text! inline-flex justify-center items-center gap-2.5 transition-colors hover:bg-admin-surface-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <p className="text-center text-admin-2xs! text-admin-subtle!">
                One-tap secure access to your profile
              </p>
            </div>
          </div>
        )

      case "otp":
        return (
          <div className="space-y-5 text-center">
            <div className="space-y-1.5">
              <span className="mx-auto w-14 h-14 rounded-admin bg-admin-accent-soft text-admin-accent! flex items-center justify-center">
                <MessageSquare size={26} />
              </span>
              <p className="text-admin-sm! text-admin-muted!">
                OTP sent to{" "}
                <span className="font-semibold! text-admin-text! admin-num">+91 {phoneNumber}</span>
              </p>
              <button
                type="button"
                onClick={() => setPreAuthStep("login")}
                className="admin-focus inline-flex items-center min-h-11 px-2 rounded-admin-sm text-admin-xs! font-semibold! text-admin-accent! hover:underline"
              >
                Change number
              </button>
            </div>

            <div className="flex justify-center gap-2.5">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  id={`otp-${i}`}
                  aria-label={`OTP digit ${i + 1}`}
                  className="admin-focus w-12 h-14 bg-admin-surface-2 border-[1px] border-admin-border rounded-admin-sm text-center text-admin-xl! font-semibold! text-admin-text! transition-colors"
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const val = (e.target as HTMLInputElement).value
                    if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus()
                    const newOtp = otp.split("")
                    newOtp[i] = val
                    setOtp(newOtp.join(""))
                  }}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && i > 0)
                      document.getElementById(`otp-${i - 1}`)?.focus()
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 4}
              className="admin-focus w-full h-12 rounded-admin-sm bg-admin-accent text-admin-accent-fg! text-admin-base! font-semibold! inline-flex justify-center items-center gap-2 transition-colors hover:bg-admin-accent-hover disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : "Verify & log in"}
            </button>
          </div>
        )

      case "completion":
        return (
          <div className="space-y-3.5">
            <p className="text-center text-admin-sm! text-admin-muted!">
              Almost there — complete your profile.
            </p>

            {PROFILE_FIELDS.map(field => (
              <div key={field.key} className="space-y-1.5">
                <label
                  htmlFor={`wa-${field.key}`}
                  className="block text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-subtle!"
                >
                  {field.label}
                </label>
                <div className="relative">
                  <field.icon
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-subtle! pointer-events-none"
                  />
                  <input
                    id={`wa-${field.key}`}
                    className={cn(CONTROL, "pl-10")}
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChange={e => setEdits(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleCompleteProfile}
              disabled={loading}
              className="admin-focus w-full h-12 rounded-admin-sm bg-admin-accent text-admin-accent-fg! text-admin-base! font-semibold! inline-flex justify-center items-center gap-2 transition-colors hover:bg-admin-accent-hover disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                "Save & go to dashboard"
              )}
            </button>
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-admin-overlay backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Log in or sign up"
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            className="relative w-full max-w-md max-h-full overflow-y-auto custom-scrollbar bg-admin-surface border-[1px] border-admin-border rounded-admin-lg shadow-admin-3"
          >
            <div className="relative px-6 pt-8 pb-3.5 text-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="admin-touch admin-focus absolute top-3.5 right-3.5 w-9 h-9 inline-flex items-center justify-center rounded-admin-sm text-admin-subtle! hover:text-admin-text! hover:bg-admin-surface-2 transition-colors"
              >
                <X size={17} />
              </button>

              <span className="mx-auto w-16 h-16 rounded-admin overflow-hidden border-[1px] border-admin-border bg-admin-surface shadow-admin-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo.jpeg" alt="" className="w-full h-full object-cover" />
              </span>
              <h2 className="text-admin-2xl! font-semibold! tracking-tight text-admin-text! mt-3">
                Techstar Money Solution
              </h2>
              <p className="text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-subtle! mt-1">
                Secure login / signup
              </p>
            </div>

            <div className="px-6 pb-6">
              {error && (
                <p
                  role="alert"
                  className="mb-3.5 px-3.5 py-2.5 rounded-admin-sm bg-tone-danger border-[1px] border-tone-danger-bd text-tone-danger-fg text-admin-sm! text-center"
                >
                  {error}
                </p>
              )}
              {renderStep()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
