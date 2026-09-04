"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crop,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Headphones,
  HelpCircle,
  Lock,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react"

import { AdminButton } from "@/components/admin/ui/Button"
import { FormErrorRegion, type ErrorKind } from "@/components/onboarding/FormErrorRegion"
import { OnboardingStepHeader } from "@/components/onboarding/OnboardingStepHeader"
import PartnerAgreementModal from "@/components/partner/PartnerAgreementModal"
import { PartnerPortalHeader, PartnerPortalFooter } from "@/components/layout/PartnerPortalShell"
import ImageCropModal from "@/components/onboarding/ImageCropModal"
import DocumentViewerModal from "@/components/ui/DocumentViewerModal"
import { OnboardingStorage } from "@/lib/onboarding-storage"
import { cn } from "@/lib/utils"

type PartnerType = "Individual" | "Firm"
type FirmType = "Proprietorship" | "Partnership" | "Private Limited" | "Limited" | "LLP"
type DocKey = "aadhaarFront" | "aadhaarBack" | "panDoc"

interface DocMeta {
  url: string
  fileName?: string
  fileSize?: number
  uploadedAt?: string
}

type PostOffice = { Name?: string; District?: string; Block?: string; State?: string }

function messageFor(err: unknown, fallback: string): string {
  const detail = (err as { message?: string })?.message
  return detail || fallback
}

/**
 * "Offline" and "the request timed out" are not validation failures and must
 * not read like one: a partner who has lost signal needs to be told to check
 * their connection, not to check the form they filled in correctly.
 *
 * A `fetch` that rejects rather than resolving is always transport -- the
 * server never got the request or never answered. Everything that resolves
 * with a non-2xx has a real message from our own API and stays "validation".
 */
function classifyError(err: unknown): ErrorKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline"
  const name = (err as { name?: string })?.name
  if (name === "AbortError" || name === "TimeoutError") return "timeout"
  if (err instanceof TypeError) return "network"
  return "validation"
}

function messageForKind(kind: ErrorKind, fallback: string): string {
  if (kind === "offline") return "You are offline. Your answers are safe on this device — reconnect and try again."
  if (kind === "timeout") return "That request took too long. Nothing was lost — press the button again to retry."
  if (kind === "network") return "Could not reach Techstar Money. Check your connection and try again."
  return fallback
}

/** Fetch with a hard ceiling, so a hung request becomes a timeout the UI can name. */
const REQUEST_TIMEOUT_MS = 30000

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
}

/** After this many wrong codes the OTP form stops accepting input. */
const MAX_OTP_ATTEMPTS = 5

/** "12 minutes ago" beats an ISO string when the point is "is this recent?". */
function formatWhen(d: Date): string {
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

/** Name matching utility for Bank vs Applicant */
function calculateNameMatchScore(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  if (s1 === s2) return 100
  const tokens1 = s1.split(/\s+/).filter(Boolean)
  const tokens2 = s2.split(/\s+/).filter(Boolean)
  if (tokens1.length === 0 || tokens2.length === 0) return 0
  let matchedTokens1 = 0
  for (const t1 of tokens1) {
    if (tokens2.some(t2 => t2.includes(t1) || t1.includes(t2))) matchedTokens1++
  }
  let matchedTokens2 = 0
  for (const t2 of tokens2) {
    if (tokens1.some(t1 => t1.includes(t2) || t2.includes(t1))) matchedTokens2++
  }
  return Math.round(Math.max((matchedTokens1 / tokens1.length) * 100, (matchedTokens2 / tokens2.length) * 100))
}

/**
 * One document slot: idle, uploading, uploaded, or failed.
 *
 * Failure keeps the tile in place with a Retry rather than reverting to the
 * empty state -- reverting reads as "nothing happened", which is exactly the
 * wrong message when a 4 MB photo has just been thrown away by a dropped
 * connection.
 */
function DocTile({
  docKey,
  doc,
  progress,
  failed,
  onPick,
  onRetry,
}: {
  docKey: DocKey
  doc: DocMeta | null
  progress?: number
  failed: boolean
  onPick: () => void
  onRetry: () => void
}) {
  const uploading = typeof progress === "number" && progress < 100 && !doc

  if (uploading) {
    return (
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-admin-xs font-bold text-admin-muted">
          <span>Uploading…</span>
          <span className="admin-num">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-admin-surface-3">
          <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-admin-xs font-bold text-tone-danger-fg">
          <AlertCircle size={14} /> Upload failed
        </div>
        <AdminButton type="button" size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry} className="w-full">
          Retry upload
        </AdminButton>
      </div>
    )
  }

  if (doc) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-admin-xs font-bold text-tone-success-fg">
          <CheckCircle2 size={14} className="shrink-0" />
          <span className="truncate" title={doc.fileName}>{doc.fileName || "Uploaded"}</span>
        </div>
        <AdminButton type="button" size="sm" variant="secondary" icon={Crop} onClick={onPick} className="w-full">
          Replace / crop
        </AdminButton>
      </div>
    )
  }

  return (
    <AdminButton
      type="button"
      size="sm"
      variant="brand"
      icon={Upload}
      onClick={onPick}
      className="w-full"
      aria-label={`Upload ${docKey}`}
    >
      Upload &amp; crop
    </AdminButton>
  )
}

export default function OnboardingPage() {
  // ─── Inline Mobile & OTP Verification States ───
  const [mobileNumber, setMobileNumber] = useState("")
  const [isMobileVerified, setIsMobileVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [otpTimer, setOtpTimer] = useState(50)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [mobileError, setMobileError] = useState<string | null>(null)
  const [mobileErrorKind, setMobileErrorKind] = useState<ErrorKind>("validation")
  const [resuming, setResuming] = useState(false)

  // Wrong codes entered against the current OTP. Reset by a resend or a number
  // change, because both issue a fresh code.
  const [otpAttempts, setOtpAttempts] = useState(0)
  const otpLockedOut = otpAttempts >= MAX_OTP_ATTEMPTS

  // Guards automatic verification so one OTP is submitted exactly once.
  const autoVerifiedRef = useRef("")
  const [eligibilityInfo, setEligibilityInfo] = useState<{
    message: string
    marathiMessage?: string
    redirectUrl?: string
    actionText?: string
  } | null>(null)

  // ─── 3-Step Stepper (Razorpay Style) ───
  // Step 1: Basic & Business Details (Business Type, Name, Email, PAN, DOB 18-80, Address, Pincode)
  // Step 2: Business KYC, GST & Banking (GST + Documents with Crop + Bank details)
  // Step 3: Review, Agreement & Final Submit
  const [currentStep, setCurrentStep] = useState(1)
  const [savingStep, setSavingStep] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [stepErrorKind, setStepErrorKind] = useState<ErrorKind>("validation")
  // The id of the field a validation message is about, so the input can carry
  // aria-invalid and be scrolled to rather than leaving the partner to hunt.
  const [invalidField, setInvalidField] = useState<string | null>(null)

  // What a returning partner is told was restored, and from when. A form that
  // silently refills itself reads as a bug, not a convenience.
  const [restoredNote, setRestoredNote] = useState<string | null>(null)

  // Set only when the local draft and the server draft disagree about how far
  // this application got. Whichever is newer is applied; this records that a
  // choice was made so it can be shown and reversed.
  const [draftConflict, setDraftConflict] = useState<{
    localStep: number
    serverStep: number
    localSavedAt: Date
    applied: "local" | "server"
  } | null>(null)

  // Per-document upload progress, so a slow connection shows movement on the
  // tile that was pressed rather than a page-wide spinner.
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<DocKey, number>>>({})
  const [uploadFailed, setUploadFailed] = useState<DocKey | null>(null)

  // The step pane, so forward/back can restore scroll instead of jumping.
  const stepPaneRef = useRef<HTMLDivElement | null>(null)
  const scrollByStep = useRef<Record<number, number>>({})
  const pendingFocusStep = useRef<number | null>(null)

  // ─── Step 1 Fields ───
  const [partnerType, setPartnerType] = useState<PartnerType>("Individual")
  const [firmType, setFirmType] = useState<FirmType>("Proprietorship")
  const [fullName, setFullName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [contactPersonName, setContactPersonName] = useState("")
  const [designation, setDesignation] = useState("Individual")
  const [email, setEmail] = useState("")
  const [panNumber, setPanNumber] = useState("")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState("Male")
  const [referredByDsaCode, setReferredByDsaCode] = useState("")

  // Address
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [area, setArea] = useState("")
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [stateName, setStateName] = useState("")
  const [pinCode, setPinCode] = useState("")
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeAreas, setPincodeAreas] = useState<string[]>([])
  // A lookup that fails is not a validation error -- the address can still be
  // typed by hand -- so it gets its own quiet note next to the field.
  const [pincodeNote, setPincodeNote] = useState<string | null>(null)

  // ─── Step 2: GST Fields ───
  const [isGstRegistered, setIsGstRegistered] = useState<"Yes" | "No">("No")
  const [gstin, setGstin] = useState("")
  const [gstValid, setGstValid] = useState(false)
  const [gstVerifying, setGstVerifying] = useState(false)
  const [gstDetails, setGstDetails] = useState<any | null>(null)

  // ─── Step 2: KYC Documents Fields ───
  const [docUploadMethod, setDocUploadMethod] = useState<"digilocker" | "manual">("manual")
  const [digilockerLoading, setDigilockerLoading] = useState(false)
  const [digilockerStatus, setDigilockerStatus] = useState<string | null>(null)
  const [aadhaarFrontDoc, setAadhaarFrontDoc] = useState<DocMeta | null>(null)
  const [aadhaarBackDoc, setAadhaarBackDoc] = useState<DocMeta | null>(null)
  const [aadhaarCombined, setAadhaarCombined] = useState(false)
  const [panDoc, setPanDoc] = useState<DocMeta | null>(null)
  const [activeCropModal, setActiveCropModal] = useState<DocKey | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // ─── Step 2: Bank Details Fields ───
  const [accountHolderName, setAccountHolderName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [bankName, setBankName] = useState("")
  const [branchName, setBranchName] = useState("")
  const [accountType, setAccountType] = useState<"Savings" | "Current">("Savings")
  const [ifscLoading, setIfscLoading] = useState(false)
  const [ifscValid, setIfscValid] = useState(false)
  const [ifscNote, setIfscNote] = useState<string | null>(null)
  const [bankVerifying, setBankVerifying] = useState(false)
  const [bankVerified, setBankVerified] = useState(false)
  const [bankVerifyAttempts, setBankVerifyAttempts] = useState(0)
  const [bankMatchScore, setBankMatchScore] = useState<number | null>(null)

  // ─── Step 3: Review, Declarations & MOU Agreement ───
  const [isAgreementSigned, setIsAgreementSigned] = useState(false)
  const [agreementPdfUrl, setAgreementPdfUrl] = useState<string | null>(null)
  const [declareTruth, setDeclareTruth] = useState(false)
  const [declareTerms, setDeclareTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewPdfModal, setPreviewPdfModal] = useState(false)

  // ─── Final Success / Locked Screen ───
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null)
  const [isApplicationLocked, setIsApplicationLocked] = useState(false)
  const [submittedApplicationData, setSubmittedApplicationData] = useState<any>(null)
  const [copiedAppId, setCopiedAppId] = useState(false)

  // ─── Age calculation limits (18 to 80 years) ───
  const todayObj = new Date()
  const maxDobStr = new Date(todayObj.getFullYear() - 18, todayObj.getMonth(), todayObj.getDate()).toISOString().split("T")[0]
  const minDobStr = new Date(todayObj.getFullYear() - 80, todayObj.getMonth(), todayObj.getDate()).toISOString().split("T")[0]

  // ─── OTP Countdown Timer Effect ───
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => {
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

  // Auto-restore session from local draft
  useEffect(() => {
    const savedMobile = OnboardingStorage.getSavedMobile()
    const isVerified = OnboardingStorage.isVerified()
    if (savedMobile && isVerified) {
      setMobileNumber(savedMobile)
      setIsMobileVerified(true)
      loadDraftForMobile(savedMobile)
    }
  }, [])

  /*
   * Moving between steps must not throw the partner to a random scroll offset.
   * The outgoing step's position is remembered, the incoming step is restored
   * to where it was left (or the top, first time), and its first control takes
   * focus so a keyboard or screen-reader user lands inside the form rather
   * than back at the document root.
   */
  useEffect(() => {
    if (!isMobileVerified) return
    const target = scrollByStep.current[currentStep] ?? 0
    window.scrollTo({ top: target, behavior: "auto" })

    const pane = stepPaneRef.current
    if (!pane) return
    const first = pane.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type=submit]:not([disabled])"
    )
    // Only steal focus for a step the partner navigated to, never on the
    // first paint of a resumed draft -- that would scroll them past the
    // "here is what we restored" notice they need to read.
    if (first && pendingFocusStep.current === currentStep) {
      first.focus({ preventScroll: true })
      pendingFocusStep.current = null
    }
  }, [currentStep, isMobileVerified])

  /**
   * Report a validation failure and put the partner in front of the field it
   * is about. Browsers only do this for native constraint validation; every
   * rule on this form is custom, so without it the message appears at the top
   * of a long form and the offending field stays offscreen.
   */
  const rejectField = useCallback((fieldId: string | null, message: string) => {
    setStepErrorKind("validation")
    setStepError(message)
    setInvalidField(fieldId)
    if (!fieldId) return
    // After paint, so the reserved error region has its height.
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId)
      if (!el) return
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      ;(el as HTMLElement).focus({ preventScroll: true })
    })
  }, [])

  /** Remember where this step was left before leaving it. */
  const goToStep = useCallback((next: number) => {
    scrollByStep.current[currentStep] = window.scrollY
    pendingFocusStep.current = next
    setStepError(null)
    setCurrentStep(next)
  }, [currentStep])

  // Auto-fill designation based on entity type
  useEffect(() => {
    if (partnerType === "Individual") {
      setDesignation("Individual")
    } else {
      if (firmType === "Proprietorship") setDesignation("Proprietor")
      else if (firmType === "Partnership") setDesignation("Partner")
      else if (firmType === "Private Limited" || firmType === "Limited") setDesignation("Director")
      else if (firmType === "LLP") setDesignation("Designated Partner")
      else setDesignation("Authorized Signatory")
    }
  }, [partnerType, firmType])

  // Load draft data
  const loadDraftForMobile = async (mob: string) => {
    const localMeta = OnboardingStorage.getDraftMeta()
    const localDraft = OnboardingStorage.getDraft()
    if (localMeta.expired) {
      setRestoredNote("Your saved draft on this device had expired and was cleared. Anything you completed earlier is still on your account.")
    }
    if (localDraft) {
      if (localDraft.fullName) setFullName(localDraft.fullName)
      if (localDraft.email) setEmail(localDraft.email)
      if (localDraft.partnerType) setPartnerType(localDraft.partnerType as PartnerType)
      if (localDraft.firmType) setFirmType(localDraft.firmType as FirmType)
      if (localDraft.businessName) setBusinessName(localDraft.businessName)
      if (localDraft.panNumber) setPanNumber(localDraft.panNumber)
      if (localDraft.contactPersonName) setContactPersonName(localDraft.contactPersonName)
      if (localDraft.designation) setDesignation(localDraft.designation)
      if (localDraft.dob) setDob(localDraft.dob)
      if (localDraft.gender) setGender(localDraft.gender)
      if (localDraft.referredByDsaCode) setReferredByDsaCode(localDraft.referredByDsaCode)
      if (localDraft.addressLine1) setAddressLine1(localDraft.addressLine1)
      if (localDraft.addressLine2) setAddressLine2(localDraft.addressLine2)
      if (localDraft.area) setArea(localDraft.area)
      if (localDraft.city) setCity(localDraft.city)
      if (localDraft.district) setDistrict(localDraft.district)
      if (localDraft.stateName) setStateName(localDraft.stateName)
      if (localDraft.pinCode) setPinCode(localDraft.pinCode)
      if (localDraft.isGstRegistered) setIsGstRegistered(localDraft.isGstRegistered as "Yes" | "No")
      if (localDraft.gstin) setGstin(localDraft.gstin)
      if (localDraft.gstValid) setGstValid(localDraft.gstValid)
      if (localDraft.gstDetails) setGstDetails(localDraft.gstDetails)
      if (localDraft.bankDetails) {
        if (localDraft.bankDetails.accountHolderName) setAccountHolderName(localDraft.bankDetails.accountHolderName)
        if (localDraft.bankDetails.accountNumber) {
          setAccountNumber(localDraft.bankDetails.accountNumber)
          setConfirmAccountNumber(localDraft.bankDetails.accountNumber)
        }
        if (localDraft.bankDetails.ifsc) setIfscCode(localDraft.bankDetails.ifsc)
        if (localDraft.bankDetails.bankName) setBankName(localDraft.bankDetails.bankName)
        if (localDraft.bankDetails.branchName) setBranchName(localDraft.bankDetails.branchName)
        if (localDraft.bankDetails.accountType) setAccountType(localDraft.bankDetails.accountType as "Savings" | "Current")
        if (localDraft.bankDetails.verified) setBankVerified(true)
      }
      if (localDraft.documents) {
        if (localDraft.documents.aadhaarFrontDoc) setAadhaarFrontDoc(localDraft.documents.aadhaarFrontDoc)
        if (localDraft.documents.aadhaarBackDoc) setAadhaarBackDoc(localDraft.documents.aadhaarBackDoc)
        if (localDraft.documents.panDoc) setPanDoc(localDraft.documents.panDoc)
      }
      if (localDraft.agreementSigned) setIsAgreementSigned(true)
      if (localDraft.currentStep && [1, 2, 3].includes(localDraft.currentStep)) {
        setCurrentStep(localDraft.currentStep)
      }
    }

    // The server record is authoritative: it carries progress made on any
    // device, so a partner resumes at the same step after a logout or a
    // browser change, not just after a refresh.
    setResuming(true)
    try {
      const res = await fetch(`/api/onboarding/resume?mobile=${mob}`)
      const data = await res.json()
      if (res.ok && data.found && data.draft) {
        const d = data.draft
        if (d.isSubmitted || d.isApplicationLocked) {
          setSubmittedAppId(d.applicationId || `TSM-DSA-${mob}`)
          setIsApplicationLocked(true)
          setSubmittedApplicationData(d)
          return
        }

        // Step 1 — basic & business identity
        if (d.partnerType) setPartnerType(d.partnerType as PartnerType)
        if (d.firmType) setFirmType(d.firmType as FirmType)
        if (d.fullName) setFullName(d.fullName)
        if (d.businessName) setBusinessName(d.businessName)
        if (d.contactPersonName) setContactPersonName(d.contactPersonName)
        if (d.designation) setDesignation(d.designation)
        if (d.email) setEmail(d.email)
        if (d.panNumber) setPanNumber(d.panNumber)
        if (d.dob) setDob(d.dob)
        if (d.gender) setGender(d.gender)
        if (d.referredByDsaCode) setReferredByDsaCode(d.referredByDsaCode)
        if (d.addressLine1) setAddressLine1(d.addressLine1)
        if (d.addressLine2) setAddressLine2(d.addressLine2)
        if (d.area) setArea(d.area)
        if (d.city) setCity(d.city)
        if (d.district) setDistrict(d.district)
        if (d.stateName) setStateName(d.stateName)
        if (d.pinCode) setPinCode(d.pinCode)

        // Step 2 — GST, documents & bank
        if (d.isGstRegistered) setIsGstRegistered(d.isGstRegistered as "Yes" | "No")
        if (d.gstin) setGstin(d.gstin)
        if (d.gstValid) setGstValid(true)
        if (d.gstDetails) setGstDetails(d.gstDetails)
        if (d.docUploadMethod) setDocUploadMethod(d.docUploadMethod)
        if (d.documents?.aadhaarFrontDoc) setAadhaarFrontDoc(d.documents.aadhaarFrontDoc)
        if (d.documents?.aadhaarBackDoc) setAadhaarBackDoc(d.documents.aadhaarBackDoc)
        if (d.aadhaarCombined || d.documents?.aadhaarCombined) setAadhaarCombined(true)
        if (d.documents?.panDoc) setPanDoc(d.documents.panDoc)
        if (d.bankDetails?.accountHolderName) setAccountHolderName(d.bankDetails.accountHolderName)
        if (d.bankDetails?.accountNumber) {
          setAccountNumber(d.bankDetails.accountNumber)
          setConfirmAccountNumber(d.bankDetails.accountNumber)
        }
        if (d.bankDetails?.ifsc) {
          setIfscCode(d.bankDetails.ifsc)
          setIfscValid(true)
        }
        if (d.bankDetails?.bankName) setBankName(d.bankDetails.bankName)
        if (d.bankDetails?.branchName) setBranchName(d.bankDetails.branchName)
        if (d.bankDetails?.accountType) setAccountType(d.bankDetails.accountType as "Savings" | "Current")
        if (d.bankDetails?.verified) setBankVerified(true)

        // Step 3 — agreement
        if (d.agreementSigned) setIsAgreementSigned(true)
        if (d.agreementPdfUrl) setAgreementPdfUrl(d.agreementPdfUrl)

        /*
         * Reconciliation. Both drafts have just been written into the same
         * state, server last, so the server copy is what is on screen. That is
         * the right default -- it is the record the application is actually
         * built from, and it carries progress made on other devices. But when
         * this device got further, saying nothing means silently discarding
         * work the partner can remember doing, so the disagreement is shown.
         */
        const serverStep = [1, 2, 3].includes(data.currentStep) ? data.currentStep : 1
        const localStep = localMeta.currentStep && [1, 2, 3].includes(localMeta.currentStep)
          ? localMeta.currentStep
          : null

        setCurrentStep(serverStep)

        if (localStep && localMeta.savedAt && localStep !== serverStep) {
          setDraftConflict({
            localStep,
            serverStep,
            localSavedAt: localMeta.savedAt,
            applied: "server",
          })
        } else if (localMeta.savedAt && serverStep > 1) {
          setRestoredNote(
            `Picked up where you left off — step ${serverStep} of 3, last saved ${formatWhen(localMeta.savedAt)}.`
          )
        } else if (serverStep > 1) {
          setRestoredNote(`Picked up where you left off — step ${serverStep} of 3, restored from your account.`)
        }

        OnboardingStorage.saveDraft({
          mobileNumber: mob,
          isMobileVerified: true,
          currentStep: data.currentStep,
          currentStepKey: data.currentStepKey,
        })
      }
    } catch (e) {
      console.error("[onboarding] resume draft failed", { mobile: mob, error: e })
      const kind = classifyError(e)
      setStepErrorKind(kind)
      setStepError(
        messageForKind(kind, "Could not load your saved application. Anything on this device is still here — refresh to try again.")
      )
    } finally {
      setResuming(false)
    }
  }

  // ─── Inline OTP Handlers ───
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber.replace(/\D/g, ""))

  /**
   * Editing a verified number invalidates the verification rather than
   * silently keeping it. The application is keyed by mobile number, so
   * carrying a verified flag onto a different number would attach the KYC to
   * the wrong account.
   */
  const handleMobileEdited = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, 10)
    setMobileNumber(next)
    setMobileError(null)
    if (isMobileVerified && next !== OnboardingStorage.getSavedMobile()) {
      setIsMobileVerified(false)
      setOtpSent(false)
      setOtpValues(["", "", "", "", "", ""])
      setOtpAttempts(0)
      autoVerifiedRef.current = ""
      setMobileErrorKind("info")
      setMobileError("You changed the number, so it needs verifying again. Your answers are still here.")
    }
  }

  const handleSendMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isMobileValid) {
      setMobileError("Please enter a valid 10-digit mobile number.")
      return
    }
    setOtpLoading(true)
    setMobileError(null)
    setEligibilityInfo(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      })
      const data = await res.json()
      if (!res.ok || data.eligible === false) {
        if (data.reason === "ALREADY_APPROVED") {
          setEligibilityInfo({
            message: data.message || "You are already an approved DSA Partner.",
            marathiMessage: data.marathiMessage || "हा नंबर आधीच अधिकृत DSA Partner म्हणून मंजूर आहे! कृपया थेट लॉगिन करा.",
            redirectUrl: data.redirectUrl || `/partner/login?mobile=${mobileNumber}`,
            actionText: "Go to Partner Login (लॉगिन करा) →",
          })
          return
        }
        if (data.reason === "ALREADY_SUBMITTED") {
          setEligibilityInfo({
            message: data.message || "Your application has already been submitted.",
            marathiMessage: data.marathiMessage || "तुमचा DSA Partner अर्ज आधीच सबमिट झालेला असून तो पडताळणी अंतर्गत आहे.",
            redirectUrl: data.redirectUrl || `/application-status?id=${data.applicationId || `TSM-DSA-${mobileNumber}`}`,
            actionText: "Track Application Status (स्टेटस तपासा) →",
          })
          return
        }
        if (data.reason === "BLOCKED") {
          setEligibilityInfo({
            message: data.message || "This mobile number is not eligible for onboarding.",
            marathiMessage: data.marathiMessage || "हा मोबाईल नंबर नवीन पार्टनर नोंदणीसाठी पात्र नाही. कृपया सपोर्टशी संपर्क साधा.",
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
      setOtpAttempts(0)
      autoVerifiedRef.current = ""
    } catch (err: any) {
      console.error("[onboarding] send OTP failed", { mobile: mobileNumber, error: err })
      const kind = classifyError(err)
      setMobileErrorKind(kind)
      setMobileError(messageForKind(kind, messageFor(err, "Unable to send verification OTP.")))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendMobileOtp = async () => {
    if (!canResend || resending) return
    setResending(true)
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
      setOtpValues(["", "", "", "", "", ""])
      // A new code means a clean slate: the old attempts were against a code
      // that no longer exists.
      setOtpAttempts(0)
      autoVerifiedRef.current = ""
    } catch (err) {
      console.error("[onboarding] resend OTP failed", { mobile: mobileNumber, error: err })
      const kind = classifyError(err)
      setMobileErrorKind(kind)
      setMobileError(messageForKind(kind, messageFor(err, "Failed to resend OTP.")))
    } finally {
      setResending(false)
    }
  }

  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otpValues]
    next[index] = val.slice(-1)
    setOtpValues(next)
    if (val && index < 5) {
      const nextInput = document.getElementById(`onboard-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`onboard-otp-${index - 1}`)
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
    document.getElementById(`onboard-otp-${Math.min(pasted.length, 5)}`)?.focus()
  }

  const handleVerifyInlineOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const fullOtp = otpValues.join("")
    if (fullOtp.length < 6) {
      setMobileError("Please enter the complete 6-digit OTP code.")
      return
    }
    setVerifyLoading(true)
    setMobileError(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, otp: fullOtp }),
      })
      const data = await res.json()

      /*
       * Wrong, expired and rate-limited are three different problems with
       * three different next actions -- retype, request a new code, wait --
       * and collapsing them into "Invalid OTP" leaves the partner retyping a
       * code that can never work. The server distinguishes them; so does this.
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
        const used = otpAttempts + 1
        const left = MAX_OTP_ATTEMPTS - used
        throw new Error(
          left > 0
            ? `That code is not correct. ${left} attempt${left === 1 ? "" : "s"} left before you need a new code.`
            : "That was the last attempt on this code. Request a new one to continue."
        )
      }

      // OTP section collapses into the green verified strip and the pending
      // step opens inline underneath it.
      setIsMobileVerified(true)
      setOtpSent(false)
      if (data.currentStep && [1, 2, 3].includes(data.currentStep)) {
        setCurrentStep(data.currentStep)
      }
      OnboardingStorage.saveDraft({
        mobileNumber,
        isMobileVerified: true,
        currentStep: data.currentStep,
        currentStepKey: data.currentStepKey,
      })
      await loadDraftForMobile(mobileNumber)
      setOtpAttempts(0)
    } catch (err: any) {
      console.error("[onboarding] verify OTP failed", { mobile: mobileNumber, error: err })
      autoVerifiedRef.current = ""
      const kind = classifyError(err)
      setMobileErrorKind(kind)
      setMobileError(messageForKind(kind, err?.message || "Failed to verify OTP."))
    } finally {
      setVerifyLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValues, mobileNumber])

  // Auto-submit as soon as all six digits are present.
  useEffect(() => {
    const fullOtp = otpValues.join("")
    if (!otpSent || isMobileVerified || verifyLoading || otpLockedOut) return
    if (fullOtp.length !== 6) return
    if (autoVerifiedRef.current === fullOtp) return
    autoVerifiedRef.current = fullOtp
    handleVerifyInlineOtp()
  }, [otpValues, otpSent, isMobileVerified, verifyLoading, otpLockedOut, handleVerifyInlineOtp])

  const handleResetMobile = () => {
    OnboardingStorage.clearDraft()
    autoVerifiedRef.current = ""
    setMobileNumber("")
    setIsMobileVerified(false)
    setOtpSent(false)
    setOtpValues(["", "", "", "", "", ""])
    setOtpAttempts(0)
    setMobileError(null)
    setRestoredNote(null)
    setDraftConflict(null)
    setCurrentStep(1)
  }

  /**
   * Discarding the local draft without touching the server record. The point
   * is the PII: on a shared or kiosk machine this is how a partner leaves
   * without their details sitting in the next person's devtools.
   */
  const handleDiscardLocalDraft = () => {
    OnboardingStorage.clearDraft()
    setRestoredNote(null)
    setDraftConflict(null)
    window.location.reload()
  }

  /**
   * Applying the local draft after a conflict was shown. Only the step moves:
   * field values from both drafts are already merged in state, and re-running
   * the local hydrate would clobber newer server answers.
   */
  const handlePreferLocalDraft = () => {
    if (!draftConflict) return
    goToStep(draftConflict.localStep)
    setDraftConflict({ ...draftConflict, applied: "local" })
  }

  // ─── Save Step Progress ───
  const saveProgress = async (stepNum: number, stepPayload: Record<string, unknown>) => {
    OnboardingStorage.saveDraft({
      ...stepPayload,
      mobileNumber,
      isMobileVerified: true,
      currentStep: stepNum,
    })
    setSavingStep(true)
    setStepError(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          step: stepNum,
          stepData: stepPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save step progress.")
      return true
    } catch (err) {
      console.error("[onboarding] save step failed", { step: stepNum, mobile: mobileNumber, error: err })
      const kind = classifyError(err)
      setStepErrorKind(kind)
      // Nothing is cleared here: the form keeps every answer so the partner
      // can press Continue again once they are back online.
      setStepError(messageForKind(kind, messageFor(err, "Failed to save progress. Please try again.")))
      return false
    } finally {
      setSavingStep(false)
    }
  }

  // ─── Step 1: Pincode Auto-Fill ───
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "")
    setPinCode(clean)
    if (clean.length !== 6) {
      setPincodeAreas([])
      return
    }
    setPincodeLoading(true)
    setPincodeNote(null)
    try {
      const res = await fetchWithTimeout(`https://api.postalpincode.in/pincode/${clean}`)
      /*
       * This was the one fetch on the page that never checked `res.ok`. A 5xx
       * from the postal API returns an HTML error body, `data[0]` is
       * undefined, the Success branch quietly does not run, and the partner
       * watches the spinner stop with City and State still empty and nothing
       * telling them why. They can always type the address by hand -- so this
       * is a note, not a blocking error.
       */
      if (!res.ok) {
        throw new Error(`Pincode lookup returned ${res.status}`)
      }
      const data = await res.json()
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po: PostOffice[] = data[0].PostOffice
        setCity(po[0].District || po[0].Block || "")
        setDistrict(po[0].District || "")
        setStateName(po[0].State || "")
        const areas = [...new Set(po.map(p => p.Name).filter((n): n is string => Boolean(n)))]
        setPincodeAreas(areas)
        if (areas.length === 1) setArea(areas[0])
      } else {
        setPincodeNote("We could not find that PIN code. Please fill in City and State yourself.")
      }
    } catch (err) {
      console.error("[onboarding] pincode lookup failed", { pincode: clean, error: err })
      setPincodeNote("Could not look up that PIN code just now — please type City and State yourself.")
    } finally {
      setPincodeLoading(false)
    }
  }

  // ─── Step 1: Submit (Basic & Business Details) ───
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStepError(null)
    setInvalidField(null)

    // Name validations based on business type
    if (partnerType === "Individual") {
      if (!fullName.trim()) {
        rejectField("ob-fullName", "Full name as printed on your PAN card is required.")
        return
      }
    } else {
      if (!businessName.trim()) {
        rejectField("ob-businessName", "Business / firm name is required.")
        return
      }
      if (!contactPersonName.trim()) {
        rejectField("ob-contactPersonName", "Contact person name is required.")
        return
      }
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      rejectField("ob-email", "Please provide a valid email address — this is where your partner ID is sent.")
      return
    }

    // PAN validation (pure regex format, no Check PAN button needed)
    const cleanPan = panNumber.trim().toUpperCase()
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      rejectField("ob-pan", "Please enter a valid 10-character PAN number (e.g. ABCDE1234F).")
      return
    }

    // DOB age validation (strictly 18 to 80 years)
    if (!dob) {
      rejectField("ob-dob", "Date of birth is required.")
      return
    }
    const birthDate = new Date(dob)
    let age = todayObj.getFullYear() - birthDate.getFullYear()
    const mDiff = todayObj.getMonth() - birthDate.getMonth()
    if (mDiff < 0 || (mDiff === 0 && todayObj.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18 || age > 80) {
      rejectField("ob-dob", "Applicant age must be between 18 and 80 years to register as a DSA partner.")
      return
    }

    // Address validations, each pointing at the field that is actually empty.
    if (pinCode.trim().length !== 6) {
      rejectField("ob-pincode", "A 6-digit PIN code is required.")
      return
    }
    if (!addressLine1.trim()) {
      rejectField("ob-addressLine1", "Address line 1 is required.")
      return
    }
    if (!city.trim()) {
      rejectField("ob-city", "City / district is required.")
      return
    }
    if (!stateName.trim()) {
      rejectField("ob-state", "State is required.")
      return
    }

    const payload = {
      partnerType,
      firmType: partnerType === "Firm" ? firmType : null,
      fullName: partnerType === "Individual" ? fullName.trim() : contactPersonName.trim(),
      businessName: partnerType === "Firm" ? businessName.trim() : null,
      contactPersonName: partnerType === "Firm" ? contactPersonName.trim() : fullName.trim(),
      designation,
      email: email.trim(),
      panNumber: cleanPan,
      dob,
      gender,
      referredByDsaCode: referredByDsaCode.trim().toUpperCase() || null,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      area: area.trim(),
      city: city.trim(),
      district: district.trim(),
      stateName: stateName.trim(),
      pinCode: pinCode.trim(),
    }

    const ok = await saveProgress(2, payload)
    if (ok) {
      // Pre-fill bank account holder name if empty
      if (!accountHolderName.trim()) {
        setAccountHolderName(partnerType === "Individual" ? fullName.trim() : (businessName.trim() || contactPersonName.trim()))
      }
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // ─── Step 2: GST Verification ───
  const handleVerifyGst = async () => {
    setStepError(null)
    const cleanGst = gstin.trim().toUpperCase()
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
      setStepError("Please enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).")
      setGstValid(false)
      return
    }
    setGstVerifying(true)
    try {
      const res = await fetchWithTimeout("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-gst", payload: { gstin: cleanGst } }),
      })
      const data = await res.json()
      if (!res.ok || (data.code && data.code !== 200) || data.error) {
        throw new Error(data.message || data.error || "GSTIN verification failed. Please verify the GST number.")
      }
      const resData = data.data?.data || data.data
      if (!resData) throw new Error("No record found for this GSTIN.")

      const legalName = resData.lgnm || ""
      const tradeName = resData.tradeNam || legalName
      const constitution = resData.ctb || ""
      const status = resData.sts || "Active"
      const addrObj = resData.pradr?.addr || {}

      const formattedAddress = [
        addrObj.bno,
        addrObj.bnm,
        addrObj.flno,
        addrObj.st,
        addrObj.loc || addrObj.locality,
        addrObj.dst,
        addrObj.stcd,
        addrObj.pncd,
      ].filter(Boolean).join(", ")

      const details = {
        gstin: cleanGst,
        legalName,
        tradeName,
        constitution,
        status,
        address: formattedAddress,
        pincode: addrObj.pncd || "",
        state: addrObj.stcd || "",
        district: addrObj.dst || "",
      }

      setGstDetails(details)
      setGstValid(true)
      setGstin(cleanGst)

      // Auto-save business name and address if firm
      if (tradeName || legalName) {
        setBusinessName(tradeName || legalName)
      }
      if (formattedAddress) {
        setAddressLine1(formattedAddress)
        if (addrObj.dst) setCity(addrObj.dst)
        if (addrObj.stcd) setStateName(addrObj.stcd)
        if (addrObj.pncd) setPinCode(addrObj.pncd)
      }
    } catch (err: any) {
      console.error("[onboarding] GST verification failed", { gstin: cleanGst, error: err })
      setGstValid(false)
      setGstDetails(null)
      const kind = classifyError(err)
      setStepErrorKind(kind)
      setStepError(messageForKind(kind, messageFor(err, "Failed to verify GSTIN.")))
    } finally {
      setGstVerifying(false)
    }
  }

  // ─── Step 2: Document Upload & Crop Handler ───
  /** The file the partner last picked per slot, so Retry does not re-prompt. */
  const lastPickedFile = useRef<Partial<Record<DocKey, File>>>({})

  const uploadDocument = async (docType: DocKey, file: File) => {
    setUploadingDoc(true)
    setUploadFailed(null)
    setStepError(null)
    lastPickedFile.current[docType] = file

    const formData = new FormData()
    formData.append("file", file)
    formData.append("documentType", docType)
    formData.append("mobileNumber", mobileNumber)

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
          setUploadProgress(prev => ({ ...prev, [docType]: Math.round((e.loaded / e.total) * 100) }))
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
        xhr.send(formData)
      })

      if (docType === "aadhaarFront") {
        setAadhaarFrontDoc(data.document)
        if (aadhaarCombined) setAadhaarBackDoc(data.document)
      } else if (docType === "aadhaarBack") {
        setAadhaarBackDoc(data.document)
      } else if (docType === "panDoc") {
        setPanDoc(data.document)
      }
      setUploadProgress(prev => ({ ...prev, [docType]: 100 }))
    } catch (err) {
      console.error("[onboarding] document upload failed", { docType, name: file.name, size: file.size, error: err })
      const kind = classifyError(err)
      setStepErrorKind(kind)
      setStepError(messageForKind(kind, messageFor(err, "Failed to upload document.")))
      setUploadFailed(docType)
      setUploadProgress(prev => ({ ...prev, [docType]: undefined }))
    } finally {
      setUploadingDoc(false)
      setActiveCropModal(null)
    }
  }

  const handleDocumentCropped = async (file: File) => {
    if (!activeCropModal) return
    await uploadDocument(activeCropModal, file)
  }

  /** Re-send the file already chosen, for a failure that was the network's fault. */
  const handleRetryUpload = (docType: DocKey) => {
    const file = lastPickedFile.current[docType]
    if (file) {
      void uploadDocument(docType, file)
    } else {
      setActiveCropModal(docType)
    }
  }

  // ─── Step 2: Bank IFSC Lookup & Verify ───
  const handleIfscChange = async (val: string) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11)
    setIfscCode(clean)
    if (clean.length !== 11) {
      setIfscValid(false)
      return
    }
    setIfscLoading(true)
    try {
      const res = await fetchWithTimeout(`/api/onboarding/ifsc?code=${clean}`)
      const data = await res.json()
      if (res.ok && data.valid && data.details) {
        setBankName(data.details.BANK || "")
        setBranchName(data.details.BRANCH || "")
        setIfscValid(true)
        setIfscNote(null)
      } else {
        setIfscValid(false)
        setIfscNote("We could not match that IFSC code. Check it against your passbook or cheque.")
      }
    } catch (err) {
      console.error("[onboarding] IFSC lookup failed", { ifsc: clean, error: err })
      setIfscValid(false)
      setIfscNote("Could not look up that IFSC just now — check your connection and re-enter it.")
    } finally {
      setIfscLoading(false)
    }
  }

  const handleVerifyBankAccount = async () => {
    setStepError(null)
    if (!accountNumber || accountNumber.length < 8) {
      setStepError("Please enter a valid Bank Account Number.")
      return
    }
    if (accountNumber !== confirmAccountNumber) {
      setStepError("Account Number and Confirm Account Number do not match.")
      return
    }
    if (!ifscCode || ifscCode.length !== 11) {
      setStepError("Please enter a valid 11-digit IFSC code.")
      return
    }
    setBankVerifying(true)
    try {
      const res = await fetchWithTimeout("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-bank",
          payload: {
            ifsc: ifscCode.trim().toUpperCase(),
            account_number: accountNumber.trim(),
          },
        }),
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
        setBankVerified(false)
        throw new Error(data?.message || data?.error || "Bank account verification failed. Please verify Account No & IFSC.")
      }

      setAccountHolderName(returnedName)
      const targetName = partnerType === "Individual" ? fullName.trim() : (businessName.trim() || contactPersonName.trim())
      const score = calculateNameMatchScore(returnedName, targetName)
      setBankMatchScore(score)
      setBankVerified(true)
    } catch (err: any) {
      console.error("[onboarding] bank verification failed", { ifsc: ifscCode, error: err })
      setBankVerified(false)
      const kind = classifyError(err)
      setStepErrorKind(kind)
      setStepError(messageForKind(kind, messageFor(err, "Bank verification failed.")))
    } finally {
      setBankVerifying(false)
    }
  }

  // ─── Step 2: Submit (Merged: GST, KYC Docs, Bank) ───
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStepError(null)
    setInvalidField(null)

    // GST validation
    if (isGstRegistered === "Yes" && (!gstValid || gstin.trim().length !== 15)) {
      rejectField("ob-gstin", "Enter and verify your 15-character GSTIN, or answer No to the GST question.")
      return
    }

    // Documents validation
    if (!aadhaarFrontDoc) {
      rejectField("ob-documents", "Upload the front of your Aadhaar card.")
      return
    }
    if (!aadhaarCombined && !aadhaarBackDoc) {
      rejectField("ob-documents", "Upload the back of your Aadhaar card, or tick “both sides on one file”.")
      return
    }
    if (!panDoc) {
      rejectField("ob-documents", "Upload your PAN card document.")
      return
    }

    // Bank validation
    if (!accountNumber.trim() || accountNumber.trim().length < 8) {
      rejectField("ob-accountNumber", "Enter a valid bank account number — commission payouts go here.")
      return
    }
    if (accountNumber !== confirmAccountNumber) {
      rejectField("ob-confirmAccountNumber", "The two account numbers do not match.")
      return
    }
    if (!ifscCode.trim() || ifscCode.trim().length !== 11) {
      rejectField("ob-ifsc", "Enter a valid 11-character IFSC code.")
      return
    }
    if (!accountHolderName.trim()) {
      rejectField("ob-accountHolderName", "Enter the account holder's name exactly as your bank has it.")
      return
    }

    const payload = {
      isGstRegistered,
      gstin: isGstRegistered === "Yes" ? gstin.trim().toUpperCase() : null,
      gstValid,
      gstDetails,
      documents: {
        aadhaarFrontDoc,
        aadhaarBackDoc: aadhaarCombined ? aadhaarFrontDoc : aadhaarBackDoc,
        aadhaarCombined,
        panDoc,
      },
      bankDetails: {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifscCode.trim().toUpperCase(),
        bankName,
        branchName,
        accountType,
        verified: bankVerified,
      },
    }

    const ok = await saveProgress(3, payload)
    if (ok) {
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // ─── Step 3: Final Submit ───
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!declareTruth || !declareTerms) {
      rejectField("ob-declarations", "Please tick both confirmations before submitting.")
      return
    }
    if (!isAgreementSigned) {
      rejectField("ob-agreement", "Sign the Partner MOU with an OTP before submitting the application.")
      return
    }

    // Belt and braces alongside the disabled button: a slow connection lets a
    // determined double-tap land twice before React re-renders.
    if (submitting) return

    setSubmitting(true)
    setStepError(null)
    try {
      const res = await fetchWithTimeout("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          agreementConsent: true,
        }),
      })
      const data = await res.json()

      /*
       * Submitting is idempotent server-side. When the first request did land
       * and only its response was lost, the retry comes back as
       * already-submitted -- which is a success from where the partner sits,
       * not an error, so it routes to the same locked screen instead of a red
       * message about an application that exists and is fine.
       */
      const alreadyIn =
        res.status === 409 ||
        String(data.reason || "").toUpperCase().includes("ALREADY") ||
        data.alreadySubmitted === true
      if (!res.ok && !alreadyIn) throw new Error(data.error || "Failed to submit application")

      OnboardingStorage.clearDraft()
      const newAppId = data.applicationId || `TSM-DSA-${mobileNumber}`
      setSubmittedAppId(newAppId)
      setIsApplicationLocked(true)
      setSubmittedApplicationData({
        applicationId: newAppId,
        status: "under_review",
        fullName: fullName || contactPersonName,
        email,
        mobileNumber,
        partnerType,
        firmType,
        businessName,
        panNumber,
        addressLine1,
        city,
        stateName,
        pinCode,
        bankDetails: {
          accountHolderName,
          accountNumber,
          ifsc: ifscCode,
          bankName,
        },
        agreementSigned: isAgreementSigned,
      })
    } catch (err) {
      console.error("[onboarding] final submit failed", { mobile: mobileNumber, error: err })
      const kind = classifyError(err)
      setStepErrorKind(kind)
      setStepError(messageForKind(kind, messageFor(err, "Failed to submit application.")))
    } finally {
      setSubmitting(false)
    }
  }

  const copyAppId = () => {
    if (!submittedAppId) return
    navigator.clipboard.writeText(submittedAppId)
    setCopiedAppId(true)
    setTimeout(() => setCopiedAppId(false), 2000)
  }

  // ─── Render Screen: Locked Application (After Submission) ───
  if (submittedAppId || isApplicationLocked) {
    return (
      <div className="partner-root min-h-dvh flex flex-col bg-admin-bg text-admin-text">
        <PartnerPortalHeader subtitle="DSA Partner Onboarding" rightLinkLabel="Track Live" rightLinkHref={`/application-status?id=${submittedAppId}`} />

        <main className="flex-1 flex w-full max-w-3xl mx-auto px-4 py-10">
          <div className="w-full bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-3 p-6 sm:p-10 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-tone-success text-tone-success-fg border border-tone-success-bd flex items-center justify-center mx-auto shadow-admin-1">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tone-success text-tone-success-fg text-admin-xs font-bold uppercase tracking-wider">
                <Lock size={13} /> Application Submitted &amp; Locked
              </span>
              <h1 className="text-admin-2xl sm:text-admin-2xl font-black text-admin-text tracking-tight">
                Partner Application Under Review
              </h1>
              {/* Requirement #1: Removed 'सुरक्षितता व बँकिंग नियमांनुसार एकदा सबमिट झाल्यावर अर्जामध्ये कोणतेही फेरबदल करता येत नाहीत' */}
              <p className="max-w-xl mx-auto text-admin-sm text-admin-muted leading-relaxed">
                तुमचा DSA Partner अर्ज यशस्वीरित्या सबमिट झालेला असून तो सुरक्षिततेसाठी लॉक (Lock) करण्यात आला आहे.
              </p>
            </div>

            {/* Application ID Card */}
            <div className="bg-admin-surface-2 border border-admin-border rounded-admin-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div>
                <span className="block text-admin-xs font-bold uppercase text-admin-subtle">Official Application ID</span>
                <span className="block text-admin-2xl font-black text-admin-text font-mono mt-0.5">{submittedAppId}</span>
                <span className="block text-admin-xs text-admin-muted mt-1">Updates will be sent to WhatsApp (+91 {mobileNumber})</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyAppId}
                  className="px-3.5 py-2 bg-admin-surface border border-admin-border-strong rounded-admin text-admin-xs font-bold text-admin-text hover:bg-admin-surface-2 flex items-center gap-1.5 shadow-admin-1"
                >
                  <Copy size={14} />
                  <span>{copiedAppId ? "Copied!" : "Copy ID"}</span>
                </button>
                <Link
                  href={`/application-status?id=${submittedAppId}`}
                  className="px-4 py-2 bg-brand text-brand-fg rounded-admin text-admin-xs font-bold hover:bg-brand-hover flex items-center gap-1.5 shadow-admin-1"
                >
                  <span>Track Status</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-admin-border flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetMobile}
                className="text-admin-xs font-bold text-admin-muted hover:text-admin-text"
              >
                ← Onboard Another Account
              </button>
              <a
                href={`https://wa.me/919579005645?text=Hello%20Techstar%20Money,%20my%20DSA%20Application%20ID%20is%20${submittedAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-admin-xs font-bold text-tone-success-fg hover:brightness-95 flex items-center gap-1"
              >
                <MessageSquare size={14} /> WhatsApp Support
              </a>
            </div>
          </div>
        </main>
        <PartnerPortalFooter />
      </div>
    )
  }

  // ─── Step Completion Flags for Razorpay Sidebar ───
  const isStep1Done = Boolean(
    (partnerType === "Individual" ? fullName.trim() : (businessName.trim() && contactPersonName.trim())) &&
    email.trim() &&
    panNumber.trim().length === 10 &&
    dob &&
    addressLine1.trim() &&
    pinCode.trim().length === 6
  )

  const isStep2Done = Boolean(
    aadhaarFrontDoc &&
    panDoc &&
    accountNumber.trim().length >= 8 &&
    ifscCode.trim().length === 11 &&
    accountHolderName.trim()
  )

  const isStep3Done = Boolean(isAgreementSigned && declareTruth && declareTerms)

  /** One definition, read by both the sidebar list and the step header. */
  const STEPS = [
    { id: 1, title: "Basic details", desc: "Personal, business & address", done: isStep1Done },
    { id: 2, title: "Business & KYC", desc: "GST, documents & bank account", done: isStep2Done },
    { id: 3, title: "Review & submit", desc: "MOU agreement execution", done: isStep3Done },
  ]

  /**
   * Why a step is not open yet. Steps 2 and 3 are gated on real prerequisites,
   * and a deep link or a stale tab that lands on one must say what is missing
   * rather than render an empty shell.
   */
  const lockReasonFor = (id: number): string | null => {
    if (!isMobileVerified) return "Verify your mobile number first — the application is keyed to it."
    if (id === 2 && !isStep1Done) return "Finish step 1 first: we need your name, PAN, date of birth and address."
    if (id === 3 && !isStep2Done) return "Finish step 2 first: KYC documents and a payout bank account are required before the MOU."
    return null
  }

  return (
    <div className="partner-root min-h-dvh flex flex-col bg-admin-bg font-sans text-admin-text">
      {/* Top Banner */}
      <div className="bg-admin-text text-admin-subtle py-1.5 px-4 text-center text-admin-xs font-medium border-b border-admin-border flex items-center justify-center gap-2">
        <Sparkles size={13} className="text-tone-warn-fg" />
        <span>Complete Onboarding to unlock <strong>Direct Bank Commission Payouts &amp; Zero Setup Fees</strong></span>
      </div>

      {/* Main 2-Column Razorpay Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">

        {/* ─── LEFT SIDEBAR (Razorpay Style) ─── */}
        <aside className="w-full md:w-80 lg:w-96 bg-admin-surface border-r border-admin-border p-5 md:p-8 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* User Profile Header */}
            <div className="flex items-center gap-3 pb-5 border-b border-admin-border">
              <div className="w-11 h-11 rounded-admin-lg bg-brand text-brand-fg flex items-center justify-center font-bold text-admin-sm shadow-admin-2 shadow-admin-2 shrink-0">
                {(fullName || businessName || "TS").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-admin-sm font-extrabold text-admin-text truncate">
                  {fullName || businessName || (mobileNumber ? `+91 ${mobileNumber}` : "New DSA Partner")}
                </div>
                <div className="text-admin-xs text-admin-subtle font-medium truncate">
                  {partnerType} {partnerType === "Firm" ? `(${firmType})` : ""}
                </div>
              </div>
            </div>

            {/* Stepper Header */}
            <div>
              <div className="text-admin-xs font-bold uppercase tracking-wider text-admin-subtle">Onboarding Flow</div>
              <div className="text-admin-lg font-black text-admin-text">DSA Partner Channel</div>
            </div>

            {/*
              * One bordered group rather than three separate cards. Correcting
              * the Bootstrap cascade shrank the padding these relied on and
              * left them floating; a divided list reads as a single flow, which
              * is what a stepper is.
              */}
            <ol className="rounded-admin-lg border border-admin-border overflow-hidden divide-y divide-admin-border">
              {STEPS.map((st) => {
                const isActive = currentStep === st.id
                const locked = lockReasonFor(st.id)
                return (
                  <li key={st.id}>
                    <button
                      type="button"
                      disabled={Boolean(locked)}
                      aria-current={isActive ? "step" : undefined}
                      title={locked ?? undefined}
                      onClick={() => goToStep(st.id)}
                      className={cn(
                        "admin-focus w-full text-left px-3.5 py-3 transition-colors flex items-center justify-between gap-3 min-h-11",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        isActive
                          ? "bg-brand-soft"
                          : "bg-admin-surface hover:bg-admin-surface-2"
                      )}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-admin-xs font-bold shrink-0 transition-colors",
                            st.done
                              ? "bg-tone-success text-tone-success-fg"
                              : isActive
                                ? "bg-brand text-brand-fg"
                                : "bg-admin-surface-3 text-admin-subtle"
                          )}
                        >
                          {st.done ? <Check size={14} /> : st.id}
                        </span>
                        <span className="min-w-0 block">
                          <span className={cn("block text-admin-xs font-bold leading-tight truncate", isActive ? "text-brand-soft-fg" : "text-admin-text")}>
                            {st.title}
                          </span>
                          <span className="block text-admin-2xs text-admin-subtle truncate">
                            {locked && isMobileVerified ? "Locked" : st.desc}
                          </span>
                        </span>
                      </span>
                      {locked && isMobileVerified ? (
                        <Lock size={13} className="shrink-0 text-admin-subtle" />
                      ) : (
                        <ArrowRight size={14} className={cn("shrink-0", isActive ? "text-brand" : "text-admin-subtle")} />
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-admin-border text-admin-xs text-admin-subtle space-y-2 mt-6">
            <div className="flex items-center gap-1.5 font-bold text-admin-text">
              <HelpCircle size={14} className="text-brand" />
              <span>Need Assistance?</span>
            </div>
            <p className="text-admin-2xs leading-relaxed text-admin-muted">
              Our partner operations desk in Chhatrapati Sambhajinagar is ready to help you.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="tel:09579005645" className="admin-focus admin-touch inline-flex items-center font-bold text-admin-text hover:text-brand">
                📞 095790 05645
              </a>
              <span>·</span>
              <a
                href="https://wa.me/919579005645"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-focus admin-touch inline-flex items-center font-bold text-tone-success-fg hover:brightness-95"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT MAIN PANE ─── */}
        <main className="flex-1 bg-admin-surface p-5 md:p-10 flex flex-col">
          <div>
            {/* Top Navigation & Brand Header */}
            <div className="flex items-center justify-between pb-6 border-b border-admin-border mb-6">
              {/* Back lives in OnboardingStepHeader now, one per step. */}
              <div />
              <div className="flex items-center gap-2 text-right">
                <a
                  href="tel:09579005645"
                  title="Call Support (095790 05645)"
                  className="admin-focus admin-touch w-8 h-8 rounded-admin border border-admin-border bg-admin-surface-2 hover:bg-admin-surface-3 flex items-center justify-center text-admin-text transition-colors shadow-admin-1"
                >
                  <Headphones size={15} className="text-brand" />
                </a>
                <div className="w-8 h-8 rounded-admin-sm overflow-hidden border border-admin-border flex items-center justify-center p-0.5">
                  <Image src="/img/logo.webp" alt="Techstar Money" width={30} height={30} className="object-contain" />
                </div>
                <div>
                  <div className="text-admin-xs font-extrabold text-admin-text leading-none">Techstar Money Solution</div>
                  <div className="text-admin-2xs font-semibold text-admin-subtle">Partner Channel</div>
                </div>
              </div>
            </div>

            {/* Step error. Always rendered so a message never shifts the form. */}
            {isMobileVerified && (
              <FormErrorRegion message={stepError} kind={stepErrorKind} id="onboarding-step-error" className="mb-4" />
            )}

            {/* ─── PRE-OTP / INLINE OTP FORM ON SAME SCREEN ─── */}
            {!isMobileVerified ? (
              <div className="max-w-xl mx-auto py-6 space-y-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-admin-2xl sm:text-admin-2xl font-black text-admin-text tracking-tight">
                    Verify Your Mobile Number
                  </h2>
                  <p className="text-admin-xs sm:text-admin-sm text-admin-muted font-medium">
                    We will send a 6-digit verification code directly to your WhatsApp number.
                  </p>
                </div>

                <FormErrorRegion message={mobileError} kind={mobileErrorKind} id="onboard-mobile-error" />

                {/* Eligibility Warning Banner */}
                {eligibilityInfo && (
                  <div className="p-4 rounded-admin-lg bg-tone-warn border-2 border-tone-warn-bd text-tone-warn-fg text-admin-xs space-y-3 animate-fadeIn shadow-admin-1">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={20} className="text-tone-warn-fg shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-admin-sm text-tone-warn-fg leading-snug">
                          {eligibilityInfo.marathiMessage}
                        </div>
                        <div className="text-admin-xs text-tone-warn-fg mt-1 leading-relaxed">
                          {eligibilityInfo.message}
                        </div>
                      </div>
                    </div>
                    {eligibilityInfo.redirectUrl && (
                      <div className="pt-1">
                        <Link
                          href={eligibilityInfo.redirectUrl}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-admin bg-tone-warn-fg hover:brightness-95 text-brand-fg font-bold text-admin-xs shadow-admin-1 transition-colors"
                        >
                          <span>{eligibilityInfo.actionText || "Proceed →"}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-admin-surface border border-admin-border rounded-admin-lg p-6 shadow-admin-1 space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="onboard-mobile" className="block text-admin-xs font-bold text-admin-text uppercase tracking-wider">
                      Mobile Number (WhatsApp Enabled)
                    </label>
                    <div className="flex h-12 rounded-admin border border-admin-border-strong bg-admin-surface-2 overflow-hidden focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft transition-all">
                      <span className="flex items-center px-3.5 bg-admin-surface-3 border-r border-admin-border-strong text-admin-xs font-bold text-admin-text select-none">
                        +91
                      </span>
                      <input
                        id="onboard-mobile"
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        disabled={otpSent}
                        value={mobileNumber}
                        onChange={e => handleMobileEdited(e.target.value)}
                        aria-invalid={Boolean(mobileError) || undefined}
                        aria-describedby="onboard-mobile-error"
                        autoComplete="tel-national"
                        className="w-full px-3.5 bg-transparent text-admin-sm font-semibold text-admin-text placeholder:text-admin-subtle focus:outline-none"
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      disabled={otpLoading || !isMobileValid}
                      onClick={handleSendMobileOtp}
                      className="w-full h-12 rounded-admin bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-fg font-bold text-admin-sm transition-all flex items-center justify-center gap-2 shadow-admin-2 hover:shadow-admin-3 shadow-admin-1"
                    >
                      {otpLoading ? (
                        <><RefreshCw size={16} className="animate-spin" /> Sending Code...</>
                      ) : (
                        <>Get WhatsApp Verification OTP <ArrowRight size={16} /></>
                      )}
                    </button>
                  ) : (
                    /* Inline OTP Form underneath mobile number */
                    <div className="space-y-4 pt-4 border-t border-admin-border animate-fadeIn">
                      <div className="flex items-center justify-between text-admin-xs">
                        <span className="text-admin-muted">
                          Code sent to WhatsApp <strong>+91 {mobileNumber}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpValues(["", "", "", "", "", ""]); autoVerifiedRef.current = "" }}
                          className="text-brand font-bold hover:underline"
                        >
                          Change Number
                        </button>
                      </div>

                      {/* 6 Box Inputs */}
                      <div className="flex justify-between gap-2">
                        {otpValues.map((d, i) => (
                          <input
                            key={i}
                            id={`onboard-otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            autoFocus={i === 0}
                            value={d}
                            onChange={e => handleOtpBoxChange(i, e.target.value)}
                            onKeyDown={e => handleOtpBoxKeyDown(i, e)}
                            onPaste={handleOtpPaste}
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            disabled={verifyLoading || otpLockedOut}
                            aria-label={`Digit ${i + 1} of 6`}
                            aria-invalid={Boolean(mobileError) || undefined}
                            aria-describedby="onboard-mobile-error"
                            className="admin-focus w-11 sm:w-13 h-12 sm:h-14 text-center text-admin-xl font-black rounded-admin border border-admin-border-strong bg-admin-surface-2 text-admin-text focus:border-brand focus:bg-admin-surface transition-all disabled:opacity-50"
                          />
                        ))}
                      </div>

                      {otpLockedOut && (
                        <div
                          role="alert"
                          className="rounded-admin border border-tone-warn-bd bg-tone-warn p-3.5 text-admin-xs text-tone-warn-fg space-y-2"
                        >
                          <div className="font-bold">
                            That is {MAX_OTP_ATTEMPTS} incorrect attempts on this code.
                          </div>
                          <p className="leading-relaxed">
                            For your security this code is now closed. Request a new one below, or call
                            our partner desk on 095790 05645 if the code is not arriving on WhatsApp.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 text-admin-xs text-admin-muted">
                        <span>
                          {canResend
                            ? "Didn't receive the code?"
                            : (
                              // Saying only "disabled" invites repeated tapping.
                              <>Resend available in <span className="admin-num font-bold text-admin-text">{otpTimer}s</span></>
                            )}
                        </span>
                        <button
                          type="button"
                          disabled={!canResend || resending}
                          onClick={handleResendMobileOtp}
                          title={canResend ? undefined : `You can ask for a new code in ${otpTimer} seconds`}
                          className="admin-focus admin-touch text-brand font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
                        >
                          {resending ? "Sending..." : "Resend OTP on WhatsApp"}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={verifyLoading || otpLockedOut || otpValues.join("").length < 6}
                        onClick={handleVerifyInlineOtp}
                        className="w-full h-12 rounded-admin bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-fg font-bold text-admin-sm transition-all flex items-center justify-center gap-2 shadow-admin-2"
                      >
                        {verifyLoading ? (
                          <><RefreshCw size={16} className="animate-spin" /> Verifying...</>
                        ) : (
                          <>Verify OTP &amp; Start Onboarding <ArrowRight size={16} /></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ─── ONBOARDING FLOW STARTS ON SAME SCREEN ─── */
              <div className="space-y-6">
                {/* Verified Mobile Number Strip at Top */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-admin-lg bg-tone-success border border-tone-success-bd text-admin-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={16} className="text-tone-success-fg shrink-0" />
                    <span className="min-w-0">
                      <span className="text-admin-text">Verified </span>
                      <strong className="admin-num font-bold text-admin-text whitespace-nowrap">+91 {mobileNumber}</strong>
                      {resuming && (
                        <span className="block text-admin-2xs text-admin-muted font-medium">Restoring your saved progress…</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDiscardLocalDraft}
                      title="Remove the copy of this application saved in this browser"
                      className="admin-focus admin-touch rounded-admin-sm px-2 py-1 text-admin-xs font-bold text-admin-muted hover:text-admin-text"
                    >
                      Discard draft
                    </button>
                    <button
                      type="button"
                      onClick={handleResetMobile}
                      className="admin-focus admin-touch rounded-admin-sm px-2 py-1 text-admin-xs font-bold text-admin-muted hover:text-admin-text"
                    >
                      Change number
                    </button>
                  </div>
                </div>

                {/*
                  * What was restored, and when. A form that silently refills
                  * itself makes people doubt every value in it.
                  */}
                {restoredNote && !draftConflict && (
                  <div className="flex items-start gap-2 rounded-admin border border-tone-info-bd bg-tone-info px-3 py-2.5 text-admin-xs font-semibold text-tone-info-fg">
                    <Clock size={14} className="mt-px shrink-0" />
                    <span>{restoredNote}</span>
                  </div>
                )}

                {/* Local and server drafts disagreed — say so, and offer the other one. */}
                {draftConflict && (
                  <div className="rounded-admin-lg border border-tone-warn-bd bg-tone-warn p-3.5 text-admin-xs text-tone-warn-fg space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={15} className="mt-px shrink-0" />
                      <div className="space-y-1">
                        <div className="font-bold">Two versions of this application</div>
                        <p className="leading-relaxed">
                          Your account has you on step {draftConflict.serverStep}; this device was left on
                          step {draftConflict.localStep}, {formatWhen(draftConflict.localSavedAt)}. We opened{" "}
                          {draftConflict.applied === "server" ? "the one from your account" : "the one from this device"}.
                        </p>
                      </div>
                    </div>
                    {draftConflict.applied === "server" && (
                      <div className="flex flex-wrap gap-2 pl-6">
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handlePreferLocalDraft}
                        >
                          Use this device&rsquo;s version
                        </AdminButton>
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setDraftConflict(null)}
                        >
                          Keep my account&rsquo;s version
                        </AdminButton>
                      </div>
                    )}
                  </div>
                )}

                <div ref={stepPaneRef} className="space-y-6 pb-2 sm:pb-0">

                {/*
                  * A gated step reached by deep link or a stale tab explains the
                  * gate instead of rendering an empty shell.
                  */}
                {lockReasonFor(currentStep) && (
                  <div className="rounded-admin-lg border border-admin-border bg-admin-surface-2 p-6 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-admin-surface-3 text-admin-muted">
                      <Lock size={20} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-admin-lg font-bold text-admin-text">Step {currentStep} is not open yet</h2>
                      <p className="mx-auto max-w-md text-admin-sm text-admin-muted">{lockReasonFor(currentStep)}</p>
                    </div>
                    <AdminButton
                      type="button"
                      variant="brand"
                      icon={ArrowLeft}
                      onClick={() => goToStep(currentStep === 3 && isStep1Done ? 2 : 1)}
                    >
                      Go to the step that needs finishing
                    </AdminButton>
                  </div>
                )}

                {/* ─── STEP 1: BASIC & BUSINESS DETAILS ─── */}
                {currentStep === 1 && !lockReasonFor(1) && (
                  <form onSubmit={handleStep1Submit} className="space-y-6">
                    <OnboardingStepHeader
                      steps={STEPS}
                      currentStep={1}
                      title="Personal &amp; business information"
                      subtitle="We can fetch details to make your onboarding smoother and faster."
                    />

                    {/* Business Type Selector */}
                    <div className="space-y-2">
                      <label className="block text-admin-xs font-bold text-admin-text uppercase tracking-wider">
                        Select Business Entity Type <span className="text-tone-danger-fg">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: "Individual", label: "Individual / Sole Agent" },
                          { id: "Proprietorship", label: "Proprietorship" },
                          { id: "Partnership", label: "Partnership Firm" },
                          { id: "Private Limited", label: "Private Limited" },
                          { id: "Limited", label: "Public Limited" },
                          { id: "LLP", label: "LLP" },
                        ].map(t => {
                          const isSelected =
                            t.id === "Individual"
                              ? partnerType === "Individual"
                              : partnerType === "Firm" && firmType === t.id
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                if (t.id === "Individual") {
                                  setPartnerType("Individual")
                                } else {
                                  setPartnerType("Firm")
                                  setFirmType(t.id as FirmType)
                                }
                              }}
                              className={cn(
                                "p-3 rounded-admin border text-admin-xs font-bold text-left transition-all",
                                isSelected
                                  ? "bg-brand-soft border-brand text-brand-soft-fg shadow-admin-1"
                                  : "bg-admin-surface border-admin-border text-admin-text hover:bg-admin-surface-2"
                              )}
                            >
                              {t.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Conditional Name Fields */}
                    {partnerType === "Individual" ? (
                      <div className="space-y-1.5">
                        <label className="block text-admin-xs font-bold text-admin-text uppercase">
                          Full Name (as per PAN Card) <span className="text-tone-danger-fg">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                            id="ob-fullName"
                            aria-invalid={invalidField === "ob-fullName" || undefined}
                            aria-describedby={invalidField === "ob-fullName" ? "onboarding-step-error" : undefined}
                          placeholder="e.g. Ramesh Shankar Patil"
                          className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Business / Company Name <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            id="ob-businessName"
                            aria-invalid={invalidField === "ob-businessName" || undefined}
                            aria-describedby={invalidField === "ob-businessName" ? "onboarding-step-error" : undefined}
                            placeholder="e.g. Patil Financial Services"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Contact Person Name <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contactPersonName}
                            onChange={e => setContactPersonName(e.target.value)}
                            id="ob-contactPersonName"
                            aria-invalid={invalidField === "ob-contactPersonName" || undefined}
                            aria-describedby={invalidField === "ob-contactPersonName" ? "onboarding-step-error" : undefined}
                            placeholder="e.g. Ramesh Patil"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email & PAN (PAN without check button) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-admin-xs font-bold text-admin-text uppercase">
                          Email Address <span className="text-tone-danger-fg">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                            id="ob-email"
                            aria-invalid={invalidField === "ob-email" || undefined}
                            aria-describedby={invalidField === "ob-email" ? "onboarding-step-error" : undefined}
                          placeholder="e.g. ramesh@example.com"
                          className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-admin-xs font-bold text-admin-text uppercase">
                          Permanent Account Number (PAN) <span className="text-tone-danger-fg">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={panNumber}
                          onChange={e => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                            id="ob-pan"
                            aria-invalid={invalidField === "ob-pan" || undefined}
                            aria-describedby={invalidField === "ob-pan" ? "onboarding-step-error" : undefined}
                          placeholder="ABCDE1234F"
                          className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-bold text-admin-text uppercase focus:border-brand focus:ring-2 focus:ring-brand-soft"
                        />
                      </div>
                    </div>

                    {/* Date of Birth (Age filter 18 to 80 years) & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-admin-xs font-bold text-admin-text uppercase">
                          Date of Birth (वय १८ ते ८० वर्षे) <span className="text-tone-danger-fg">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={minDobStr}
                          max={maxDobStr}
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                            id="ob-dob"
                            aria-invalid={invalidField === "ob-dob" || undefined}
                            aria-describedby={invalidField === "ob-dob" ? "onboarding-step-error" : undefined}
                          className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                        />
                        <span className="text-admin-2xs text-admin-subtle">Must be between 18 and 80 years old</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-admin-xs font-bold text-admin-text uppercase">
                          Gender <span className="text-tone-danger-fg">*</span>
                        </label>
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Referral Code (Optional) */}
                    <div className="space-y-1.5">
                      <label className="block text-admin-xs font-bold text-admin-text uppercase">
                        Referral / Senior DSA Partner Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={referredByDsaCode}
                        onChange={e => setReferredByDsaCode(e.target.value.toUpperCase())}
                        placeholder="e.g. TSM-REF-1042"
                        className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-semibold text-admin-text uppercase focus:border-brand focus:ring-2 focus:ring-brand-soft"
                      />
                    </div>

                    {/* Address & Pincode */}
                    <div className="space-y-4 pt-4 border-t border-admin-border">
                      <div className="text-admin-sm font-bold text-admin-text">Office / Residential Address</div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            PIN Code <span className="text-tone-danger-fg">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={6}
                              required
                              value={pinCode}
                              onChange={e => handlePincodeChange(e.target.value)}
                            id="ob-pincode"
                            aria-invalid={invalidField === "ob-pincode" || undefined}
                            aria-describedby={invalidField === "ob-pincode" ? "onboarding-step-error" : undefined}
                              placeholder="6-digit Pincode"
                              className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-bold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                            />
                            {pincodeLoading && (
                              <RefreshCw size={15} className="animate-spin text-brand absolute right-3 top-3.5" />
                            )}
                          </div>
                          <div className="min-h-4">
                            {pincodeNote && (
                              <span role="status" className="block text-admin-2xs text-tone-warn-fg">{pincodeNote}</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Address Line 1 (House/Building/Flat No) <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={addressLine1}
                            onChange={e => setAddressLine1(e.target.value)}
                            id="ob-addressLine1"
                            aria-invalid={invalidField === "ob-addressLine1" || undefined}
                            aria-describedby={invalidField === "ob-addressLine1" ? "onboarding-step-error" : undefined}
                            placeholder="e.g. Office No 18, Morya Pride"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">Address Line 2 (Street/Area)</label>
                          <input
                            type="text"
                            value={addressLine2}
                            onChange={e => setAddressLine2(e.target.value)}
                            placeholder="e.g. Mayur Park, Harsul"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            City / District <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            id="ob-city"
                            aria-invalid={invalidField === "ob-city" || undefined}
                            aria-describedby={invalidField === "ob-city" ? "onboarding-step-error" : undefined}
                            placeholder="e.g. Chhatrapati Sambhajinagar"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            State <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={stateName}
                            onChange={e => setStateName(e.target.value)}
                            id="ob-state"
                            aria-invalid={invalidField === "ob-state" || undefined}
                            aria-describedby={invalidField === "ob-state" ? "onboarding-step-error" : undefined}
                            placeholder="e.g. Maharashtra"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand focus:ring-2 focus:ring-brand-soft"
                          />
                        </div>
                      </div>
                    </div>

                    {/*
                      * Sticky on phones so the primary action stays reachable
                      * with the keyboard up, static from sm: where the form
                      * already fits. `bottom-0` plus safe-area padding keeps it
                      * clear of the iOS home indicator.
                      */}
                    <div className="sticky bottom-0 -mx-5 mt-2 flex items-center justify-between gap-3 border-t border-admin-border bg-admin-surface/95 px-5 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-6 sm:backdrop-blur-none">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          saveProgress(1, { fullName, businessName, email, panNumber, dob })
                          window.location.href = "/"
                        }}
                      >
                        Save &amp; exit
                      </AdminButton>
                      <AdminButton
                        type="submit"
                        variant="brand"
                        loading={savingStep}
                        disabled={savingStep}
                        className="flex-1 sm:flex-none sm:px-8"
                      >
                        {savingStep ? "Saving…" : "Continue"}
                        {!savingStep && <ArrowRight size={15} />}
                      </AdminButton>
                    </div>
                  </form>
                )}

                {/* ─── STEP 2: BUSINESS KYC, GST & BANKING (MERGED 2, 3, 4) ─── */}
                {currentStep === 2 && !lockReasonFor(2) && (
                  <form onSubmit={handleStep2Submit} className="space-y-8">
                    <OnboardingStepHeader
                      steps={STEPS}
                      currentStep={2}
                      title="Business KYC, documents &amp; bank details"
                      subtitle="Add GST details (optional), upload identity documents, and link your payout bank account."
                      onBack={() => goToStep(1)}
                      backLabel="Basic details"
                    />

                    {/* SECTION A: GST DETAILS */}
                    <div className="bg-admin-surface-2 border border-admin-border rounded-admin-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building size={18} className="text-brand" />
                          <span className="text-admin-sm font-bold text-admin-text">GST Registration Details</span>
                        </div>
                        <span className="text-admin-2xs font-bold px-2 py-0.5 rounded-full bg-admin-surface-3 text-admin-text">Optional</span>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-admin-xs font-bold text-admin-text">Do you have a GST Registration?</label>
                        <div className="flex gap-3">
                          {["No", "Yes"].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setIsGstRegistered(opt as "Yes" | "No")
                                if (opt === "No") {
                                  setGstValid(false)
                                  setGstin("")
                                }
                              }}
                              className={cn(
                                "px-4 py-2 rounded-admin text-admin-xs font-bold border transition-all",
                                isGstRegistered === opt
                                  ? "bg-brand text-brand-fg border-brand shadow-admin-1"
                                  : "bg-admin-surface text-admin-text border-admin-border-strong hover:bg-admin-surface-3"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isGstRegistered === "Yes" && (
                        <div className="space-y-3 pt-2">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            GSTIN (15 characters) <span className="text-tone-danger-fg">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={15}
                              value={gstin}
                              onChange={e => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                            id="ob-gstin"
                            aria-invalid={invalidField === "ob-gstin" || undefined}
                            aria-describedby={invalidField === "ob-gstin" ? "onboarding-step-error" : undefined}
                              placeholder="27ABCDE1234F1Z5"
                              className="flex-1 h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-bold text-admin-text uppercase focus:border-brand"
                            />
                            <button
                              type="button"
                              disabled={gstVerifying || gstin.length !== 15}
                              onClick={handleVerifyGst}
                              className="px-4 h-11 rounded-admin bg-admin-text text-brand-fg text-admin-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {gstVerifying ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                              <span>Verify GST</span>
                            </button>
                          </div>

                          {gstValid && gstDetails && (
                            <div className="p-3 rounded-admin bg-tone-success border border-tone-success-bd text-admin-xs text-tone-success-fg space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-tone-success-fg" />
                                <span>GST Verified: {gstDetails.tradeName || gstDetails.legalName}</span>
                              </div>
                              <div className="text-admin-2xs text-tone-success-fg">Address: {gstDetails.address}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION B: KYC DOCUMENTS & CROP OPTION */}
                    <div className="bg-admin-surface-2 border border-admin-border rounded-admin-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-brand" />
                          <span className="text-admin-sm font-bold text-admin-text">KYC Identity Documents</span>
                        </div>
                        <span className="text-admin-2xs font-bold px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg">Mandatory</span>
                      </div>

                      <p id="ob-documents" className="text-admin-2xs text-admin-subtle">
                        PDF, JPG, PNG or WebP — up to 5&nbsp;MB per document.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Aadhaar Front */}
                        <div className="bg-admin-surface border border-admin-border rounded-admin p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="text-admin-xs font-bold text-admin-text">Aadhaar Card (Front)</div>
                            <div className="text-admin-2xs text-admin-subtle">Clear photo or scan</div>
                          </div>

                          <DocTile
                            docKey="aadhaarFront"
                            doc={aadhaarFrontDoc}
                            progress={uploadProgress.aadhaarFront}
                            failed={uploadFailed === "aadhaarFront"}
                            onPick={() => setActiveCropModal("aadhaarFront")}
                            onRetry={() => handleRetryUpload("aadhaarFront")}
                          />
                        </div>

                        {/* Aadhaar Back */}
                        <div className="bg-admin-surface border border-admin-border rounded-admin p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="text-admin-xs font-bold text-admin-text">Aadhaar Card (Back)</div>
                            <div className="text-admin-2xs text-admin-subtle">Address side</div>
                          </div>

                          {aadhaarCombined ? (
                            <div className="text-admin-xs font-bold text-admin-muted py-2">Combined on Front</div>
                          ) : (
                            <DocTile
                              docKey="aadhaarBack"
                              doc={aadhaarBackDoc}
                              progress={uploadProgress.aadhaarBack}
                              failed={uploadFailed === "aadhaarBack"}
                              onPick={() => setActiveCropModal("aadhaarBack")}
                              onRetry={() => handleRetryUpload("aadhaarBack")}
                            />
                          )}
                        </div>

                        {/* PAN Card */}
                        <div className="bg-admin-surface border border-admin-border rounded-admin p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="text-admin-xs font-bold text-admin-text">PAN Card Document</div>
                            <div className="text-admin-2xs text-admin-subtle">Front side photo</div>
                          </div>

                          <DocTile
                            docKey="panDoc"
                            doc={panDoc}
                            progress={uploadProgress.panDoc}
                            failed={uploadFailed === "panDoc"}
                            onPick={() => setActiveCropModal("panDoc")}
                            onRetry={() => handleRetryUpload("panDoc")}
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-admin-xs font-medium text-admin-muted">
                        <input
                          type="checkbox"
                          checked={aadhaarCombined}
                          onChange={e => setAadhaarCombined(e.target.checked)}
                          className="w-4 h-4 rounded text-brand accent-[var(--brand)]"
                        />
                        <span>Both sides of Aadhaar Card are on one image / PDF file</span>
                      </label>
                    </div>

                    {/* SECTION C: BANK DETAILS */}
                    <div className="bg-admin-surface-2 border border-admin-border rounded-admin-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={18} className="text-brand" />
                          <span className="text-admin-sm font-bold text-admin-text">Payout Bank Account</span>
                        </div>
                        <span className="text-admin-2xs font-bold px-2 py-0.5 rounded-full bg-tone-success text-tone-success-fg">Direct Transfer</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Account Holder Name <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={accountHolderName}
                            onChange={e => setAccountHolderName(e.target.value)}
                            id="ob-accountHolderName"
                            aria-invalid={invalidField === "ob-accountHolderName" || undefined}
                            aria-describedby={invalidField === "ob-accountHolderName" ? "onboarding-step-error" : undefined}
                            placeholder="Name as per Bank records"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Account Type <span className="text-tone-danger-fg">*</span>
                          </label>
                          <select
                            value={accountType}
                            onChange={e => setAccountType(e.target.value as "Savings" | "Current")}
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-semibold text-admin-text focus:border-brand"
                          >
                            <option value="Savings">Savings Account</option>
                            <option value="Current">Current Account</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Bank Account Number <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                            id="ob-accountNumber"
                            aria-invalid={invalidField === "ob-accountNumber" || undefined}
                            aria-describedby={invalidField === "ob-accountNumber" ? "onboarding-step-error" : undefined}
                            placeholder="Enter bank account number"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-bold text-admin-text focus:border-brand"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            Confirm Account Number <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={confirmAccountNumber}
                            onChange={e => setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))}
                            id="ob-confirmAccountNumber"
                            aria-invalid={invalidField === "ob-confirmAccountNumber" || undefined}
                            aria-describedby={invalidField === "ob-confirmAccountNumber" ? "onboarding-step-error" : undefined}
                            placeholder="Re-enter bank account number"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-bold text-admin-text focus:border-brand"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">
                            IFSC Code <span className="text-tone-danger-fg">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={11}
                            required
                            value={ifscCode}
                            onChange={e => handleIfscChange(e.target.value)}
                            id="ob-ifsc"
                            aria-invalid={invalidField === "ob-ifsc" || undefined}
                            aria-describedby={invalidField === "ob-ifsc" ? "onboarding-step-error" : undefined}
                            placeholder="e.g. SBIN0001234"
                            className="w-full h-11 px-3.5 rounded-admin border border-admin-border-strong bg-admin-surface text-admin-sm font-mono font-bold text-admin-text uppercase focus:border-brand"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-admin-xs font-bold text-admin-text uppercase">Bank &amp; Branch</label>
                          <div className="h-11 px-3.5 rounded-admin border border-admin-border bg-admin-surface-3 flex items-center text-admin-xs font-bold text-admin-text truncate">
                            {ifscLoading ? "Looking up IFSC…" : bankName ? `${bankName} (${branchName})` : "Will auto-populate from IFSC"}
                          </div>
                          <div className="min-h-4">
                            {ifscNote && (
                              <span role="status" className="block text-admin-2xs text-tone-warn-fg">{ifscNote}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={bankVerifying || !accountNumber || !ifscCode}
                          onClick={handleVerifyBankAccount}
                          className="px-4 py-2 bg-admin-text text-brand-fg rounded-admin text-admin-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {bankVerifying ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          <span>Verify Account Holder</span>
                        </button>

                        {bankVerified && (
                          <span className="text-admin-xs font-bold text-tone-success-fg flex items-center gap-1">
                            <CheckCircle2 size={14} /> Bank Account Verified ✓
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sticky bottom-0 -mx-5 mt-2 flex items-center justify-between gap-2 border-t border-admin-border bg-admin-surface/95 px-5 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-6 sm:backdrop-blur-none">
                      <div className="flex items-center gap-2">
                        <AdminButton type="button" variant="secondary" icon={ArrowLeft} onClick={() => goToStep(1)}>
                          Back
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          className="hidden sm:inline-flex"
                          onClick={() => { window.location.href = "/" }}
                        >
                          Save &amp; exit
                        </AdminButton>
                      </div>
                      <AdminButton
                        type="submit"
                        variant="brand"
                        loading={savingStep}
                        disabled={savingStep}
                        className="flex-1 sm:flex-none sm:px-8"
                      >
                        {savingStep ? "Saving…" : "Continue"}
                        {!savingStep && <ArrowRight size={15} />}
                      </AdminButton>
                    </div>
                  </form>
                )}

                {/* ─── STEP 3: REVIEW, MOU & SUBMIT ─── */}
                {currentStep === 3 && !lockReasonFor(3) && (
                  <form onSubmit={handleFinalSubmit} className="space-y-8">
                    <OnboardingStepHeader
                      steps={STEPS}
                      currentStep={3}
                      title="Review &amp; sign MOU agreement"
                      subtitle="Check your details and execute the official digital Partner MOU before submitting."
                      onBack={() => goToStep(2)}
                      backLabel="Business & KYC"
                    />

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-admin-xs">
                      {/* Personal & Business */}
                      <div className="p-4 rounded-admin-lg bg-admin-surface-2 border border-admin-border space-y-2">
                        <div className="font-bold text-admin-text text-admin-sm flex items-center justify-between">
                          <span>Applicant Details</span>
                          <button type="button" onClick={() => setCurrentStep(1)} className="text-brand font-bold text-admin-xs hover:underline">Edit</button>
                        </div>
                        <div>Name: <strong>{fullName || contactPersonName}</strong></div>
                        <div>Entity: <strong>{partnerType} {partnerType === "Firm" ? `(${firmType})` : ""}</strong></div>
                        {partnerType === "Firm" && <div>Firm Name: <strong>{businessName}</strong></div>}
                        <div>Email: <strong>{email}</strong></div>
                        <div>PAN: <strong className="font-mono">{panNumber.slice(0, 5)}••••{panNumber.slice(9)}</strong> (Masked)</div>
                        <div>DOB: <strong>{dob}</strong></div>
                        <div>Mobile: <strong>+91 {mobileNumber}</strong></div>
                      </div>

                      {/* Address & Bank */}
                      <div className="p-4 rounded-admin-lg bg-admin-surface-2 border border-admin-border space-y-2">
                        <div className="font-bold text-admin-text text-admin-sm flex items-center justify-between">
                          <span>Bank &amp; Address Details</span>
                          <button type="button" onClick={() => setCurrentStep(2)} className="text-brand font-bold text-admin-xs hover:underline">Edit</button>
                        </div>
                        <div>Address: <strong>{addressLine1}, {city}, {stateName} - {pinCode}</strong></div>
                        <div>Bank: <strong>{bankName || "Verified Bank"}</strong></div>
                        <div>A/C Number: <strong className="font-mono">••••••••{accountNumber.slice(-4)}</strong> (Masked)</div>
                        <div>IFSC: <strong className="font-mono">{ifscCode}</strong></div>
                        <div>GST: <strong>{isGstRegistered === "Yes" ? gstin : "Not Registered"}</strong></div>
                      </div>

                      {/* KYC Documents */}
                      <div className="p-4 rounded-admin-lg bg-admin-surface-2 border border-admin-border space-y-2 sm:col-span-2">
                        <div className="font-bold text-admin-text text-admin-sm flex items-center justify-between">
                          <span>KYC Documents</span>
                          <button type="button" onClick={() => setCurrentStep(2)} className="text-brand font-bold text-admin-xs hover:underline">Edit</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { label: "Aadhaar (Front)", doc: aadhaarFrontDoc },
                            { label: aadhaarCombined ? "Aadhaar (Both sides)" : "Aadhaar (Back)", doc: aadhaarCombined ? aadhaarFrontDoc : aadhaarBackDoc },
                            { label: "PAN Card", doc: panDoc },
                          ].map(({ label, doc }) => (
                            <div key={label} className="flex items-center gap-1.5">
                              {doc ? (
                                <CheckCircle2 size={14} className="text-tone-success-fg shrink-0" />
                              ) : (
                                <AlertCircle size={14} className="text-tone-warn-fg shrink-0" />
                              )}
                              <span className="truncate">
                                {label}: <strong>{doc ? "Uploaded" : "Pending"}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-admin-2xs text-admin-muted">
                          Source: <strong>{docUploadMethod === "digilocker" ? "DigiLocker (verified)" : "Manual upload"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* MOU Agreement Section */}
                    <div id="ob-agreement" className="p-5 rounded-admin-lg bg-brand-soft border-2 border-brand-ring space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-brand" />
                          <div>
                            <div className="text-admin-sm font-black text-admin-text">Partner Memorandum of Understanding (MOU)</div>
                            <div className="text-admin-xs text-admin-muted">Official legal partnership agreement with Techstar Money Solution Pvt. Ltd.</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Requirement: Preview MOU before signing */}
                        <a
                          href={`/api/partner/agreement/pdf?mobile=${mobileNumber}&preview=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-admin bg-admin-surface border border-admin-border-strong hover:bg-admin-surface-3 text-admin-text text-admin-xs font-bold flex items-center gap-1.5 shadow-admin-1"
                        >
                          <Eye size={15} className="text-brand" />
                          <span>Preview MOU Agreement (स्वाक्षरीपूर्वी पाहा)</span>
                        </a>

                        {/* PartnerAgreementModal: handles OTP signature & once signed NEVER shows sign option again! */}
                        <PartnerAgreementModal
                          partnerData={{
                            mobileNumber: mobileNumber,
                            email: email,
                            fullName: fullName || contactPersonName,
                            dsaCode: "TSM-PARTNER",
                            agreementSigned: isAgreementSigned,
                          }}
                          onSigned={() => {
                            setIsAgreementSigned(true)
                          }}
                        />
                      </div>
                    </div>

                    {/* Declarations */}
                    <div id="ob-declarations" className="space-y-3 p-4 rounded-admin-lg bg-admin-surface-2 border border-admin-border">
                      <label className="flex items-start gap-2.5 cursor-pointer text-admin-xs font-semibold text-admin-text">
                        <input
                          type="checkbox"
                          checked={declareTruth}
                          onChange={e => setDeclareTruth(e.target.checked)}
                          className="w-4 h-4 rounded mt-0.5 accent-[var(--brand)]"
                        />
                        <span>I confirm that all personal, business, KYC, and bank details provided are true, complete, and authentic.</span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer text-admin-xs font-semibold text-admin-text">
                        <input
                          type="checkbox"
                          checked={declareTerms}
                          onChange={e => setDeclareTerms(e.target.checked)}
                          className="w-4 h-4 rounded mt-0.5 accent-[var(--brand)]"
                        />
                        <span>I accept the Techstar Money Solution Private Limited DSA Partner Terms, Code of Conduct, and Operating Policies.</span>
                      </label>
                    </div>

                    <div className="sticky bottom-0 -mx-5 mt-2 flex items-center justify-between gap-2 border-t border-admin-border bg-admin-surface/95 px-5 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-6 sm:backdrop-blur-none">
                      <AdminButton type="button" variant="secondary" icon={ArrowLeft} onClick={() => goToStep(2)}>
                        Back
                      </AdminButton>
                      <AdminButton
                        type="submit"
                        variant="brand"
                        loading={submitting}
                        disabled={submitting || !declareTruth || !declareTerms || !isAgreementSigned}
                        className="flex-1 sm:flex-none sm:px-8"
                      >
                        {submitting ? "Submitting…" : "Submit application"}
                      </AdminButton>
                    </div>
                  </form>
                )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Crop Modal for KYC Documents */}
      <ImageCropModal
        isOpen={Boolean(activeCropModal)}
        title={
          activeCropModal === "aadhaarFront"
            ? "Crop Aadhaar Card (Front)"
            : activeCropModal === "aadhaarBack"
            ? "Crop Aadhaar Card (Back)"
            : "Crop PAN Card"
        }
        onClose={() => setActiveCropModal(null)}
        onConfirm={handleDocumentCropped}
        onReject={(reason) => {
          // A file rejected inside the modal is still this step's problem to
          // report, so it lands in the same region as every other step error.
          console.error("[onboarding] document rejected before upload", { docType: activeCropModal, reason })
          setStepErrorKind("validation")
          setStepError(reason)
        }}
      />

      <PartnerPortalFooter />
    </div>
  )
}
