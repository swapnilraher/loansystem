"use client"

/**
 * Everything the 8-step wizard knows and can do.
 *
 * The steps themselves are presentation: they read fields off `form`, call
 * `patch` to change them, and call the verb they need (`saveAndContinue`,
 * `verifyGst`, `uploadDoc`). Keeping the state and the network here means a
 * step can be reordered, split or rewritten without moving any of the logic
 * that talks to the API — which is exactly what happened to get to 8 steps.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  AADHAAR_RE,
  GSTIN_RE,
  IFSC_RE,
  LAST_INPUT_STEP,
  MOBILE_RE,
  PAN_RE,
  PARTNER_ONBOARDING_STEPS,
  PINCODE_RE,
  firstIncompletePartnerStep,
  partnerStepCompletion,
  type PartnerStepId,
} from "@/lib/onboarding-steps"
import { OnboardingStorage } from "@/lib/onboarding-storage"
import type { ErrorKind } from "@/components/onboarding/FormErrorRegion"

import {
  PROVIDER_UNAVAILABLE,
  ageFromDob,
  classifyError,
  describeError,
  fetchWithTimeout,
  isProviderOutage,
  messageFor,
  messageForKind,
  nameMatchScore,
} from "./net"
import {
  EMPTY_FORM,
  hydrateForm,
  payloadForStep,
  toApplicationShape,
  type DocKey,
  type OnboardingForm,
} from "./types"

/** After this many wrong codes the OTP form stops accepting input. */
export const MAX_OTP_ATTEMPTS = 5

/**
 * The KYC provider could not answer — an expired subscription, a bad key, an
 * outage. Distinguished from an ordinary failure because the partner is told
 * something completely different: not "check what you typed", but "this check
 * is unavailable and you may carry on regardless".
 */
class ProviderOutage extends Error {
  constructor(detail: string) {
    super(detail || "Verification provider unavailable")
    this.name = "ProviderOutage"
  }
}

/** Why a mobile number cannot start a fresh application. */
export interface EligibilityBlock {
  reason: "ALREADY_APPROVED" | "ALREADY_SUBMITTED" | "BLOCKED"
  message: string
  marathiMessage: string
  redirectUrl?: string
  actionText?: string
}

export interface DraftConflict {
  localStep: number
  serverStep: number
  localSavedAt: Date
  applied: "server" | "local"
}

export type ApplicationOutcome = "under_review" | "approved" | "rejected"

interface OnboardingValue {
  // ── identity ──────────────────────────────────────────────────────────
  mobileNumber: string
  isMobileVerified: boolean
  setMobileNumber: (raw: string) => void
  resetMobile: () => void

  // ── OTP ───────────────────────────────────────────────────────────────
  otpSent: boolean
  otpValues: string[]
  setOtpDigit: (index: number, value: string) => void
  pasteOtp: (text: string) => void
  otpTimer: number
  canResend: boolean
  otpAttempts: number
  otpLockedOut: boolean
  sendingOtp: boolean
  resendingOtp: boolean
  verifyingOtp: boolean
  sendOtp: () => Promise<void>
  resendOtp: () => Promise<void>
  verifyOtp: () => Promise<void>
  mobileError: string | null
  mobileErrorKind: ErrorKind
  eligibility: EligibilityBlock | null
  clearEligibility: () => void

  // ── the form ──────────────────────────────────────────────────────────
  form: OnboardingForm
  patch: (partial: Partial<OnboardingForm>) => void

  // ── navigation ────────────────────────────────────────────────────────
  step: PartnerStepId
  goToStep: (next: PartnerStepId) => void
  back: () => void
  stepDone: Record<PartnerStepId, boolean>
  completedCount: number
  lockReason: (id: PartnerStepId) => string | null
  saveAndContinue: () => Promise<void>

  // ── status & messages ─────────────────────────────────────────────────
  saving: boolean
  resuming: boolean
  stepError: string | null
  stepErrorKind: ErrorKind
  invalidField: string | null
  /** The step error, but only when it belongs to this field. */
  fieldError: (fieldId: string) => string | null
  setStepError: (message: string | null, kind?: ErrorKind) => void
  rejectField: (fieldId: string | null, message: string) => void
  restoredNote: string | null
  draftConflict: DraftConflict | null
  preferLocalDraft: () => void
  dismissDraftConflict: () => void
  discardLocalDraft: () => void

  // ── per-step verbs ────────────────────────────────────────────────────
  lookupPincode: (pin: string) => Promise<void>
  pincodeLoading: boolean
  pincodeAreas: string[]
  pincodeNote: string | null

  verifyGst: () => Promise<void>
  gstVerifying: boolean

  verifyPan: () => Promise<void>
  panVerifying: boolean
  panNote: string | null

  aadhaarOtpSent: boolean
  aadhaarSending: boolean
  aadhaarVerifying: boolean
  sendAadhaarOtp: (aadhaarNumber: string) => Promise<void>
  verifyAadhaarOtp: (otp: string) => Promise<void>
  cancelAadhaarOtp: () => void
  startDigilocker: () => Promise<void>
  digilockerLoading: boolean

  lookupIfsc: (code: string) => Promise<void>
  ifscLoading: boolean
  ifscValid: boolean
  ifscNote: string | null
  verifyBank: () => Promise<void>
  bankVerifying: boolean

  uploadDoc: (key: DocKey, file: File) => Promise<void>
  removeDoc: (key: DocKey) => void
  retryUpload: (key: DocKey) => void
  uploadProgress: Partial<Record<DocKey, number>>
  uploadFailed: DocKey | null
  uploadingDoc: DocKey | null

  submitApplication: () => Promise<void>
  submitting: boolean

  // ── outcome ───────────────────────────────────────────────────────────
  isSubmitted: boolean
  applicationId: string | null
  outcome: ApplicationOutcome
  application: Record<string, any> | null
  refreshStatus: () => Promise<void>
  refreshingStatus: boolean
}

const Ctx = createContext<OnboardingValue | null>(null)

export function useOnboarding(): OnboardingValue {
  const value = useContext(Ctx)
  if (!value) throw new Error("useOnboarding must be used inside <OnboardingProvider>")
  return value
}

const EMPTY_OTP = ["", "", "", "", "", ""]

const DESIGNATION_FOR: Record<string, string> = {
  Proprietorship: "Proprietor",
  Partnership: "Partner",
  "Private Limited": "Director",
  Limited: "Director",
  LLP: "Designated Partner",
}

function titleOf(id: PartnerStepId): string {
  return PARTNER_ONBOARDING_STEPS[id - 1]?.title ?? `Step ${id}`
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // ── identity & OTP ──────────────────────────────────────────────────────
  const [mobileNumber, setMobileNumberRaw] = useState("")
  const [isMobileVerified, setIsMobileVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState<string[]>(EMPTY_OTP)
  const [otpTimer, setOtpTimer] = useState(50)
  const [canResend, setCanResend] = useState(false)
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [mobileError, setMobileErrorRaw] = useState<string | null>(null)
  const [mobileErrorKind, setMobileErrorKind] = useState<ErrorKind>("validation")
  const [eligibility, setEligibility] = useState<EligibilityBlock | null>(null)
  const autoVerifiedRef = useRef("")
  const otpLockedOut = otpAttempts >= MAX_OTP_ATTEMPTS

  // ── the form ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM)
  const patch = useCallback((partial: Partial<OnboardingForm>) => {
    setForm(prev => ({ ...prev, ...partial }))
  }, [])

  // ── navigation & messaging ──────────────────────────────────────────────
  const [step, setStep] = useState<PartnerStepId>(1)
  const [saving, setSaving] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [stepError, setStepErrorRaw] = useState<string | null>(null)
  const [stepErrorKind, setStepErrorKind] = useState<ErrorKind>("validation")
  const [invalidField, setInvalidField] = useState<string | null>(null)
  const [restoredNote, setRestoredNote] = useState<string | null>(null)
  const [draftConflict, setDraftConflict] = useState<DraftConflict | null>(null)

  // ── per-step transient state ────────────────────────────────────────────
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeAreas, setPincodeAreas] = useState<string[]>([])
  const [pincodeNote, setPincodeNote] = useState<string | null>(null)
  const [gstVerifying, setGstVerifying] = useState(false)
  const [panVerifying, setPanVerifying] = useState(false)
  const [panNote, setPanNote] = useState<string | null>(null)
  const [aadhaarRef, setAadhaarRef] = useState<string | null>(null)
  const [aadhaarSending, setAadhaarSending] = useState(false)
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false)
  const [digilockerLoading, setDigilockerLoading] = useState(false)
  const [ifscLoading, setIfscLoading] = useState(false)
  const [ifscValid, setIfscValid] = useState(false)
  const [ifscNote, setIfscNote] = useState<string | null>(null)
  const [bankVerifying, setBankVerifying] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<DocKey, number>>>({})
  const [uploadFailed, setUploadFailed] = useState<DocKey | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState<DocKey | null>(null)
  const lastPickedFile = useRef<Partial<Record<DocKey, File>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)

  // ── outcome ─────────────────────────────────────────────────────────────
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [application, setApplication] = useState<Record<string, any> | null>(null)

  const setStepError = useCallback((message: string | null, kind: ErrorKind = "validation") => {
    setStepErrorKind(kind)
    setStepErrorRaw(message)
    if (!message) setInvalidField(null)
  }, [])

  const setMobileError = useCallback((message: string | null, kind: ErrorKind = "validation") => {
    setMobileErrorKind(kind)
    setMobileErrorRaw(message)
  }, [])

  /**
   * Report a validation failure and put the partner in front of the field it is
   * about. Browsers only do this for native constraint validation; every rule
   * on this form is custom, so without it the message appears at the top of the
   * step and the offending field stays offscreen.
   */
  const rejectField = useCallback((fieldId: string | null, message: string) => {
    setStepErrorKind("validation")
    setStepErrorRaw(message)
    setInvalidField(fieldId)
    if (!fieldId) return
    // After paint, so the reserved error region already has its height.
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId)
      if (!el) return
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.focus({ preventScroll: true })
    })
  }, [])

  // ── completion & gating ─────────────────────────────────────────────────

  const stepDone = useMemo<Record<PartnerStepId, boolean>>(() => {
    const derived = partnerStepCompletion(toApplicationShape(form, mobileNumber))
    const outcomeStatus = String(application?.status || "").toLowerCase()
    return {
      ...derived,
      // Before submission "done" means ready to submit; `partnerStepCompletion`
      // can only see the submitted flag, which by definition is not set yet.
      3: isSubmitted || Boolean(form.agreementSigned && form.declareTruth && form.declareTerms),
    }
  }, [form, mobileNumber, isSubmitted, application])

  const completedCount = useMemo(
    () => PARTNER_ONBOARDING_STEPS.filter(s => stepDone[s.id as PartnerStepId]).length,
    [stepDone]
  )

  const lockReason = useCallback(
    (id: PartnerStepId): string | null => {
      if (!isMobileVerified) return "Verify your mobile number first — the application is keyed to it."
      /*
       * Submission is the point of no return. The server rejects writes to a
       * submitted application, so the seven input steps stop being places you
       * can go rather than places that quietly fail to save, and the status
       * screen opens regardless of what the completion predicates think — the
       * application is out of the partner's hands either way.
       */
      if (isSubmitted) {
        return id === 3 ? null : "This application has been submitted and is locked for review."
      }
      if (id === 3 && (!stepDone[1] || !stepDone[2])) {
        return "Complete step 1 and step 2 first before reviewing."
      }
      for (let earlier = 1 as PartnerStepId; earlier < id; earlier++) {
        if (!stepDone[earlier as PartnerStepId]) {
          return `Finish step ${earlier} — ${titleOf(earlier as PartnerStepId)} — first.`
        }
      }
      return null
    },
    [isMobileVerified, isSubmitted, stepDone]
  )

  // Where each step was left, so moving between them is not a jump to a random
  // scroll offset.
  const scrollByStep = useRef<Record<number, number>>({})
  const pendingFocusStep = useRef<PartnerStepId | null>(null)
  /*
   * The popstate listener is registered once and must not be torn down and
   * rebuilt on every keystroke, so it reads the current gate through a ref
   * rather than closing over it. Written in an effect, not during render.
   */
  const lockReasonRef = useRef(lockReason)
  useEffect(() => {
    lockReasonRef.current = lockReason
  }, [lockReason])

  const goToStep = useCallback(
    (next: PartnerStepId) => {
      scrollByStep.current[step] = typeof window === "undefined" ? 0 : window.scrollY
      pendingFocusStep.current = next
      setStepError(null)
      setStep(next)
      /*
       * Push the step so Back returns to the previous one. Without this the
       * whole flow is a single history entry and Android's system back gesture
       * — which is not an affordance we can restyle or intercept — drops the
       * partner out of the form entirely.
       */
      if (typeof window !== "undefined") {
        window.history.pushState({ onboardingStep: next }, "", `#step-${next}`)
      }
    },
    [step, setStepError]
  )

  const back = useCallback(() => {
    if (step > 1) goToStep((step - 1) as PartnerStepId)
  }, [step, goToStep])

  // ── restoring a draft ───────────────────────────────────────────────────

  const loadDraft = useCallback(
    async (mob: string) => {
      const localMeta = OnboardingStorage.getDraftMeta()
      const localDraft = OnboardingStorage.getDraft(mob)
      if (localMeta.expired) {
        setRestoredNote(
          "Your saved draft on this device had expired and was cleared. Anything you completed earlier is still on your account."
        )
      }

      let merged = hydrateForm(EMPTY_FORM, localDraft)
      setForm(merged)

      // The server record is authoritative: it carries progress made on any
      // device, so a partner resumes at the same step after a logout or a
      // browser change, not just after a refresh.
      setResuming(true)
      try {
        const res = await fetchWithTimeout(`/api/onboarding/resume?mobile=${mob}`)
        const data = await res.json()
        if (!res.ok || !data.found || !data.draft) return

        const d = data.draft
        merged = hydrateForm(merged, d)
        setForm(merged)
        if (d.bankDetails?.ifsc) setIfscValid(IFSC_RE.test(String(d.bankDetails.ifsc).toUpperCase()))

        if (d.isSubmitted || d.isApplicationLocked) {
          setIsSubmitted(true)
          setApplicationId(d.applicationId || `TSM-DSA-${mob}`)
          setApplication(d)
          setStep(3)
          return
        }

        /*
         * Reconciliation. Both drafts have been merged into the same form,
         * server last, so the server copy is what is on screen. That is the
         * right default — it is the record the application is built from, and
         * it carries progress made on other devices. But when this device got
         * further, saying nothing means silently discarding work the partner
         * can remember doing, so the disagreement is shown.
         */
        const serverStep = firstIncompletePartnerStep(d)
        const localStep =
          localMeta.currentStep && localMeta.currentStep >= 1 && localMeta.currentStep <= 3
            ? (localMeta.currentStep as PartnerStepId)
            : null

        setStep(serverStep)

        if (localStep && localMeta.savedAt && localStep !== serverStep) {
          setDraftConflict({
            localStep,
            serverStep,
            localSavedAt: localMeta.savedAt,
            applied: "server",
          })
        } else if (serverStep > 1) {
          setRestoredNote(
            `Picked up where you left off — step ${serverStep} of 3, ${titleOf(serverStep).toLowerCase()}.`
          )
        }

        OnboardingStorage.saveDraft({
          mobileNumber: mob,
          isMobileVerified: true,
          currentStep: serverStep,
          currentStepKey: data.currentStepKey,
        })
      } catch (e) {
        console.error("[onboarding] resume draft failed", { mobile: mob, error: describeError(e) })
        const kind = classifyError(e)
        setStepError(
          messageForKind(
            kind,
            "Could not load your saved application. Anything on this device is still here — refresh to try again."
          ),
          kind
        )
      } finally {
        setResuming(false)
      }
    },
    [setStepError]
  )

  /*
   * Auto-restore the session from the local draft, on mount only.
   *
   * This has to be an effect rather than lazy `useState` initialisers:
   * /onboarding is prerendered, `localStorage` does not exist on the server,
   * and seeding state from it during the first render would produce markup
   * that does not match the HTML React is hydrating.
   */
  useEffect(() => {
    const savedMobile = OnboardingStorage.getSavedMobile()
    if (savedMobile && OnboardingStorage.isVerified()) {
      /* eslint-disable react-hooks/set-state-in-effect -- see above: hydration */
      setMobileNumberRaw(savedMobile)
      setIsMobileVerified(true)
      /* eslint-enable react-hooks/set-state-in-effect */
      void loadDraft(savedMobile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── OTP flow ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return
    const timer = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [otpSent, otpTimer])

  /**
   * Editing a verified number invalidates the verification rather than silently
   * keeping it. The application is keyed by mobile number, so carrying a
   * verified flag onto a different number would attach the KYC to the wrong
   * account.
   */
  const setMobileNumber = useCallback(
    (raw: string) => {
      const next = raw.replace(/\D/g, "").slice(0, 10)
      setMobileNumberRaw(next)
      setMobileError(null)
      if (isMobileVerified && next !== OnboardingStorage.getSavedMobile()) {
        setIsMobileVerified(false)
        setOtpSent(false)
        setOtpValues(EMPTY_OTP)
        setOtpAttempts(0)
        autoVerifiedRef.current = ""
        setMobileError("You changed the number, so it needs verifying again. Your answers are still here.", "info")
      }
    },
    [isMobileVerified, setMobileError]
  )

  const applyEligibility = useCallback((data: any): boolean => {
    if (data.reason === "ALREADY_APPROVED") {
      setEligibility({
        reason: "ALREADY_APPROVED",
        message: data.message || "You are already an approved DSA Partner.",
        marathiMessage:
          data.marathiMessage || "हा नंबर आधीच अधिकृत DSA Partner म्हणून मंजूर आहे! कृपया थेट लॉगिन करा.",
        redirectUrl: data.redirectUrl || "/partner/login",
        actionText: "Go to Partner Login (लॉगिन करा) →",
      })
      return true
    }
    if (data.reason === "ALREADY_SUBMITTED") {
      setEligibility({
        reason: "ALREADY_SUBMITTED",
        message: data.message || "Your application has already been submitted.",
        marathiMessage:
          data.marathiMessage || "तुमचा DSA Partner अर्ज आधीच सबमिट झालेला असून तो पडताळणी अंतर्गत आहे.",
        redirectUrl: data.redirectUrl || `/application-status?id=${data.applicationId || ""}`,
        actionText: "Track Application Status (स्टेटस तपासा) →",
      })
      return true
    }
    if (data.reason === "BLOCKED") {
      setEligibility({
        reason: "BLOCKED",
        message: data.message || "This mobile number is not eligible for onboarding.",
        marathiMessage:
          data.marathiMessage || "हा मोबाईल नंबर नवीन पार्टनर नोंदणीसाठी पात्र नाही. कृपया सपोर्टशी संपर्क साधा.",
        redirectUrl: "tel:09579005645",
        actionText: "Call Partner Support (095790 05645)",
      })
      return true
    }
    return false
  }, [])

  const sendOtp = useCallback(async () => {
    if (!MOBILE_RE.test(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit mobile number.")
      return
    }
    setSendingOtp(true)
    setMobileError(null)
    setEligibility(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      })
      const data = await res.json()
      if (!res.ok || data.eligible === false) {
        if (applyEligibility(data)) return
        throw new Error(data.error || "Failed to send OTP")
      }
      setOtpSent(true)
      setOtpTimer(50)
      setCanResend(false)
      setOtpValues(EMPTY_OTP)
      setOtpAttempts(0)
      autoVerifiedRef.current = ""
    } catch (err) {
      console.error("[onboarding] send OTP failed", { mobile: mobileNumber, error: describeError(err) })
      const kind = classifyError(err)
      setMobileError(messageForKind(kind, messageFor(err, "Unable to send verification OTP.")), kind)
    } finally {
      setSendingOtp(false)
    }
  }, [mobileNumber, applyEligibility, setMobileError])

  const resendOtp = useCallback(async () => {
    if (!canResend || resendingOtp) return
    setResendingOtp(true)
    setMobileError(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      })
      const data = await res.json()
      if (res.status === 429) {
        throw new Error(
          data.error || "Too many code requests. Please wait a few minutes before asking for another one."
        )
      }
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP")
      setOtpTimer(50)
      setCanResend(false)
      setOtpValues(EMPTY_OTP)
      // A new code means a clean slate: the old attempts were against a code
      // that no longer exists.
      setOtpAttempts(0)
      autoVerifiedRef.current = ""
    } catch (err) {
      console.error("[onboarding] resend OTP failed", { mobile: mobileNumber, error: describeError(err) })
      const kind = classifyError(err)
      setMobileError(messageForKind(kind, messageFor(err, "Failed to resend OTP.")), kind)
    } finally {
      setResendingOtp(false)
    }
  }, [canResend, resendingOtp, mobileNumber, setMobileError])

  const verifyOtp = useCallback(async () => {
    const code = otpValues.join("")
    if (code.length < 6) {
      setMobileError("Please enter the complete 6-digit OTP code.")
      return
    }
    setVerifyingOtp(true)
    setMobileError(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, otp: code }),
      })
      const data = await res.json()

      /*
       * Wrong, expired and rate-limited are three different problems with three
       * different next actions — retype, request a new code, wait — and
       * collapsing them into "Invalid OTP" leaves the partner retyping a code
       * that can never work. The server distinguishes them; so does this.
       */
      if (!res.ok) {
        const reason = String(data.reason || data.code || "").toUpperCase()
        const raw = String(data.error || "")
        if (res.status === 429 || reason.includes("RATE") || reason.includes("TOO_MANY")) {
          throw new Error(
            data.error || "Too many attempts on this number. Please wait a few minutes before trying again."
          )
        }
        if (reason.includes("EXPIRE") || /expir/i.test(raw)) {
          throw new Error("That code has expired. Use Resend OTP on WhatsApp to get a fresh one.")
        }
        // Anything left is a wrong code, and that is the one worth counting.
        setOtpAttempts(prev => prev + 1)
        const left = MAX_OTP_ATTEMPTS - (otpAttempts + 1)
        throw new Error(
          left > 0
            ? "Invalid OTP code. Please check the 6-digit code sent on WhatsApp and try again."
            : "Maximum attempts exceeded. Please request a new OTP code to continue."
        )
      }

      setIsMobileVerified(true)
      setOtpSent(false)
      setOtpAttempts(0)
      OnboardingStorage.saveDraft({ mobileNumber, isMobileVerified: true })
      await loadDraft(mobileNumber)
    } catch (err: any) {
      console.error("[onboarding] verify OTP failed", { mobile: mobileNumber, error: describeError(err) })
      // Keep autoVerifiedRef.current = code so the effect does NOT auto-retry the exact same failed code!
      const kind = classifyError(err)
      setMobileError(messageForKind(kind, err?.message || "Failed to verify OTP."), kind)
    } finally {
      setVerifyingOtp(false)
    }
  }, [otpValues, mobileNumber, otpAttempts, loadDraft, setMobileError])

  const setOtpDigit = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    autoVerifiedRef.current = ""
    setOtpValues(prev => {
      const next = [...prev]
      next[index] = value.slice(-1)
      return next
    })
  }, [])

  const pasteOtp = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 6)
    if (!digits) return
    autoVerifiedRef.current = ""
    const next = [...EMPTY_OTP]
    digits.split("").forEach((d, i) => {
      next[i] = d
    })
    setOtpValues(next)
  }, [])

  // Auto-submit as soon as all six digits are present.
  useEffect(() => {
    const code = otpValues.join("")
    if (!otpSent || isMobileVerified || verifyingOtp || otpLockedOut) return
    if (code.length !== 6 || autoVerifiedRef.current === code) return
    autoVerifiedRef.current = code
    void verifyOtp()
  }, [otpValues, otpSent, isMobileVerified, verifyingOtp, otpLockedOut, verifyOtp])

  const resetMobile = useCallback(() => {
    OnboardingStorage.clearDraft()
    autoVerifiedRef.current = ""
    setMobileNumberRaw("")
    setIsMobileVerified(false)
    setOtpSent(false)
    setOtpValues(EMPTY_OTP)
    setOtpAttempts(0)
    setMobileError(null)
    setRestoredNote(null)
    setDraftConflict(null)
    setEligibility(null)
    setForm(EMPTY_FORM)
    setIsSubmitted(false)
    setApplicationId(null)
    setApplication(null)
    setStep(1)
  }, [setMobileError])

  /**
   * Discard the local draft without touching the server record. The point is
   * the PII: on a shared or kiosk machine this is how a partner leaves without
   * their details sitting in the next person's devtools.
   */
  const discardLocalDraft = useCallback(() => {
    OnboardingStorage.clearDraft()
    setRestoredNote(null)
    setDraftConflict(null)
    window.location.reload()
  }, [])

  const preferLocalDraft = useCallback(() => {
    if (!draftConflict) return
    goToStep(draftConflict.localStep as PartnerStepId)
    setDraftConflict({ ...draftConflict, applied: "local" })
  }, [draftConflict, goToStep])

  const dismissDraftConflict = useCallback(() => setDraftConflict(null), [])

  // ── history & focus ─────────────────────────────────────────────────────

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const target = (e.state as { onboardingStep?: number } | null)?.onboardingStep
      if (!target || target < 1 || target > 3) return
      if (lockReasonRef.current(target as PartnerStepId)) return
      pendingFocusStep.current = target as PartnerStepId
      setStepErrorRaw(null)
      setStep(target as PartnerStepId)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Seed the first history entry once the flow is open, so the very first Back
  // leaves /onboarding rather than replaying step 1.
  useEffect(() => {
    if (!isMobileVerified) return
    if ((window.history.state as { onboardingStep?: number } | null)?.onboardingStep) return
    window.history.replaceState({ onboardingStep: step }, "", `#step-${step}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileVerified])

  useEffect(() => {
    if (!isMobileVerified) return
    window.scrollTo({ top: scrollByStep.current[step] ?? 0, behavior: "auto" })
    if (pendingFocusStep.current !== step) return
    pendingFocusStep.current = null
    // Only steal focus for a step the partner navigated to, never on the first
    // paint of a resumed draft — that would scroll past the "here is what we
    // restored" notice they need to read.
    requestAnimationFrame(() => {
      const pane = document.getElementById("onboarding-step-pane")
      const first = pane?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])"
      )
      first?.focus({ preventScroll: true })
    })
  }, [step, isMobileVerified])

  // Designation follows the entity type unless the partner has typed their own.
  const designationTouched = useRef(false)
  useEffect(() => {
    if (designationTouched.current) return
    const next = form.partnerType === "Individual" ? "Individual" : DESIGNATION_FOR[form.firmType] || "Authorised Signatory"
    setForm(prev => (prev.designation === next ? prev : { ...prev, designation: next }))
  }, [form.partnerType, form.firmType])

  // ── saving ──────────────────────────────────────────────────────────────

  const validateStep = useCallback(
    (id: PartnerStepId): { field: string | null; message: string } | null => {
      const f = form
      switch (id) {
        case 1:
          // Personal & Business Details (formerly steps 1, 2, 3)
          if (f.fullName.trim().length < 2)
            return { field: "ob-fullName", message: "Enter your full name exactly as printed on your PAN card." }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
            return { field: "ob-email", message: "Enter a valid email address — this is where your partner ID is sent." }
          if (f.partnerType === "Firm" && f.businessName.trim().length < 2)
            return { field: "ob-businessName", message: "Enter the registered name of your firm or company." }
          if (!f.designation.trim())
            return { field: "ob-designation", message: "Tell us your role in the business." }
          if (f.isGstRegistered === "Yes" && !GSTIN_RE.test(f.gstin.trim().toUpperCase()))
            return { field: "ob-gstin", message: "Enter a valid 15-character GSTIN, or answer No to the GST question." }
          if (f.alternateMobile.trim() && !MOBILE_RE.test(f.alternateMobile.trim()))
            return { field: "ob-alternateMobile", message: "That alternate number is not a valid 10-digit mobile number." }
          if (f.addressLine1.trim().length < 2)
            return { field: "ob-addressLine1", message: "Address line 1 is required." }
          if (!f.city.trim()) return { field: "ob-city", message: "City is required." }
          if (!f.stateName.trim()) return { field: "ob-stateName", message: "State is required." }
          if (!PINCODE_RE.test(f.pinCode.trim()))
            return { field: "ob-pinCode", message: "A 6-digit PIN code is required." }
          return null
        case 2: {
          // KYC, Bank & Documents (formerly steps 4, 5, 6)
          if (!PAN_RE.test(f.panNumber.trim().toUpperCase()))
            return { field: "ob-panNumber", message: "Enter a valid 10-character PAN number (for example ABCDE1234F)." }
          if (!f.dob) return { field: "ob-dob", message: "Date of birth is required." }
          const age = ageFromDob(f.dob)
          if (age === null) return { field: "ob-dob", message: "That date of birth could not be read." }
          if (age < 18 || age > 80)
            return { field: "ob-dob", message: "A DSA partner must be between 18 and 80 years old." }
          if (!/^\d{6,20}$/.test(f.accountNumber.trim()))
            return { field: "ob-accountNumber", message: "Enter a valid bank account number — commission payouts go here." }
          if (f.accountNumber.trim() !== f.confirmAccountNumber.trim())
            return { field: "ob-confirmAccountNumber", message: "The two account numbers do not match." }
          if (!IFSC_RE.test(f.ifsc.trim().toUpperCase()))
            return { field: "ob-ifsc", message: "Enter a valid 11-character IFSC code." }
          if (!f.accountHolderName.trim())
            return { field: "ob-verify-bank-btn", message: "Please verify your bank account to auto-populate the account holder name." }
          if (!f.documents.panDoc) return { field: "ob-doc-panDoc", message: "Upload a scan or photo of your PAN card." }
          if (!f.documents.aadhaarFrontDoc)
            return { field: "ob-doc-aadhaarFrontDoc", message: "Upload the front of your Aadhaar card." }
          if (!f.aadhaarCombined && !f.documents.aadhaarBackDoc)
            return {
              field: "ob-doc-aadhaarBackDoc",
              message: "Upload the back of your Aadhaar card, or tick “both sides are on one file”.",
            }
          return null
        }
        case 3:
          // Review & Submit (formerly step 7)
          if (!f.agreementSigned)
            return { field: "ob-agreement", message: "Sign the partner MOU with an OTP before submitting." }
          if (!f.declareTruth || !f.declareTerms)
            return { field: "ob-declarations", message: "Please tick both confirmations before submitting." }
          return null
        default:
          return null
      }
    },
    [form]
  )

  const persistStep = useCallback(
    async (id: PartnerStepId): Promise<boolean> => {
      const payload = payloadForStep(id, form)
      OnboardingStorage.saveDraft({ ...payload, mobileNumber, isMobileVerified: true, currentStep: id })
      setSaving(true)
      setStepError(null)
      try {
        const res = await fetchWithTimeout("/api/onboarding/save-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobileNumber, step: id, stepData: payload }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to save your progress.")
        return true
      } catch (err) {
        console.error("[onboarding] save step failed", { step: id, mobile: mobileNumber, error: describeError(err) })
        const kind = classifyError(err)
        // Nothing is cleared here: the form keeps every answer so the partner
        // can press Continue again once they are back online.
        setStepError(messageForKind(kind, messageFor(err, "Failed to save progress. Please try again.")), kind)
        return false
      } finally {
        setSaving(false)
      }
    },
    [form, mobileNumber, setStepError]
  )

  /**
   * True when the PAN cannot be used — the partner has been told why and the
   * field has focus. A provider or network failure is not a clash: it must not
   * block the step, because the same check runs again server-side at submit.
   */
  const checkPanAvailable = useCallback(async (): Promise<boolean> => {
    const pan = form.panNumber.trim().toUpperCase()
    if (!PAN_RE.test(pan)) return false
    setSaving(true)
    try {
      const res = await fetchWithTimeout("/api/onboarding/pan/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber: pan, mobileNumber }),
      })
      const data = await res.json()
      if (data?.isDuplicate) {
        rejectField("ob-panNumber", data.error || "That PAN is already registered with another partner account.")
        return true
      }
      return false
    } catch (err) {
      console.warn("[onboarding] PAN availability check unavailable", describeError(err))
      return false
    } finally {
      setSaving(false)
    }
  }, [form.panNumber, mobileNumber, rejectField])

  const saveAndContinue = useCallback(async () => {
    if (step > LAST_INPUT_STEP) return
    const problem = validateStep(step)
    if (problem) {
      rejectField(problem.field, problem.message)
      return
    }
    // Step 3 is not a save-and-continue, it is the submission — handled by submitApplication.
    if (step === LAST_INPUT_STEP) return

    /*
     * A PAN already attached to another partner is a hard stop, and finding
     * that out at submission — after the documents and the bank account and
     * the MOU — is the worst possible moment. Verifying is optional, so this
     * runs on the way out of the KYC step whether they pressed it or not.
     */
    if (step === 2 && !form.panVerified) {
      const clash = await checkPanAvailable()
      if (clash) return
    }

    const ok = await persistStep(step)
    if (!ok) return

    goToStep((step + 1) as PartnerStepId)
  }, [step, validateStep, rejectField, checkPanAvailable, persistStep, goToStep])

  // ── step 3: pincode ─────────────────────────────────────────────────────

  const lookupPincode = useCallback(async (pin: string) => {
    const clean = pin.replace(/\D/g, "")
    if (clean.length !== 6) {
      setPincodeAreas([])
      return
    }
    setPincodeLoading(true)
    setPincodeNote(null)
    try {
      const res = await fetchWithTimeout(`https://api.postalpincode.in/pincode/${clean}`)
      /*
       * A 5xx from the postal API returns an HTML error body, so without this
       * check `data[0]` is undefined, the success branch quietly does not run,
       * and the partner watches the spinner stop with City and State still
       * empty and nothing telling them why. They can always type the address by
       * hand — so this is a note, not a blocking error.
       */
      if (!res.ok) throw new Error(`Pincode lookup returned ${res.status}`)
      const data = await res.json()
      const offices: { Name?: string; District?: string; Block?: string; State?: string }[] = data?.[0]?.PostOffice || []
      if (data?.[0]?.Status !== "Success" || offices.length === 0) {
        setPincodeNote("We could not find that PIN code. Please fill in City and State yourself.")
        return
      }
      const areas = [...new Set(offices.map(o => o.Name).filter((n): n is string => Boolean(n)))]
      setPincodeAreas(areas)
      setForm(prev => ({
        ...prev,
        city: offices[0].District || offices[0].Block || prev.city,
        district: offices[0].District || prev.district,
        stateName: offices[0].State || prev.stateName,
        area: areas.length === 1 ? areas[0] : prev.area,
      }))
    } catch (err) {
      console.error("[onboarding] pincode lookup failed", { pincode: clean, error: describeError(err) })
      setPincodeNote("Could not look up that PIN code just now — please type City and State yourself.")
    } finally {
      setPincodeLoading(false)
    }
  }, [])

  // ── step 2: GST ─────────────────────────────────────────────────────────

  const verifyGst = useCallback(async () => {
    setStepError(null)
    const gstin = form.gstin.trim().toUpperCase()
    if (!GSTIN_RE.test(gstin)) {
      patch({ gstValid: false })
      rejectField("ob-gstin", "Enter a valid 15-character GSTIN (for example 27ABCDE1234F1Z5).")
      return
    }
    setGstVerifying(true)
    try {
      const res = await fetchWithTimeout("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-gst", payload: { gstin } }),
      })
      const data = await res.json()
      if (!res.ok || (data.code && data.code !== 200) || data.error) {
        const detail = String(data.message || data.error || "")
        if (isProviderOutage(res.status, detail)) throw new ProviderOutage(detail)
        throw new Error(detail || "GSTIN verification failed. Please check the GST number.")
      }
      const record = data.data?.data || data.data
      if (!record) throw new Error("No record found for this GSTIN.")

      const legalName = record.lgnm || ""
      const tradeName = record.tradeNam || legalName
      const addr = record.pradr?.addr || {}
      const formattedAddress = [addr.bno, addr.bnm, addr.flno, addr.st, addr.loc || addr.locality, addr.dst, addr.stcd, addr.pncd]
        .filter(Boolean)
        .join(", ")

      setForm(prev => ({
        ...prev,
        gstin,
        gstValid: true,
        gstDetails: {
          gstin,
          legalName,
          tradeName,
          constitution: record.ctb || "",
          status: record.sts || "Active",
          address: formattedAddress,
          pincode: addr.pncd || "",
          state: addr.stcd || "",
          district: addr.dst || "",
        },
        businessName: prev.businessName || tradeName || legalName,
        // The GST address is the registered place of business; offer it as the
        // office address only when the partner has not typed one.
        addressLine1: prev.addressLine1 || formattedAddress,
        city: prev.city || addr.dst || "",
        stateName: prev.stateName || addr.stcd || "",
        pinCode: prev.pinCode || addr.pncd || "",
      }))
    } catch (err) {
      console.error("[onboarding] GST verification failed", { gstin, error: describeError(err) })
      patch({ gstValid: false, gstDetails: null })
      if (err instanceof ProviderOutage) {
        // Step 2 only requires a well-formed GSTIN, never a verified one, so
        // this is a note about the service — not a fault in what they typed.
        setStepError(PROVIDER_UNAVAILABLE, "network")
        return
      }
      const kind = classifyError(err)
      setStepError(messageForKind(kind, messageFor(err, "Failed to verify GSTIN.")), kind)
    } finally {
      setGstVerifying(false)
    }
  }, [form.gstin, patch, rejectField, setStepError])

  // ── step 4: PAN, Aadhaar & DigiLocker ───────────────────────────────────

  const verifyPan = useCallback(async () => {
    setStepError(null)
    setPanNote(null)
    const pan = form.panNumber.trim().toUpperCase()
    if (!PAN_RE.test(pan)) {
      rejectField("ob-panNumber", "Enter a valid 10-character PAN number (for example ABCDE1234F).")
      return
    }
    setPanVerifying(true)
    try {
      // Ours first: a PAN already attached to a different partner is a hard
      // stop, and finding that out before calling the KYC provider is both
      // faster and cheaper.
      const dupRes = await fetchWithTimeout("/api/onboarding/pan/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber: pan, mobileNumber }),
      })
      const dup = await dupRes.json()
      if (!dupRes.ok || dup.valid === false) {
        patch({ panVerified: false })
        rejectField("ob-panNumber", dup.error || "That PAN could not be used for this application.")
        return
      }

      const name = form.partnerType === "Individual" ? form.fullName.trim() : form.contactPersonName.trim() || form.fullName.trim()
      const res = await fetchWithTimeout("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-pan",
          payload: { pan_number: pan, name_as_per_pan: name, date_of_birth: form.dob },
        }),
      })
      const data = await res.json()
      const record = data?.data?.data || data?.data || {}
      const status = String(record.status || record.pan_status || "").toLowerCase()

      if (!res.ok || (data.code && data.code !== 200)) {
        const detail = String(data.message || data.error || "")
        if (isProviderOutage(res.status, detail)) throw new ProviderOutage(detail)
        throw new Error(detail || "PAN verification could not be completed.")
      }

      const nameMatch = record.name_as_per_pan_match ?? record.name_match
      const dobMatch = record.date_of_birth_match ?? record.dob_match

      setForm(prev => ({
        ...prev,
        panNumber: pan,
        panVerified: true,
        panDetails: { status: record.status || record.pan_status || "valid", nameMatch, dobMatch, category: record.category },
      }))

      if (nameMatch === false) {
        setPanNote("PAN is valid, but the name on it does not match what you entered. Check the spelling against the card.")
      } else if (dobMatch === false) {
        setPanNote("PAN is valid, but the date of birth does not match the card. Check it before continuing.")
      } else if (status && status !== "valid" && status !== "active") {
        setPanNote(`The income-tax department reports this PAN as “${record.status || record.pan_status}”.`)
      } else {
        setPanNote("PAN verified against the income-tax department.")
      }
    } catch (err) {
      console.error("[onboarding] PAN verification failed", { error: describeError(err) })
      patch({ panVerified: false })
      // The format is already checked and duplicates are already ruled out, so
      // a failure here must not block the step — say so plainly and move on.
      if (err instanceof ProviderOutage) {
        setPanNote(PROVIDER_UNAVAILABLE)
        return
      }
      const kind = classifyError(err)
      setPanNote(
        messageForKind(
          kind,
          messageFor(err, "We could not reach the PAN check just now. You can continue and we will verify it during review.")
        )
      )
    } finally {
      setPanVerifying(false)
    }
  }, [form.panNumber, form.partnerType, form.fullName, form.contactPersonName, form.dob, mobileNumber, patch, rejectField, setStepError])

  const sendAadhaarOtp = useCallback(
    async (aadhaarNumber: string) => {
      setStepError(null)
      const clean = aadhaarNumber.replace(/\D/g, "")
      if (!AADHAAR_RE.test(clean)) {
        rejectField("ob-aadhaarNumber", "Enter your 12-digit Aadhaar number.")
        return
      }
      setAadhaarSending(true)
      try {
        const res = await fetchWithTimeout("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send-aadhaar-otp", payload: { aadhaar_number: clean } }),
        })
        const data = await res.json()
        const referenceId = data?.data?.reference_id || data?.reference_id
        if (!res.ok || !referenceId) {
          const detail = String(data.message || data.error || "")
          if (isProviderOutage(res.status, detail)) throw new ProviderOutage(detail)
          throw new Error(detail || "Could not send an OTP to the mobile linked with that Aadhaar.")
        }
        setAadhaarRef(String(referenceId))
        // Only the last four are kept; the full number never reaches our store.
        patch({ aadhaarLast4: clean.slice(-4) })
      } catch (err) {
        console.error("[onboarding] Aadhaar OTP send failed", { error: describeError(err) })
        if (err instanceof ProviderOutage) {
          // Aadhaar is optional in step 4; an outage costs nothing but speed.
          setStepError(PROVIDER_UNAVAILABLE, "network")
          return
        }
        const kind = classifyError(err)
        setStepError(messageForKind(kind, messageFor(err, "Could not start Aadhaar verification.")), kind)
      } finally {
        setAadhaarSending(false)
      }
    },
    [patch, rejectField, setStepError]
  )

  const verifyAadhaarOtp = useCallback(
    async (otp: string) => {
      if (!aadhaarRef) return
      setStepError(null)
      setAadhaarVerifying(true)
      try {
        const res = await fetchWithTimeout("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify-aadhaar-otp", payload: { reference_id: aadhaarRef, otp } }),
        })
        const data = await res.json()
        const record = data?.data?.data || data?.data || {}
        if (!res.ok || (data.code && data.code !== 200)) {
          const detail = String(data.message || data.error || "")
          if (isProviderOutage(res.status, detail)) throw new ProviderOutage(detail)
          throw new Error(detail || "That Aadhaar OTP was not accepted.")
        }
        setForm(prev => ({
          ...prev,
          aadhaarVerified: true,
          aadhaarName: record.name || record.full_name || prev.aadhaarName,
        }))
        setAadhaarRef(null)
      } catch (err) {
        console.error("[onboarding] Aadhaar OTP verify failed", { error: describeError(err) })
        if (err instanceof ProviderOutage) {
          setStepError(PROVIDER_UNAVAILABLE, "network")
          return
        }
        const kind = classifyError(err)
        setStepError(messageForKind(kind, messageFor(err, "Aadhaar verification failed.")), kind)
      } finally {
        setAadhaarVerifying(false)
      }
    },
    [aadhaarRef, setStepError]
  )

  const cancelAadhaarOtp = useCallback(() => setAadhaarRef(null), [])

  const startDigilocker = useCallback(async () => {
    setStepError(null)
    setDigilockerLoading(true)
    try {
      const res = await fetchWithTimeout("/api/digilocker/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, redirectUrl: `${window.location.origin}/onboarding#step-4` }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorizationUrl) {
        const detail = String(data.error || "")
        if (isProviderOutage(res.status, detail)) throw new ProviderOutage(detail)
        throw new Error(detail || "Could not open DigiLocker just now.")
      }
      window.location.href = data.authorizationUrl
    } catch (err) {
      console.error("[onboarding] DigiLocker initiate failed", { error: describeError(err) })
      // Either way the answer is the same: upload the documents by hand in
      // step 6, which is the path most partners take anyway.
      patch({ docUploadMethod: "manual" })
      if (err instanceof ProviderOutage) {
        setStepError(
          "DigiLocker is unavailable right now. Switched you to manual upload — you can attach your documents in step 6.",
          "network"
        )
        return
      }
      const kind = classifyError(err)
      setStepError(
        messageForKind(kind, messageFor(err, "Could not open DigiLocker. You can upload your documents manually instead.")),
        kind
      )
    } finally {
      setDigilockerLoading(false)
    }
  }, [mobileNumber, patch, setStepError])

  // ── step 5: bank ────────────────────────────────────────────────────────

  const lookupIfsc = useCallback(async (code: string) => {
    const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11)
    if (clean.length !== 11) {
      setIfscValid(false)
      return
    }
    setIfscLoading(true)
    try {
      const res = await fetchWithTimeout(`/api/onboarding/ifsc?code=${clean}`)
      const data = await res.json()
      if (res.ok && data.valid) {
        const bank = data.bank || data.details?.BANK || ""
        const branch = data.branch || data.details?.BRANCH || ""
        setForm(prev => ({ ...prev, bankName: bank, branchName: branch }))
        setIfscValid(true)
        setIfscNote(null)
      } else {
        setIfscValid(false)
        setIfscNote("We could not match that IFSC code. Check it against your passbook or cheque.")
      }
    } catch (err) {
      console.error("[onboarding] IFSC lookup failed", { ifsc: clean, error: describeError(err) })
      setIfscValid(false)
      setIfscNote("Could not look up that IFSC just now — check your connection and re-enter it.")
    } finally {
      setIfscLoading(false)
    }
  }, [])

  const verifyBank = useCallback(async () => {
    setStepError(null)
    const account = form.accountNumber.trim()
    const ifsc = form.ifsc.trim().toUpperCase()
    if (!/^\d{6,20}$/.test(account)) {
      rejectField("ob-accountNumber", "Enter a valid bank account number.")
      return
    }
    if (account !== form.confirmAccountNumber.trim()) {
      rejectField("ob-confirmAccountNumber", "The two account numbers do not match.")
      return
    }
    if (!IFSC_RE.test(ifsc)) {
      rejectField("ob-ifsc", "Enter a valid 11-character IFSC code.")
      return
    }
    setBankVerifying(true)
    try {
      const res = await fetchWithTimeout("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-bank", payload: { ifsc, account_number: account } }),
      })
      const data = await res.json()
      const returnedName =
        data?.data?.name_at_bank ||
        data?.name_at_bank ||
        data?.data?.full_name ||
        data?.full_name ||
        data?.data?.account_name ||
        data?.account_name ||
        ""

      if (!res.ok || (data.code && data.code !== 200) || !returnedName) {
        const detail = String(data?.message || data?.error || "")
        if (isProviderOutage(res.status, detail)) throw new ProviderOutage(detail)
        throw new Error(detail || "Bank account verification failed. Check the account number and IFSC.")
      }

      const target =
        form.partnerType === "Individual" ? form.fullName.trim() : form.businessName.trim() || form.fullName.trim()
      setForm(prev => ({
        ...prev,
        accountHolderName: returnedName,
        bankVerified: true,
        bankMatchScore: nameMatchScore(returnedName, target),
      }))
    } catch (err) {
      console.error("[onboarding] bank verification failed", { error: describeError(err) })
      patch({ bankVerified: false })
      if (err instanceof ProviderOutage) {
        // Step 5 needs a well-formed account and IFSC, never a verified one.
        setStepError(PROVIDER_UNAVAILABLE, "network")
        return
      }
      const kind = classifyError(err)
      setStepError(messageForKind(kind, messageFor(err, "Bank verification failed.")), kind)
    } finally {
      setBankVerifying(false)
    }
  }, [form, patch, rejectField, setStepError])

  // ── step 6: documents ───────────────────────────────────────────────────

  const uploadDoc = useCallback(
    async (key: DocKey, file: File) => {
      setUploadingDoc(key)
      setUploadFailed(null)
      setStepError(null)
      lastPickedFile.current[key] = file

      const body = new FormData()
      body.append("file", file)
      body.append("documentType", key)
      body.append("mobileNumber", mobileNumber)

      /*
       * XHR rather than fetch purely for `upload.onprogress`: fetch still has no
       * upload progress event in any shipping browser, and a KYC photo over a
       * rural 3G link is exactly where a percentage stops the partner assuming
       * the page has hung and pressing the button again.
       */
      try {
        const data = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open("POST", "/api/onboarding/document/upload")
          xhr.timeout = 120000
          xhr.upload.onprogress = e => {
            if (!e.lengthComputable) return
            setUploadProgress(prev => ({ ...prev, [key]: Math.round((e.loaded / e.total) * 100) }))
          }
          xhr.onload = () => {
            let parsed: any = {}
            try {
              parsed = JSON.parse(xhr.responseText || "{}")
            } catch {
              return reject(new Error("The server sent back an unreadable response. Please try again."))
            }
            if (xhr.status < 200 || xhr.status >= 300) {
              return reject(new Error(parsed.error || "Document upload failed"))
            }
            resolve(parsed)
          }
          xhr.onerror = () => reject(new TypeError("Network error during upload"))
          xhr.ontimeout = () => {
            const e = new Error("Upload timed out")
            e.name = "TimeoutError"
            reject(e)
          }
          xhr.send(body)
        })

        setForm(prev => {
          const documents = { ...prev.documents, [key]: data.document }
          // One file carrying both sides of an Aadhaar fills both slots, so the
          // review screen and the lender pack see a back page either way.
          if (key === "aadhaarFrontDoc" && prev.aadhaarCombined) documents.aadhaarBackDoc = data.document
          return { ...prev, documents }
        })
        setUploadProgress(prev => ({ ...prev, [key]: 100 }))
      } catch (err) {
        console.error("[onboarding] document upload failed", { key, name: file.name, size: file.size, error: describeError(err) })
        const kind = classifyError(err)
        setStepError(messageForKind(kind, messageFor(err, "Failed to upload document.")), kind)
        setUploadFailed(key)
        setUploadProgress(prev => ({ ...prev, [key]: undefined }))
      } finally {
        setUploadingDoc(null)
      }
    },
    [mobileNumber, setStepError]
  )

  const removeDoc = useCallback((key: DocKey) => {
    setForm(prev => {
      const documents = { ...prev.documents }
      delete documents[key]
      if (key === "aadhaarFrontDoc" && prev.aadhaarCombined) delete documents.aadhaarBackDoc
      return { ...prev, documents }
    })
    setUploadProgress(prev => ({ ...prev, [key]: undefined }))
    setUploadFailed(prev => (prev === key ? null : prev))
  }, [])

  /** Re-send the file already chosen, for a failure that was the network's fault. */
  const retryUpload = useCallback(
    (key: DocKey) => {
      const file = lastPickedFile.current[key]
      if (file) void uploadDoc(key, file)
    },
    [uploadDoc]
  )

  // ── step 3: submit ──────────────────────────────────────────────────────

  const submitApplication = useCallback(async () => {
    const problem = validateStep(3)
    if (problem) {
      rejectField(problem.field, problem.message)
      return
    }
    // Belt and braces alongside the disabled button: a slow connection lets a
    // determined double-tap land twice before React re-renders.
    if (submitting) return

    setSubmitting(true)
    setStepError(null)
    try {
      // The declarations themselves are part of the record, not just a gate.
      await persistStep(3)

      const res = await fetchWithTimeout("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, agreementConsent: true }),
      })
      const data = await res.json()

      /*
       * Submitting is idempotent server-side. When the first request did land
       * and only its response was lost, the retry comes back as
       * already-submitted — which is a success from where the partner sits, not
       * an error, so it routes to the same status screen instead of a red
       * message about an application that exists and is fine.
       */
      const alreadyIn =
        res.status === 409 || String(data.reason || "").toUpperCase().includes("ALREADY") || data.alreadySubmitted === true
      if (!res.ok && !alreadyIn) throw new Error(data.error || "Failed to submit application")

      OnboardingStorage.clearDraft()
      const newId = data.applicationId || `TSM-DSA-${mobileNumber}`
      setApplicationId(newId)
      setIsSubmitted(true)
      setApplication({
        ...toApplicationShape(form, mobileNumber),
        applicationId: newId,
        status: data.status || "under_review",
        submittedAt: data.submittedAt || new Date().toISOString(),
      })
      setStep(3)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("[onboarding] final submit failed", { mobile: mobileNumber, error: describeError(err) })
      const kind = classifyError(err)
      setStepError(messageForKind(kind, messageFor(err, "Failed to submit application.")), kind)
    } finally {
      setSubmitting(false)
    }
  }, [validateStep, rejectField, submitting, persistStep, mobileNumber, form, setStepError])

  const refreshStatus = useCallback(async () => {
    if (!applicationId && !mobileNumber) return
    setRefreshingStatus(true)
    try {
      const query = applicationId ? `id=${encodeURIComponent(applicationId)}` : `mobile=${encodeURIComponent(mobileNumber)}`
      const res = await fetchWithTimeout(`/api/onboarding/status?${query}`)
      const data = await res.json()
      if (!res.ok || !data.application) throw new Error(data.error || "Could not fetch the latest status.")
      setApplication(prev => ({ ...(prev || {}), ...data.application }))
      setApplicationId(data.application.applicationId || applicationId)
    } catch (err) {
      console.error("[onboarding] status refresh failed", { error: describeError(err) })
      const kind = classifyError(err)
      setStepError(messageForKind(kind, messageFor(err, "Could not fetch the latest status.")), kind)
    } finally {
      setRefreshingStatus(false)
    }
  }, [applicationId, mobileNumber, setStepError])

  /*
   * What the server says has happened to this application. `under_review` is
   * the fallback because that is what a fresh submit produces; anything the API
   * sends that is not recognised is treated the same way rather than inventing
   * an outcome.
   */
  const outcome: ApplicationOutcome = useMemo(() => {
    const raw = String(application?.status || "").toLowerCase()
    if (raw.includes("approve") || raw === "active") return "approved"
    if (raw.includes("reject") || raw.includes("declin")) return "rejected"
    return "under_review"
  }, [application])

  const value: OnboardingValue = {
    mobileNumber,
    isMobileVerified,
    setMobileNumber,
    resetMobile,

    otpSent,
    otpValues,
    setOtpDigit,
    pasteOtp,
    otpTimer,
    canResend,
    otpAttempts,
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
    clearEligibility: () => setEligibility(null),

    form,
    patch: partial => {
      if ("designation" in partial) designationTouched.current = true
      patch(partial)
    },

    step,
    goToStep,
    back,
    stepDone,
    completedCount,
    lockReason,
    saveAndContinue,

    saving,
    resuming,
    stepError,
    stepErrorKind,
    invalidField,
    fieldError: (fieldId: string) => (invalidField === fieldId ? stepError : null),
    setStepError,
    rejectField,
    restoredNote,
    draftConflict,
    preferLocalDraft,
    dismissDraftConflict,
    discardLocalDraft,

    lookupPincode,
    pincodeLoading,
    pincodeAreas,
    pincodeNote,

    verifyGst,
    gstVerifying,

    verifyPan,
    panVerifying,
    panNote,

    aadhaarOtpSent: Boolean(aadhaarRef),
    aadhaarSending,
    aadhaarVerifying,
    sendAadhaarOtp,
    verifyAadhaarOtp,
    cancelAadhaarOtp,
    startDigilocker,
    digilockerLoading,

    lookupIfsc,
    ifscLoading,
    ifscValid,
    ifscNote,
    verifyBank,
    bankVerifying,

    uploadDoc,
    removeDoc,
    retryUpload,
    uploadProgress,
    uploadFailed,
    uploadingDoc,

    submitApplication,
    submitting,

    isSubmitted,
    applicationId,
    outcome,
    application,
    refreshStatus,
    refreshingStatus,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
