"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
} from "lucide-react"

import WhatsAppOtpModal from "@/components/onboarding/WhatsAppOtpModal"
import { PartnerPortalHeader, PartnerPortalFooter } from "@/components/layout/PartnerPortalShell"
import ImageCropModal from "@/components/onboarding/ImageCropModal"
import {
  ChoiceGroup,
  DocSlot,
  DocStatus,
  ERROR_SLOT,
  FieldGrid,
  ReviewRow,
  StepHeader,
  StepNav,
  Stepper,
  type DocMeta,
} from "@/components/onboarding/wizard"
import { AdminButton, AdminLinkButton } from "@/components/admin/ui"
import { Field, Select, TextInput } from "@/components/admin/leads/fields"
import { cn } from "@/lib/utils"

type PartnerType = "Individual" | "Firm"
type FirmType = "Proprietorship" | "Partnership" | "Private Limited" | "Limited" | "LLP"
type DocKey = "aadhaarFront" | "aadhaarBack" | "panDoc"

const PARTNER_TYPES = ["Individual", "Firm"] as const
const FIRM_TYPES = ["Proprietorship", "Partnership", "Private Limited", "Limited", "LLP"] as const
const YES_NO = ["Yes", "No"] as const

const STEP_TITLES = [
  "Basic Details",
  "Business & PAN",
  "Contact Person",
  "Office Address",
  "GST Registration",
  "KYC Documents",
  "Bank Details",
  "Review & Submit",
] as const

/** Shape of one entry in the india-post pincode lookup. */
type PostOffice = { Name?: string; District?: string; Block?: string; State?: string }

/**
 * Reads a message off an unknown throw without widening it to `any`.
 * `fetch` and the API helpers here all reject with Error-shaped values, but
 * nothing in the type system guarantees it — so narrow rather than assert.
 */
function messageFor(err: unknown, fallback: string): string {
  const detail = (err as { message?: string })?.message
  return detail || fallback
}

/** Controls are thumb-height here; the whole flow is filled on a phone. */
const INPUT = "h-11 sm:h-10"

/** The designation a given entity type implies, before any manual override. */
function defaultDesignation(pt: PartnerType, ft: FirmType): string {
  if (pt === "Individual") return "Individual"
  switch (ft) {
    case "Proprietorship":
      return "Proprietor"
    case "Partnership":
      return "Partner"
    case "Private Limited":
    case "Limited":
      return "Director"
    case "LLP":
      return "Designated Partner"
    default:
      return "Authorized Signatory"
  }
}

export default function OnboardingPage() {
  // ─── Screen 1 & 2: Mobile & WhatsApp OTP Verification ───
  const [mobileNumber, setMobileNumber] = useState("")
  const [isMobileVerified, setIsMobileVerified] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [mobileError, setMobileError] = useState<string | null>(null)

  // ─── Stepper Counter (1 to 8) ───
  const [currentStep, setCurrentStep] = useState(1)
  const [savingStep, setSavingStep] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  // ─── Step 1: Basic Details ───
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  // ─── Step 2: Business & PAN ───
  const [partnerType, setPartnerType] = useState<PartnerType>("Individual")
  const [firmType, setFirmType] = useState<FirmType>("Proprietorship")
  const [panNumber, setPanNumber] = useState("")
  const [panValid, setPanValid] = useState(false)
  const [panChecking, setPanChecking] = useState(false)
  const [panDuplicateError, setPanDuplicateError] = useState<string | null>(null)

  // ─── Step 3: Contact Person Details ───
  const [contactPersonName, setContactPersonName] = useState("")
  const [designation, setDesignation] = useState("Individual")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState("Male")

  // ─── Step 4: Office Address Details ───
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [area, setArea] = useState("")
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [stateName, setStateName] = useState("")
  const [pinCode, setPinCode] = useState("")
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeAreas, setPincodeAreas] = useState<string[]>([])

  // ─── Step 5: GST Registration ───
  const [isGstRegistered, setIsGstRegistered] = useState<"Yes" | "No">("No")
  const [gstin, setGstin] = useState("")
  const [gstValid, setGstValid] = useState(false)
  const [gstVerifying, setGstVerifying] = useState(false)

  // ─── Step 6: KYC Document Uploads ───
  const [aadhaarFrontDoc, setAadhaarFrontDoc] = useState<DocMeta | null>(null)
  const [aadhaarBackDoc, setAadhaarBackDoc] = useState<DocMeta | null>(null)
  const [aadhaarCombined, setAadhaarCombined] = useState(false) // both sides on 1 image/PDF
  const [panDoc, setPanDoc] = useState<DocMeta | null>(null)
  const [activeCropModal, setActiveCropModal] = useState<DocKey | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // ─── Step 7: Bank Details ───
  const [accountHolderName, setAccountHolderName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [bankName, setBankName] = useState("")
  const [branchName, setBranchName] = useState("")
  const [accountType, setAccountType] = useState<"Savings" | "Current">("Savings")
  const [ifscLoading, setIfscLoading] = useState(false)
  const [ifscValid, setIfscValid] = useState(false)
  const [bankVerificationStatus] = useState<"pending" | "verified">("pending")

  // ─── Step 8: Review & Declarations ───
  const [declareTruth, setDeclareTruth] = useState(false)
  const [declareTerms, setDeclareTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ─── Final Success Screen ───
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null)

  /*
   * Move focus to the step's first control whenever the step changes.
   *
   * Without this, advancing left focus on the Continue button, which the
   * remount then destroyed — dropping focus to <body>, so a keyboard or screen
   * reader user restarted from the top of the document on all eight steps.
   * Skipped on first paint so the page does not steal focus on load.
   */
  const stepRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const first = stepRef.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]):not([readonly]), select, textarea"
    )
    first?.focus()
  }, [currentStep])

  /*
   * Designation follows the entity type, but is reset from the two controls
   * that change it rather than from an effect watching them.
   *
   * As an effect it also fired after a draft was resumed, overwriting the saved
   * designation with the type's default before anyone saw it — so picking
   * "Authorized Signatory", leaving, and coming back silently reverted you to
   * "Director". Resetting where the change actually happens keeps the reset on
   * user edits and leaves a resumed draft alone.
   */
  const applyPartnerType = (next: PartnerType) => {
    setPartnerType(next)
    setPanValid(false)
    setDesignation(defaultDesignation(next, firmType))
  }

  const applyFirmType = (next: FirmType) => {
    setFirmType(next)
    setDesignation(defaultDesignation(partnerType, next))
  }

  // Designation options by partner/firm type
  const getDesignationOptions = () => {
    if (partnerType === "Individual") {
      return ["Individual", "Proprietor"]
    }
    switch (firmType) {
      case "Proprietorship":
        return ["Proprietor", "Authorized Representative"]
      case "Partnership":
        return ["Partner", "Authorized Partner", "Authorized Signatory"]
      case "Private Limited":
      case "Limited":
        return ["Director", "Authorized Signatory"]
      case "LLP":
        return ["Designated Partner", "Partner", "Authorized Signatory"]
      default:
        return ["Authorized Signatory", "Representative"]
    }
  }

  // ─── 1. Send WhatsApp OTP ───
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setMobileError(null)

    const cleanNumber = mobileNumber.replace(/\D/g, "")
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      setMobileError("Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).")
      return
    }

    setOtpLoading(true)
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanNumber }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to send WhatsApp verification OTP.")
      }

      setShowOtpModal(true)
    } catch (err) {
      setMobileError(messageFor(err, "Failed to connect to WhatsApp OTP service."))
    } finally {
      setOtpLoading(false)
    }
  }

  // ─── 2. On OTP Verified ───
  const handleOtpVerified = async () => {
    setShowOtpModal(false)
    setIsMobileVerified(true)
    setCurrentStep(1)

    // Try loading any previous draft
    try {
      const res = await fetch(`/api/onboarding/resume?mobile=${mobileNumber}`)
      const data = await res.json()
      const app = data.data || data.application
      if (res.ok && app) {
        if (app.currentStep && app.currentStep >= 1 && app.currentStep <= 8) {
          setCurrentStep(app.currentStep)
        }
        if (app.fullName) setFullName(app.fullName)
        if (app.email) setEmail(app.email)
        if (app.partnerType) setPartnerType(app.partnerType)
        if (app.firmType) setFirmType(app.firmType)
        if (app.panNumber) {
          setPanNumber(app.panNumber)
          setPanValid(true)
        }
        if (app.contactPersonName) setContactPersonName(app.contactPersonName)
        if (app.designation) setDesignation(app.designation)
        if (app.dob) setDob(app.dob)
        if (app.gender) setGender(app.gender)
        if (app.addressLine1) setAddressLine1(app.addressLine1)
        if (app.addressLine2) setAddressLine2(app.addressLine2)
        if (app.area) setArea(app.area)
        if (app.city) setCity(app.city)
        if (app.district) setDistrict(app.district)
        if (app.stateName) setStateName(app.stateName)
        if (app.pinCode) setPinCode(app.pinCode)
        if (app.isGstRegistered) setIsGstRegistered(app.isGstRegistered)
        if (app.gstin) {
          setGstin(app.gstin)
          setGstValid(true)
        }
        if (app.documents?.aadhaarFrontDoc) setAadhaarFrontDoc(app.documents.aadhaarFrontDoc)
        if (app.documents?.aadhaarBackDoc) setAadhaarBackDoc(app.documents.aadhaarBackDoc)
        if (app.documents?.aadhaarDoc) {
          // old single-doc resume
          setAadhaarFrontDoc(app.documents.aadhaarDoc)
          setAadhaarCombined(true)
        }
        if (app.documents?.panDoc) setPanDoc(app.documents.panDoc)
        if (app.bankDetails) {
          setAccountHolderName(app.bankDetails.accountHolderName || "")
          setAccountNumber(app.bankDetails.accountNumber || "")
          setConfirmAccountNumber(app.bankDetails.accountNumber || "")
          setIfscCode(app.bankDetails.ifsc || "")
          setBankName(app.bankDetails.bankName || "")
          setBranchName(app.bankDetails.branchName || "")
          setAccountType(app.bankDetails.accountType || "Savings")
          if (app.bankDetails.ifsc) setIfscValid(true)
        }
      }
    } catch (e) {
      console.warn("Could not resume draft:", e)
    }
  }

  // ─── 3. Save Progress to Backend ───
  const saveProgress = async (stepNum: number, stepPayload: Record<string, unknown>) => {
    setSavingStep(true)
    setStepError(null)
    try {
      const res = await fetch("/api/onboarding/save-step", {
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
      setStepError(messageFor(err, "Failed to save progress. Please try again."))
      return false
    } finally {
      setSavingStep(false)
    }
  }

  // ─── Step 1 Submit ───
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setStepError("Full Name is required.")
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStepError("Please provide a valid Email Address.")
      return
    }

    const ok = await saveProgress(2, {
      fullName: fullName.trim(),
      email: email.trim(),
      mobileNumber,
      isMobileVerified: true,
    })
    if (ok) {
      if (!contactPersonName.trim()) {
        setContactPersonName(fullName.trim())
      }
      setCurrentStep(2)
    }
  }

  // ─── Step 2: Check PAN ───
  const handleCheckPan = async () => {
    setStepError(null)
    setPanDuplicateError(null)
    const cleanPan = panNumber.trim().toUpperCase()

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(cleanPan)) {
      setStepError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).")
      return
    }

    setPanChecking(true)
    try {
      const res = await fetch("/api/onboarding/pan/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber: cleanPan, mobileNumber }),
      })

      const data = await res.json()
      if (!res.ok || data.isDuplicate) {
        setPanDuplicateError(
          data.error || "This PAN is already linked with an existing Techstar Money partner account."
        )
        setPanValid(false)
      } else {
        setPanValid(true)
        setPanNumber(cleanPan)
      }
    } catch (err) {
      setStepError(messageFor(err, "Failed to check PAN status."))
    } finally {
      setPanChecking(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!panValid) {
      setStepError("Please verify your PAN number before continuing.")
      return
    }

    const ok = await saveProgress(3, {
      partnerType,
      firmType: partnerType === "Firm" ? firmType : null,
      panNumber: panNumber.trim().toUpperCase(),
      panValid: true,
    })
    if (ok) {
      if (!contactPersonName.trim()) {
        setContactPersonName(fullName.trim())
      }
      setCurrentStep(3)
    }
  }

  // ─── Step 3 Submit ───
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactPersonName.trim()) {
      setStepError("Contact Person Name is required.")
      return
    }
    if (!dob) {
      setStepError("Date of Birth is required.")
      return
    }

    // Age validation (minimum 18 years old)
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18) {
      setStepError("Applicant must be at least 18 years old to register as a DSA partner.")
      return
    }

    const ok = await saveProgress(4, {
      contactPersonName: contactPersonName.trim(),
      designation,
      dob,
      gender,
    })
    if (ok) setCurrentStep(4)
  }

  // ─── Step 4: Pincode API auto-fill ───
  const handlePincodeChange = async (value: string) => {
    const clean = value.replace(/\D/g, "")
    setPinCode(clean)
    if (clean.length !== 6) {
      setPincodeAreas([])
      return
    }
    setPincodeLoading(true)
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`)
      const data = await res.json()
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po: PostOffice[] = data[0].PostOffice
        // City / District / State from first result
        setCity(po[0].District || po[0].Block || "")
        setDistrict(po[0].District || "")
        setStateName(po[0].State || "")
        // Unique area list for dropdown
        const areas = [...new Set(po.map(p => p.Name).filter((n): n is string => Boolean(n)))]
        setPincodeAreas(areas)
        if (areas.length === 1) setArea(areas[0])
        else setArea("")
      }
    } catch {
      // silently ignore
    } finally {
      setPincodeLoading(false)
    }
  }

  // ─── Step 4 Submit ───
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressLine1.trim() || !city.trim() || !district.trim() || !stateName.trim() || !pinCode.trim()) {
      setStepError("Please fill in all mandatory address fields marked with *.")
      return
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      setStepError("Please enter a valid 6-digit PIN code.")
      return
    }

    const ok = await saveProgress(5, {
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      area: area.trim(),
      city: city.trim(),
      district: district.trim(),
      stateName: stateName.trim(),
      pinCode: pinCode.trim(),
    })
    if (ok) setCurrentStep(5)
  }

  // ─── Step 5: GST Verification & Submit ───
  const handleVerifyGst = () => {
    const cleanGst = gstin.trim().toUpperCase()
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstRegex.test(cleanGst)) {
      setStepError("Please enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).")
      setGstValid(false)
      return
    }
    setGstVerifying(true)
    setTimeout(() => {
      setGstValid(true)
      setGstin(cleanGst)
      setGstVerifying(false)
      setStepError(null)
    }, 600)
  }

  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isGstRegistered === "Yes" && !gstValid) {
      setStepError("Please verify your GSTIN or select 'No' if not GST registered.")
      return
    }

    const ok = await saveProgress(6, {
      isGstRegistered,
      gstin: isGstRegistered === "Yes" ? gstin.trim().toUpperCase() : null,
      gstValid: isGstRegistered === "Yes" ? gstValid : false,
    })
    if (ok) setCurrentStep(6)
  }

  // ─── Step 6: KYC Document Upload Handler ───
  const handleDocumentCropped = async (file: File) => {
    if (!activeCropModal) return
    const docType = activeCropModal
    setUploadingDoc(true)
    setStepError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("documentType", docType)
    formData.append("mobileNumber", mobileNumber)

    try {
      const res = await fetch("/api/onboarding/document/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Document upload failed")

      if (docType === "aadhaarFront") {
        setAadhaarFrontDoc(data.document)
        // If combined flag, also populate back slot
        if (aadhaarCombined) setAadhaarBackDoc(data.document)
      } else if (docType === "aadhaarBack") {
        setAadhaarBackDoc(data.document)
      } else if (docType === "panDoc") {
        setPanDoc(data.document)
      }
    } catch (err) {
      setStepError(messageFor(err, "Failed to upload document."))
    } finally {
      setUploadingDoc(false)
      setActiveCropModal(null)
    }
  }

  const handleStep6Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aadhaarFrontDoc) {
      setStepError("Please upload Aadhaar Card (Front side is mandatory).")
      return
    }
    if (!aadhaarCombined && !aadhaarBackDoc) {
      setStepError('Please upload Aadhaar Card Back side, or check "Both sides on one image/PDF".')
      return
    }
    if (!panDoc) {
      setStepError("PAN Card document upload is mandatory.")
      return
    }

    const ok = await saveProgress(7, {
      documents: {
        aadhaarFrontDoc,
        aadhaarBackDoc: aadhaarCombined ? aadhaarFrontDoc : aadhaarBackDoc,
        aadhaarCombined,
        panDoc,
      },
    })
    if (ok) setCurrentStep(7)
  }

  // ─── Step 7: IFSC Lookup ───
  const handleIfscLookup = async (code: string) => {
    const cleanIfsc = code.trim().toUpperCase()
    setIfscCode(cleanIfsc)
    if (cleanIfsc.length !== 11) {
      setIfscValid(false)
      return
    }

    setIfscLoading(true)
    setStepError(null)
    try {
      const res = await fetch(`/api/onboarding/ifsc?code=${cleanIfsc}`)
      const data = await res.json()

      if (!res.ok || !data.valid) {
        setIfscValid(false)
        setStepError(data.error || "Invalid IFSC code. Bank details not found.")
      } else {
        setIfscValid(true)
        setBankName(data.bank || "")
        setBranchName(data.branch || "")
        setStepError(null)
      }
    } catch {
      setIfscValid(false)
      setStepError("Could not fetch bank details from Razorpay IFSC service.")
    } finally {
      setIfscLoading(false)
    }
  }

  const handleStep7Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountHolderName.trim()) {
      setStepError("Account Holder Name is required.")
      return
    }
    if (!accountNumber.trim() || accountNumber.length < 9) {
      setStepError("Please enter a valid Bank Account Number.")
      return
    }
    if (accountNumber !== confirmAccountNumber) {
      setStepError("Account Number and Confirmation do not match.")
      return
    }
    if (!ifscValid || !bankName) {
      setStepError("Please enter a valid 11-digit IFSC code.")
      return
    }

    const ok = await saveProgress(8, {
      bankDetails: {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifscCode.trim().toUpperCase(),
        bankName,
        branchName,
        accountType,
        verificationStatus: bankVerificationStatus,
      },
    })
    if (ok) setCurrentStep(8)
  }

  // ─── Step 8: Final Submission ───
  const handleFinalSubmit = async () => {
    if (!declareTruth || !declareTerms) {
      setStepError("Please confirm all declaration and terms checkboxes before submitting.")
      return
    }

    setSubmitting(true)
    setStepError(null)
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          agreementConsent: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit application")

      setSubmittedAppId(data.applicationId)
    } catch (err) {
      setStepError(messageFor(err, "Failed to submit application. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  const back = useCallback((to: number) => () => setCurrentStep(to), [])

  // ─── Render Success Screen ───
  if (submittedAppId) {
    return (
      <div className="partner-root min-h-dvh flex bg-admin-bg">
        <main className="flex-1 flex w-full px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="m-auto w-full max-w-xl bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 p-6 text-center space-y-5">
            <span className="mx-auto w-16 h-16 rounded-full bg-tone-success text-tone-success-fg border border-tone-success-bd flex items-center justify-center">
              <CheckCircle2 size={32} />
            </span>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tone-warn text-tone-warn-fg border border-tone-warn-bd text-admin-2xs font-semibold">
                <Clock size={12} /> Under review
              </span>
              <h1 className="text-admin-2xl font-semibold tracking-tight text-admin-text">
                Application submitted
              </h1>
              <p className="max-w-md mx-auto text-admin-sm text-admin-muted leading-relaxed">
                Your DSA partner application has been received. Our compliance team will review your
                details and documents. Approval takes up to 24 hours.
              </p>
            </div>

            <div className="bg-admin-surface-2 border border-admin-border rounded-admin p-4 space-y-1">
              <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
                Your application ID
              </span>
              <span className="block admin-num text-admin-2xl font-semibold tracking-wide text-admin-text">
                {submittedAppId}
              </span>
              <p className="text-admin-xs text-admin-subtle pt-1">
                A confirmation receipt with tracking details has been sent to your WhatsApp number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <AdminLinkButton
                href={`/application-status?id=${submittedAppId}`}
                variant="primary"
                className="w-full"
              >
                Track application <ArrowRight size={15} />
              </AdminLinkButton>
              <a
                href="https://wa.me/917020646007?text=Hello%20Techstar%20Money%20Team,%20I%20have%20submitted%20my%20DSA%20Partner%20Application%20ID:%20"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-focus w-full inline-flex items-center justify-center gap-2 h-11 sm:h-9 px-4 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-sm font-semibold text-admin-text hover:bg-admin-surface-2 transition-colors"
              >
                <MessageSquare size={15} className="text-admin-accent" /> Contact support
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Render Pre-Verification Screen (Mobile entry + OTP modal) ───
  if (!isMobileVerified) {
    const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber.replace(/\D/g, ""))

    return (
      <div className="partner-root min-h-dvh flex flex-col bg-admin-bg">
        <PartnerPortalHeader subtitle="DSA Partner Onboarding" rightLinkLabel="Partner Login" rightLinkHref="/partner/login" />

        <main className="flex-1 flex w-full px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="m-auto w-full max-w-4xl bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/*
             * `data-admin-theme="dark"` re-points the --admin-* properties in
             * this subtree, so the value panel is the CRM's own dark surface
             * rather than a second palette invented for one screen.
             */}
            <div
              data-admin-theme="dark"
              className="md:col-span-5 bg-admin-bg text-admin-text p-6 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <span className="inline-block px-2.5 py-1 rounded-full bg-admin-accent-soft text-admin-accent border border-admin-border text-admin-2xs font-semibold uppercase tracking-wide">
                  DSA Partner Program
                </span>
                <h2 className="text-admin-xl font-semibold tracking-tight text-admin-text leading-snug">
                  Grow your financial services business
                </h2>
                <p className="text-admin-sm text-admin-muted leading-relaxed">
                  Join 500+ certified loan partners across Maharashtra. Access 50+ leading banks,
                  digital lead management, and quick payouts.
                </p>

                <ul className="space-y-2 pt-1">
                  {[
                    "Zero setup fees or hidden charges",
                    "Instant digital onboarding with Aadhaar Esign",
                    "Industry-best commission slabs on disbursals",
                    "Dedicated Relationship Manager file support",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-admin-sm text-admin-muted">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-admin-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="pt-4 border-t border-admin-border text-admin-2xs text-admin-subtle">
                100% secure and compliant financial portal
              </p>
            </div>

            <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-center gap-5">
              <div>
                <h1 className="text-admin-2xl font-semibold tracking-tight text-admin-text">
                  Become a Techstar Money partner
                </h1>
                <p className="text-admin-sm text-admin-muted mt-1">
                  Start your journey and grow your financial services business.
                </p>
              </div>

              {mobileError && (
                <p
                  role="alert"
                  className="flex items-start gap-2 px-3 py-2.5 rounded-admin-sm bg-tone-danger border border-tone-danger-bd text-tone-danger-fg text-admin-sm"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {mobileError}
                </p>
              )}

              <form onSubmit={handleSendOtp} className="space-y-3" noValidate>
                <div>
                  <Field label="Mobile number" hint="We send a 6-digit WhatsApp OTP to verify this number.">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-sm text-admin-muted pointer-events-none select-none">
                        +91
                      </span>
                      <TextInput
                        autoFocus
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        autoComplete="tel"
                        value={mobileNumber}
                        onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                        aria-invalid={mobileNumber.length > 0 && !isMobileValid}
                        aria-describedby="onboarding-mobile-error"
                        className={cn(INPUT, "admin-num pl-11")}
                      />
                    </div>
                  </Field>
                  <span id="onboarding-mobile-error" role="alert" className={ERROR_SLOT}>
                    {mobileNumber.length > 0 && !isMobileValid
                      ? "Enter a valid 10-digit Indian mobile number."
                      : ""}
                  </span>
                </div>

                <AdminButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={otpLoading}
                  disabled={otpLoading || !isMobileValid}
                >
                  Get started
                  {!otpLoading && <ArrowRight size={15} />}
                </AdminButton>
              </form>

              <p className="pt-3 border-t border-admin-border text-center text-admin-sm text-admin-muted">
                Already registered?{" "}
                <Link
                  href="/partner/login"
                  className="admin-focus rounded-admin-sm font-semibold text-admin-accent hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </main>

        <PartnerPortalFooter />

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

  // ─── 8-STEP ONBOARDING WIZARD ───
  return (
    <div className="partner-root min-h-dvh flex flex-col bg-admin-bg">
      <PartnerPortalHeader subtitle="DSA Partner Onboarding" mobileNumber={mobileNumber} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 space-y-4">
        <Stepper titles={STEP_TITLES} current={currentStep} onJump={setCurrentStep} />

        {stepError && (
          <p
            role="alert"
            className="flex items-start gap-2 px-3 py-2.5 rounded-admin-sm bg-tone-danger border border-tone-danger-bd text-tone-danger-fg text-admin-sm"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {stepError}
          </p>
        )}

        <div
          ref={stepRef}
          className="bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-1 p-4 sm:p-6"
        >
          {/* ── STEP 1: BASIC DETAILS ── */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5" noValidate>
              <StepHeader
                title="Basic details"
                description="Your primary contact information."
              />

              <FieldGrid>
                <Field label="Full name (as per PAN card)" className="sm:col-span-2">
                  <TextInput
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    autoComplete="name"
                    className={INPUT}
                  />
                </Field>

                <Field label="Email address">
                  <TextInput
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ramesh.sharma@gmail.com"
                    autoComplete="email"
                    className={INPUT}
                  />
                </Field>

                <Field label="Mobile number">
                  <div className="relative">
                    <TextInput
                      disabled
                      value={`+91 ${mobileNumber}`}
                      className={cn(INPUT, "admin-num pr-28 bg-admin-surface-2")}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tone-success text-tone-success-fg border border-tone-success-bd text-admin-2xs font-semibold">
                      <Check size={11} /> Verified
                    </span>
                  </div>
                </Field>
              </FieldGrid>

              <StepNav loading={savingStep} disabled={savingStep} />
            </form>
          )}

          {/* ── STEP 2: BUSINESS & PAN ── */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5" noValidate>
              <StepHeader
                title="Business & PAN details"
                description="Your registration entity type, and PAN verification."
              />

              <ChoiceGroup
                label="Partner entity type"
                value={partnerType}
                options={PARTNER_TYPES}
                onChange={applyPartnerType}
                icons={{ Individual: User, Firm: Building }}
              />

              {partnerType === "Firm" && (
                <ChoiceGroup
                  label="Firm type"
                  value={firmType}
                  options={FIRM_TYPES}
                  onChange={applyFirmType}
                  columns={3}
                />
              )}

              <div>
                <Field label={partnerType === "Individual" ? "Individual PAN number" : "Firm PAN number"}>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <TextInput
                      maxLength={10}
                      value={panNumber}
                      onChange={e => {
                        setPanNumber(e.target.value.toUpperCase())
                        setPanValid(false)
                        setPanDuplicateError(null)
                      }}
                      placeholder="e.g. ABCDE1234F"
                      aria-invalid={Boolean(panDuplicateError)}
                      aria-describedby="pan-status"
                      className={cn(INPUT, "flex-1 admin-num uppercase tracking-wide")}
                    />
                    <AdminButton
                      type="button"
                      onClick={handleCheckPan}
                      loading={panChecking}
                      disabled={panChecking || panNumber.trim().length !== 10}
                    >
                      Check PAN
                    </AdminButton>
                  </div>
                </Field>
                <span
                  id="pan-status"
                  role="status"
                  className={cn(ERROR_SLOT, panValid && "text-admin-accent")}
                >
                  {panValid ? "" : ""}
                </span>
              </div>

              {panDuplicateError && (
                <div
                  role="alert"
                  className="p-3.5 bg-tone-danger border border-tone-danger-bd rounded-admin space-y-2"
                >
                  <p className="flex items-center gap-1.5 text-admin-sm font-semibold text-tone-danger-fg">
                    <AlertTriangle size={15} /> PAN already linked
                  </p>
                  <p className="text-admin-sm text-tone-danger-fg">{panDuplicateError}</p>
                  <AdminLinkButton href="/partner/login" size="sm" variant="secondary">
                    Go to partner login <ArrowRight size={13} />
                  </AdminLinkButton>
                </div>
              )}

              <StepNav onBack={back(1)} loading={savingStep} disabled={savingStep || !panValid} />
            </form>
          )}

          {/* ── STEP 3: CONTACT PERSON ── */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-5" noValidate>
              <StepHeader
                title="Contact person"
                description="Designated person for communication and agreements."
              />

              <FieldGrid>
                <Field label="Contact person name">
                  <TextInput
                    required
                    value={contactPersonName}
                    onChange={e => setContactPersonName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className={INPUT}
                  />
                </Field>

                <Field label="Designation">
                  <Select
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className={INPUT}
                  >
                    {getDesignationOptions().map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Date of birth">
                  <TextInput
                    type="date"
                    required
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className={INPUT}
                  />
                </Field>

                <Field label="Gender">
                  <Select value={gender} onChange={e => setGender(e.target.value)} className={INPUT}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>
              </FieldGrid>

              <StepNav onBack={back(2)} loading={savingStep} disabled={savingStep} />
            </form>
          )}

          {/* ── STEP 4: OFFICE ADDRESS ── */}
          {currentStep === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-5" noValidate>
              <StepHeader
                title="Office address"
                description="Official operating address of your business."
              />

              <FieldGrid>
                {/* Address Line 1 & Line 2 upper than PIN code */}
                <Field label="Address line 1 (shop / office no, building)" className="sm:col-span-2">
                  <TextInput
                    required
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    placeholder="e.g. Office No 402, Business Hub"
                    autoComplete="address-line1"
                    className={INPUT}
                  />
                </Field>

                <Field label="Address line 2 (street / landmark)" className="sm:col-span-2">
                  <TextInput
                    value={addressLine2}
                    onChange={e => setAddressLine2(e.target.value)}
                    placeholder="e.g. Near City Center Mall, Shivaji Nagar"
                    autoComplete="address-line2"
                    className={INPUT}
                  />
                </Field>

                <div>
                  <Field label="PIN code">
                    <div className="relative">
                      <TextInput
                        maxLength={6}
                        inputMode="numeric"
                        required
                        value={pinCode}
                        onChange={e => handlePincodeChange(e.target.value)}
                        placeholder="6-digit PIN code"
                        autoComplete="postal-code"
                        aria-describedby="pin-status"
                        className={cn(INPUT, "admin-num")}
                      />
                    </div>
                  </Field>
                  <span
                    id="pin-status"
                    role="status"
                    className={cn(ERROR_SLOT, "text-admin-accent")}
                  >
                    {pincodeLoading
                      ? "Looking up location…"
                      : pinCode.length === 6 && city
                        ? "Location auto-filled from PIN code."
                        : ""}
                  </span>
                </div>

                <Field label="Area / locality">
                  {pincodeAreas.length > 1 ? (
                    <Select value={area} onChange={e => setArea(e.target.value)} className={INPUT}>
                      <option value="">Select area / post office</option>
                      {pincodeAreas.map(a => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <TextInput
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      placeholder="e.g. Deccan Gymkhana"
                      className={INPUT}
                    />
                  )}
                </Field>

                <Field label="City">
                  <TextInput
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Auto-filled from PIN code"
                    className={cn(INPUT, city && "bg-admin-accent-soft")}
                  />
                </Field>

                <Field label="District">
                  <TextInput
                    required
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="Auto-filled from PIN code"
                    className={cn(INPUT, district && "bg-admin-accent-soft")}
                  />
                </Field>

                <Field label="State" className="sm:col-span-2">
                  <TextInput
                    required
                    value={stateName}
                    onChange={e => setStateName(e.target.value)}
                    placeholder="Auto-filled from PIN code"
                    className={cn(INPUT, stateName && "bg-admin-accent-soft")}
                  />
                </Field>
              </FieldGrid>

              <StepNav onBack={back(3)} loading={savingStep} disabled={savingStep} />
            </form>
          )}

          {/* ── STEP 5: GST ── */}
          {currentStep === 5 && (
            <form onSubmit={handleStep5Submit} className="space-y-5" noValidate>
              <StepHeader
                title="GST registration"
                description="Whether your business is registered under GST."
              />

              <ChoiceGroup
                label="Is your business GST registered?"
                value={isGstRegistered}
                options={YES_NO}
                onChange={opt => {
                  setIsGstRegistered(opt)
                  if (opt === "No") {
                    setGstin("")
                    setGstValid(false)
                  }
                }}
              />

              {isGstRegistered === "Yes" && (
                <div>
                  <Field label="GST number (GSTIN)">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <TextInput
                        maxLength={15}
                        value={gstin}
                        onChange={e => {
                          setGstin(e.target.value.toUpperCase())
                          setGstValid(false)
                        }}
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        aria-describedby="gst-status"
                        className={cn(INPUT, "flex-1 admin-num uppercase tracking-wide")}
                      />
                      <AdminButton
                        type="button"
                        onClick={handleVerifyGst}
                        loading={gstVerifying}
                        disabled={gstVerifying || gstin.trim().length !== 15}
                      >
                        Verify GST
                      </AdminButton>
                    </div>
                  </Field>
                  <span
                    id="gst-status"
                    role="status"
                    className={cn(ERROR_SLOT, "text-admin-accent")}
                  >
                    {gstValid ? "GSTIN format validated." : ""}
                  </span>
                </div>
              )}

              <StepNav
                onBack={back(4)}
                loading={savingStep}
                disabled={savingStep || (isGstRegistered === "Yes" && !gstValid)}
              />
            </form>
          )}

          {/* ── STEP 6: KYC DOCUMENTS ── */}
          {currentStep === 6 && (
            <form onSubmit={handleStep6Submit} className="space-y-5" noValidate>
              {uploadingDoc && (
                <div
                  role="status"
                  aria-live="polite"
                  className="fixed inset-0 z-50 bg-admin-overlay backdrop-blur-sm flex flex-col items-center justify-center gap-3 px-6 text-center"
                >
                  <span className="w-12 h-12 rounded-full border-4 border-admin-border border-t-admin-accent animate-spin" />
                  <p className="text-admin-base font-semibold text-admin-accent-fg">
                    Uploading document…
                  </p>
                  <p className="text-admin-sm text-admin-accent-fg opacity-80">
                    Please wait, do not close this page.
                  </p>
                </div>
              )}

              <StepHeader
                title="KYC documents"
                description="Aadhaar (front and back) and PAN card. Image or PDF accepted."
              />

              <section className="p-4 bg-admin-surface-2 border border-admin-border rounded-admin space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-admin-sm font-semibold text-admin-text">Aadhaar card</h3>
                  <DocStatus
                    state={
                      aadhaarFrontDoc && (aadhaarCombined || aadhaarBackDoc)
                        ? "complete"
                        : aadhaarFrontDoc
                          ? "partial"
                          : "missing"
                    }
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={aadhaarCombined}
                    onChange={e => {
                      setAadhaarCombined(e.target.checked)
                      if (e.target.checked) setAadhaarBackDoc(null)
                    }}
                    className="admin-focus w-4 h-4 accent-admin-accent"
                  />
                  <span className="text-admin-sm text-admin-muted">
                    Both sides are on one image / PDF
                  </span>
                </label>

                <div className={cn("grid gap-3", !aadhaarCombined && "sm:grid-cols-2")}>
                  <DocSlot
                    label={aadhaarCombined ? "Aadhaar (both sides)" : "Aadhaar front"}
                    doc={aadhaarFrontDoc}
                    onPick={() => setActiveCropModal("aadhaarFront")}
                    onRemove={() => setAadhaarFrontDoc(null)}
                  />
                  {!aadhaarCombined && (
                    <DocSlot
                      label="Aadhaar back"
                      doc={aadhaarBackDoc}
                      onPick={() => setActiveCropModal("aadhaarBack")}
                      onRemove={() => setAadhaarBackDoc(null)}
                    />
                  )}
                </div>
              </section>

              <section className="p-4 bg-admin-surface-2 border border-admin-border rounded-admin space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-admin-sm font-semibold text-admin-text">PAN card document</h3>
                  <DocStatus state={panDoc ? "complete" : "missing"} />
                </div>
                <DocSlot
                  label="PAN card"
                  doc={panDoc}
                  onPick={() => setActiveCropModal("panDoc")}
                  onRemove={() => setPanDoc(null)}
                />
              </section>

              <StepNav
                onBack={back(5)}
                loading={savingStep}
                disabled={
                  savingStep ||
                  !aadhaarFrontDoc ||
                  (!aadhaarCombined && !aadhaarBackDoc) ||
                  !panDoc
                }
              />
            </form>
          )}

          {/* ── STEP 7: BANK DETAILS ── */}
          {currentStep === 7 && (
            <form onSubmit={handleStep7Submit} className="space-y-5" noValidate>
              <StepHeader
                title="Bank account"
                description="For monthly DSA payouts and commission disbursals."
              />

              <FieldGrid>
                <Field label="Account holder name" className="sm:col-span-2">
                  <TextInput
                    required
                    value={accountHolderName}
                    onChange={e => setAccountHolderName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma / Techstar Enterprise"
                    className={INPUT}
                  />
                </Field>

                <Field label="Account number">
                  <TextInput
                    type="password"
                    required
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Bank account number"
                    className={cn(INPUT, "admin-num")}
                  />
                </Field>

                <div>
                  <Field label="Confirm account number">
                    <TextInput
                      required
                      value={confirmAccountNumber}
                      onChange={e => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter account number"
                      aria-invalid={
                        confirmAccountNumber.length > 0 && accountNumber !== confirmAccountNumber
                      }
                      aria-describedby="acct-match"
                      className={cn(INPUT, "admin-num")}
                    />
                  </Field>
                  <span id="acct-match" role="alert" className={ERROR_SLOT}>
                    {confirmAccountNumber.length > 0 && accountNumber !== confirmAccountNumber
                      ? "Account numbers do not match."
                      : ""}
                  </span>
                </div>

                <div>
                  <Field label="IFSC code">
                    <TextInput
                      maxLength={11}
                      required
                      value={ifscCode}
                      onChange={e => handleIfscLookup(e.target.value)}
                      placeholder="e.g. HDFC0000103"
                      aria-describedby="ifsc-status"
                      className={cn(INPUT, "admin-num uppercase tracking-wide")}
                    />
                  </Field>
                  <span
                    id="ifsc-status"
                    role="status"
                    className={cn(ERROR_SLOT, "text-admin-accent")}
                  >
                    {ifscLoading ? "Looking up bank…" : ifscValid ? "Bank details found." : ""}
                  </span>
                </div>

                <Field label="Account type">
                  <Select
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as "Savings" | "Current")}
                    className={INPUT}
                  >
                    <option value="Savings">Savings account</option>
                    <option value="Current">Current account</option>
                  </Select>
                </Field>

                <Field label="Bank name">
                  <TextInput
                    readOnly
                    tabIndex={-1}
                    value={bankName}
                    placeholder="Auto-filled from IFSC"
                    className={cn(INPUT, "bg-admin-surface-2 cursor-default")}
                  />
                </Field>

                <Field label="Branch name">
                  <TextInput
                    readOnly
                    tabIndex={-1}
                    value={branchName}
                    placeholder="Auto-filled from IFSC"
                    className={cn(INPUT, "bg-admin-surface-2 cursor-default")}
                  />
                </Field>
              </FieldGrid>

              <StepNav
                onBack={back(6)}
                loading={savingStep}
                disabled={
                  savingStep ||
                  !ifscValid ||
                  !bankName ||
                  !accountHolderName.trim() ||
                  accountNumber.length < 9 ||
                  accountNumber !== confirmAccountNumber
                }
              />
            </form>
          )}

          {/* ── STEP 8: REVIEW & SUBMIT ── */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <StepHeader
                title="Review your application"
                description="Check every section before final submission."
              />

              <div className="space-y-2.5">
                <ReviewRow index={1} label="Basic details" onEdit={back(1)}>
                  <p className="text-admin-sm font-semibold text-admin-text truncate">{fullName}</p>
                  <p className="text-admin-xs text-admin-muted truncate">
                    {email} · +91 {mobileNumber}
                  </p>
                </ReviewRow>

                <ReviewRow index={2} label="Business details" onEdit={back(2)}>
                  <p className="text-admin-sm font-semibold text-admin-text">
                    {partnerType}
                    {partnerType === "Firm" ? ` (${firmType})` : ""}
                  </p>
                  <p className="text-admin-xs text-admin-muted admin-num">PAN: {panNumber}</p>
                </ReviewRow>

                <ReviewRow index={3} label="Contact person" onEdit={back(3)}>
                  <p className="text-admin-sm font-semibold text-admin-text truncate">
                    {contactPersonName} ({designation})
                  </p>
                  <p className="text-admin-xs text-admin-muted">
                    DOB: {dob} · Gender: {gender}
                  </p>
                </ReviewRow>

                <ReviewRow index={4} label="Office address" onEdit={back(4)}>
                  <p className="text-admin-xs text-admin-muted leading-relaxed">
                    {addressLine1}
                    {addressLine2 ? `, ${addressLine2}` : ""}, {city}, {district}, {stateName} -{" "}
                    {pinCode}
                  </p>
                </ReviewRow>

                <ReviewRow index={5} label="GST registration" onEdit={back(5)}>
                  <p className="text-admin-sm text-admin-text">
                    {isGstRegistered === "Yes" ? `GSTIN: ${gstin}` : "Not GST registered"}
                  </p>
                </ReviewRow>

                <ReviewRow index={6} label="KYC documents" onEdit={back(6)}>
                  {/*
                   * Reads `aadhaarFrontDoc`. It used to read an `aadhaarDoc`
                   * state that nothing ever assigned, so this line rendered
                   * "Aadhaar ()" with an empty filename on every application.
                   */}
                  <p className="text-admin-xs text-admin-muted truncate">
                    Aadhaar: {aadhaarFrontDoc?.fileName || "—"}
                  </p>
                  <p className="text-admin-xs text-admin-muted truncate">
                    PAN: {panDoc?.fileName || "—"}
                  </p>
                </ReviewRow>

                <ReviewRow index={7} label="Bank details" onEdit={back(7)}>
                  <p className="text-admin-sm font-semibold text-admin-text truncate">
                    {bankName} ({branchName})
                  </p>
                  <p className="text-admin-xs text-admin-muted admin-num">
                    A/C ····{accountNumber.slice(-4)} · {ifscCode} · {accountType}
                  </p>
                </ReviewRow>
              </div>

              <fieldset className="p-4 bg-admin-accent-soft border border-admin-border rounded-admin space-y-2.5">
                <legend className="sr-only">Declarations</legend>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declareTruth}
                    onChange={e => setDeclareTruth(e.target.checked)}
                    className="admin-focus mt-0.5 w-4 h-4 shrink-0 accent-admin-accent"
                  />
                  <span className="text-admin-sm text-admin-text leading-relaxed">
                    I confirm that all information and KYC documents provided by me are true, valid,
                    and belong to me / my entity.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declareTerms}
                    onChange={e => setDeclareTerms(e.target.checked)}
                    className="admin-focus mt-0.5 w-4 h-4 shrink-0 accent-admin-accent"
                  />
                  <span className="text-admin-sm text-admin-text leading-relaxed">
                    I agree to the Techstar Money Terms &amp; Conditions, RBI compliance guidelines,
                    and Privacy Policy.
                  </span>
                </label>
              </fieldset>

              <StepNav
                onBack={back(7)}
                onSubmit={handleFinalSubmit}
                submitLabel="Submit application"
                loading={submitting}
                disabled={submitting || !declareTruth || !declareTerms}
              />
            </div>
          )}
        </div>
      </main>

      <PartnerPortalFooter />

      {activeCropModal && (
        <ImageCropModal
          isOpen={true}
          title={
            activeCropModal === "aadhaarFront"
              ? "Upload Aadhaar front / combined"
              : activeCropModal === "aadhaarBack"
                ? "Upload Aadhaar back"
                : "Upload PAN card"
          }
          onClose={() => setActiveCropModal(null)}
          onConfirm={handleDocumentCropped}
        />
      )}
    </div>
  )
}

/** Shared bar across the pre-verification screen and the wizard. */

