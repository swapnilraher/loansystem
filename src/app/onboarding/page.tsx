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
    const localDraft = OnboardingStorage.getDraft()
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

    try {
      const res = await fetch(`/api/onboarding/resume?mobile=${mob}`)
      const data = await res.json()
      if (res.ok && data.found && data.draft) {
        const d = data.draft
        if (d.status === "under_review" || d.status === "submitted" || d.isApplicationLocked) {
          setSubmittedAppId(d.applicationId || `TSM-DSA-${mob}`)
          setIsApplicationLocked(true)
          setSubmittedApplicationData(d)
          return
        }
        if (d.agreementSigned) setIsAgreementSigned(true)
        if (d.agreementPdfUrl) setAgreementPdfUrl(d.agreementPdfUrl)
      }
    } catch (e) {
      console.warn("Could not resume remote draft:", e)
    }
  }

  // ─── Inline OTP Handlers ───
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber.replace(/\D/g, ""))

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
      const res = await fetch("/api/onboarding/send-otp", {
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
    } catch (err: any) {
      setMobileError(messageFor(err, "Unable to send verification OTP."))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendMobileOtp = async () => {
    if (!canResend || resending) return
    setResending(true)
    setMobileError(null)
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP")
      setOtpTimer(50)
      setCanResend(false)
    } catch (err) {
      setMobileError(messageFor(err, "Failed to resend OTP."))
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

  const handleVerifyInlineOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const fullOtp = otpValues.join("")
    if (fullOtp.length < 6) {
      setMobileError("Please enter the complete 6-digit OTP code.")
      return
    }
    setVerifyLoading(true)
    setMobileError(null)
    try {
      const res = await fetch("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber, otp: fullOtp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid OTP code")

      setIsMobileVerified(true)
      setOtpSent(false)
      OnboardingStorage.saveDraft({
        mobileNumber,
        isMobileVerified: true,
      })
      await loadDraftForMobile(mobileNumber)
    } catch (err: any) {
      setMobileError(err.message || "Failed to verify OTP.")
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResetMobile = () => {
    OnboardingStorage.clearDraft()
    setMobileNumber("")
    setIsMobileVerified(false)
    setOtpSent(false)
    setCurrentStep(1)
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

  // ─── Step 1: Pincode Auto-Fill ───
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "")
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
        setCity(po[0].District || po[0].Block || "")
        setDistrict(po[0].District || "")
        setStateName(po[0].State || "")
        const areas = [...new Set(po.map(p => p.Name).filter((n): n is string => Boolean(n)))]
        setPincodeAreas(areas)
        if (areas.length === 1) setArea(areas[0])
      }
    } catch {
      // ignore
    } finally {
      setPincodeLoading(false)
    }
  }

  // ─── Step 1: Submit (Basic & Business Details) ───
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStepError(null)

    // Name validations based on business type
    if (partnerType === "Individual") {
      if (!fullName.trim()) {
        setStepError("Full Name as per PAN is required.")
        return
      }
    } else {
      if (!businessName.trim()) {
        setStepError("Business / Firm Name is required.")
        return
      }
      if (!contactPersonName.trim()) {
        setStepError("Contact Person Name is required.")
        return
      }
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStepError("Please provide a valid Email Address.")
      return
    }

    // PAN validation (pure regex format, no Check PAN button needed)
    const cleanPan = panNumber.trim().toUpperCase()
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setStepError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).")
      return
    }

    // DOB age validation (strictly 18 to 80 years)
    if (!dob) {
      setStepError("Date of Birth is required.")
      return
    }
    const birthDate = new Date(dob)
    let age = todayObj.getFullYear() - birthDate.getFullYear()
    const mDiff = todayObj.getMonth() - birthDate.getMonth()
    if (mDiff < 0 || (mDiff === 0 && todayObj.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18 || age > 80) {
      setStepError("Applicant age must be between 18 and 80 years to register as a DSA partner.")
      return
    }

    // Address validations
    if (!addressLine1.trim() || !city.trim() || !stateName.trim() || pinCode.trim().length !== 6) {
      setStepError("Please complete all mandatory address fields (Line 1, City, State, 6-digit Pincode).")
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
      const res = await fetch("/api/sandbox", {
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
      setGstValid(false)
      setGstDetails(null)
      setStepError(messageFor(err, "Failed to verify GSTIN."))
    } finally {
      setGstVerifying(false)
    }
  }

  // ─── Step 2: Document Upload & Crop Handler ───
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
      const res = await fetch(`/api/onboarding/ifsc?code=${clean}`)
      const data = await res.json()
      if (res.ok && data.valid && data.details) {
        setBankName(data.details.BANK || "")
        setBranchName(data.details.BRANCH || "")
        setIfscValid(true)
      } else {
        setIfscValid(false)
      }
    } catch {
      setIfscValid(false)
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
      const res = await fetch("/api/sandbox", {
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
      setBankVerified(false)
      setStepError(messageFor(err, "Bank verification failed."))
    } finally {
      setBankVerifying(false)
    }
  }

  // ─── Step 2: Submit (Merged: GST, KYC Docs, Bank) ───
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStepError(null)

    // GST validation
    if (isGstRegistered === "Yes" && (!gstValid || gstin.trim().length !== 15)) {
      setStepError("Please enter and verify your 15-character GSTIN, or select 'No'.")
      return
    }

    // Documents validation
    if (!aadhaarFrontDoc) {
      setStepError("Please upload Aadhaar Front document.")
      return
    }
    if (!aadhaarCombined && !aadhaarBackDoc) {
      setStepError("Please upload Aadhaar Back document, or select 'Both sides on single document'.")
      return
    }
    if (!panDoc) {
      setStepError("Please upload PAN Card document.")
      return
    }

    // Bank validation
    if (!accountNumber.trim() || accountNumber.trim().length < 8) {
      setStepError("Please enter a valid Bank Account Number.")
      return
    }
    if (accountNumber !== confirmAccountNumber) {
      setStepError("Account Numbers do not match.")
      return
    }
    if (!ifscCode.trim() || ifscCode.trim().length !== 11) {
      setStepError("Please enter a valid 11-digit IFSC code.")
      return
    }
    if (!accountHolderName.trim()) {
      setStepError("Please enter Account Holder Name.")
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
      setStepError("Please accept all confirmation checkboxes before submitting.")
      return
    }
    if (!isAgreementSigned) {
      setStepError("Please sign the official Partner MOU Agreement via OTP before final submission.")
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
      setStepError(messageFor(err, "Failed to submit application."))
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
      <div className="min-h-dvh flex flex-col bg-slate-50">
        <PartnerPortalHeader subtitle="DSA Partner Onboarding" rightLinkLabel="Track Live" rightLinkHref={`/application-status?id=${submittedAppId}`} />

        <main className="flex-1 flex w-full max-w-3xl mx-auto px-4 py-10">
          <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-10 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Lock size={13} /> Application Submitted &amp; Locked
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Partner Application Under Review
              </h1>
              {/* Requirement #1: Removed 'सुरक्षितता व बँकिंग नियमांनुसार एकदा सबमिट झाल्यावर अर्जामध्ये कोणतेही फेरबदल करता येत नाहीत' */}
              <p className="max-w-xl mx-auto text-sm text-slate-600 leading-relaxed">
                तुमचा DSA Partner अर्ज यशस्वीरित्या सबमिट झालेला असून तो सुरक्षिततेसाठी लॉक (Lock) करण्यात आला आहे.
              </p>
            </div>

            {/* Application ID Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div>
                <span className="block text-xs font-bold uppercase text-slate-400">Official Application ID</span>
                <span className="block text-2xl font-black text-slate-900 font-mono mt-0.5">{submittedAppId}</span>
                <span className="block text-xs text-slate-500 mt-1">Updates will be sent to WhatsApp (+91 {mobileNumber})</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyAppId}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Copy size={14} />
                  <span>{copiedAppId ? "Copied!" : "Copy ID"}</span>
                </button>
                <Link
                  href={`/application-status?id=${submittedAppId}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm text-decoration-none"
                >
                  <span>Track Status</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetMobile}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ← Onboard Another Account
              </button>
              <a
                href={`https://wa.me/919579005645?text=Hello%20Techstar%20Money,%20my%20DSA%20Application%20ID%20is%20${submittedAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-decoration-none"
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

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 font-sans" style={{ color: "#0F172A" }}>
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-4 text-center text-xs font-medium border-b border-slate-800 flex items-center justify-center gap-2">
        <Sparkles size={13} className="text-amber-400" />
        <span>Complete Onboarding to unlock <strong>Direct Bank Commission Payouts &amp; Zero Setup Fees</strong></span>
      </div>

      {/* Main 2-Column Razorpay Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">

        {/* ─── LEFT SIDEBAR (Razorpay Style) ─── */}
        <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 p-5 md:p-8 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* User Profile Header */}
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200 shrink-0">
                {(fullName || businessName || "TS").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">
                  {fullName || businessName || (mobileNumber ? `+91 ${mobileNumber}` : "New DSA Partner")}
                </div>
                <div className="text-xs text-slate-400 font-medium truncate">
                  {partnerType} {partnerType === "Firm" ? `(${firmType})` : ""}
                </div>
              </div>
            </div>

            {/* Stepper Header */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboarding Flow</div>
              <div className="text-lg font-black text-slate-900">DSA Partner Channel</div>
            </div>

            {/* Stepper Steps (3 Steps) */}
            <div className="space-y-3">
              {[
                { id: 1, title: "Basic details", desc: "Personal, business & address", done: isStep1Done },
                { id: 2, title: "Business & KYC details", desc: "GST, documents & bank account", done: isStep2Done },
                { id: 3, title: "Review & submit", desc: "MOU agreement execution", done: isStep3Done },
              ].map((s) => {
                const isActive = currentStep === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!isMobileVerified}
                    onClick={() => {
                      if (s.id <= currentStep || (s.id === 2 && isStep1Done) || (s.id === 3 && isStep2Done)) {
                        setCurrentStep(s.id)
                      }
                    }}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-decoration-none",
                      isActive
                        ? "bg-blue-50/70 border-blue-200 shadow-sm"
                        : "bg-white border-transparent hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                          s.done
                            ? "bg-emerald-600 text-white"
                            : isActive
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {s.done ? <Check size={14} /> : s.id}
                      </div>
                      <div className="min-w-0">
                        <div className={cn("text-xs font-bold leading-tight truncate", isActive ? "text-blue-950" : "text-slate-800")}>
                          {s.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{s.desc}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} className={cn("shrink-0", isActive ? "text-blue-600" : "text-slate-300")} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-2 mt-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <HelpCircle size={14} className="text-blue-600" />
              <span>Need Assistance?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Our partner operations desk in Chhatrapati Sambhajinagar is ready to help you.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="tel:09579005645" className="font-bold text-slate-800 hover:text-blue-600 text-decoration-none">
                📞 095790 05645
              </a>
              <span>·</span>
              <a
                href="https://wa.me/919579005645"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-600 hover:text-emerald-700 text-decoration-none"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT MAIN PANE ─── */}
        <main className="flex-1 bg-white p-5 md:p-10 flex flex-col justify-between">
          <div>
            {/* Top Navigation & Brand Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                {currentStep > 1 && isMobileVerified && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-right">
                <a
                  href="tel:09579005645"
                  title="Call Support (095790 05645)"
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors text-decoration-none shadow-xs"
                >
                  <Headphones size={15} className="text-blue-600" />
                </a>
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center p-0.5">
                  <Image src="/img/logo.webp" alt="Techstar Money" width={30} height={30} className="object-contain" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-none">Techstar Money Solution</div>
                  <div className="text-[10px] font-semibold text-slate-400">Partner Channel</div>
                </div>
              </div>
            </div>

            {/* Error Strip */}
            {stepError && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{stepError}</span>
              </div>
            )}

            {/* ─── PRE-OTP / INLINE OTP FORM ON SAME SCREEN ─── */}
            {!isMobileVerified ? (
              <div className="max-w-xl mx-auto py-6 space-y-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Verify Your Mobile Number
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    We will send a 6-digit verification code directly to your WhatsApp number.
                  </p>
                </div>

                {mobileError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{mobileError}</span>
                  </div>
                )}

                {/* Eligibility Warning Banner */}
                {eligibilityInfo && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 text-xs space-y-3 animate-fadeIn shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm text-amber-950 leading-snug">
                          {eligibilityInfo.marathiMessage}
                        </div>
                        <div className="text-xs text-amber-800 mt-1 leading-relaxed">
                          {eligibilityInfo.message}
                        </div>
                      </div>
                    </div>
                    {eligibilityInfo.redirectUrl && (
                      <div className="pt-1">
                        <Link
                          href={eligibilityInfo.redirectUrl}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs text-decoration-none shadow-sm transition-colors"
                        >
                          <span>{eligibilityInfo.actionText || "Proceed →"}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="onboard-mobile" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Mobile Number (WhatsApp Enabled)
                    </label>
                    <div className="flex h-12 rounded-xl border border-slate-300 bg-slate-50 overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <span className="flex items-center px-3.5 bg-slate-100 border-r border-slate-300 text-xs font-bold text-slate-700 select-none">
                        +91
                      </span>
                      <input
                        id="onboard-mobile"
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        disabled={otpSent}
                        value={mobileNumber}
                        onChange={e => {
                          setMobileNumber(e.target.value.replace(/\D/g, ""))
                          setMobileError(null)
                        }}
                        className="w-full px-3.5 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      disabled={otpLoading || !isMobileValid}
                      onClick={handleSendMobileOtp}
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-blue-200 shadow-blue-100"
                    >
                      {otpLoading ? (
                        <><RefreshCw size={16} className="animate-spin" /> Sending Code...</>
                      ) : (
                        <>Get WhatsApp Verification OTP <ArrowRight size={16} /></>
                      )}
                    </button>
                  ) : (
                    /* Inline OTP Form underneath mobile number */
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Code sent to WhatsApp <strong>+91 {mobileNumber}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpValues(["", "", "", "", "", ""]) }}
                          className="text-blue-600 font-bold hover:underline"
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
                            className="w-11 sm:w-13 h-12 sm:h-14 text-center text-xl font-black rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{canResend ? "Didn't receive code?" : `Resend in ${otpTimer}s`}</span>
                        <button
                          type="button"
                          disabled={!canResend || resending}
                          onClick={handleResendMobileOtp}
                          className="text-blue-600 font-bold disabled:opacity-40 hover:underline"
                        >
                          {resending ? "Sending..." : "Resend OTP on WhatsApp"}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={verifyLoading || otpValues.join("").length < 6}
                        onClick={handleVerifyInlineOtp}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
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
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-slate-700">Mobile Verified:</span>
                    <strong className="font-mono text-slate-900 font-bold">+91 {mobileNumber}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetMobile}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Change
                  </button>
                </div>

                {/* ─── STEP 1: BASIC & BUSINESS DETAILS ─── */}
                {currentStep === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Personal &amp; Business Information
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        We can fetch details to make your onboarding smoother and faster.
                      </p>
                    </div>

                    {/* Business Type Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Select Business Entity Type <span className="text-rose-500">*</span>
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
                                "p-3 rounded-xl border text-xs font-bold text-left transition-all",
                                isSelected
                                  ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
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
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Full Name (as per PAN Card) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Shankar Patil"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Business / Company Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            placeholder="e.g. Patil Financial Services"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Contact Person Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contactPersonName}
                            onChange={e => setContactPersonName(e.target.value)}
                            placeholder="e.g. Ramesh Patil"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email & PAN (PAN without check button) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="e.g. ramesh@example.com"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Permanent Account Number (PAN) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={panNumber}
                          onChange={e => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="ABCDE1234F"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 uppercase focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Date of Birth (Age filter 18 to 80 years) & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Date of Birth (वय १८ ते ८० वर्षे) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={minDobStr}
                          max={maxDobStr}
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-[11px] text-slate-400">Must be between 18 and 80 years old</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Gender <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Referral Code (Optional) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Referral / Senior DSA Partner Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={referredByDsaCode}
                        onChange={e => setReferredByDsaCode(e.target.value.toUpperCase())}
                        placeholder="e.g. TSM-REF-1042"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-semibold text-slate-900 uppercase focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Address & Pincode */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="text-sm font-bold text-slate-900">Office / Residential Address</div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            PIN Code <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={6}
                              required
                              value={pinCode}
                              onChange={e => handlePincodeChange(e.target.value)}
                              placeholder="6-digit Pincode"
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                            {pincodeLoading && (
                              <RefreshCw size={15} className="animate-spin text-blue-600 absolute right-3 top-3.5" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Address Line 1 (House/Building/Flat No) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={addressLine1}
                            onChange={e => setAddressLine1(e.target.value)}
                            placeholder="e.g. Office No 18, Morya Pride"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">Address Line 2 (Street/Area)</label>
                          <input
                            type="text"
                            value={addressLine2}
                            onChange={e => setAddressLine2(e.target.value)}
                            placeholder="e.g. Mayur Park, Harsul"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            City / District <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            placeholder="e.g. Chhatrapati Sambhajinagar"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            State <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={stateName}
                            onChange={e => setStateName(e.target.value)}
                            placeholder="e.g. Maharashtra"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          saveProgress(1, { fullName, businessName, email, panNumber, dob })
                          window.location.href = "/"
                        }}
                        className="px-5 h-12 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm transition-all shadow-xs"
                      >
                        Save &amp; Exit
                      </button>
                      <button
                        type="submit"
                        disabled={savingStep}
                        className="w-full sm:w-auto px-8 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                      >
                        {savingStep ? (
                          <><RefreshCw size={16} className="animate-spin" /> Saving...</>
                        ) : (
                          <>Continue <ArrowRight size={16} /></>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── STEP 2: BUSINESS KYC, GST & BANKING (MERGED 2, 3, 4) ─── */}
                {currentStep === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Business KYC, Documents &amp; Bank Details
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        Add GST details (optional), upload identity documents with crop adjustment, and link payout bank account.
                      </p>
                    </div>

                    {/* SECTION A: GST DETAILS */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building size={18} className="text-blue-600" />
                          <span className="text-sm font-bold text-slate-900">GST Registration Details</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Optional</span>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">Do you have a GST Registration?</label>
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
                                "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                isGstRegistered === opt
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isGstRegistered === "Yes" && (
                        <div className="space-y-3 pt-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            GSTIN (15 characters) <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={15}
                              value={gstin}
                              onChange={e => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                              placeholder="27ABCDE1234F1Z5"
                              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 uppercase focus:border-blue-600"
                            />
                            <button
                              type="button"
                              disabled={gstVerifying || gstin.length !== 15}
                              onClick={handleVerifyGst}
                              className="px-4 h-11 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {gstVerifying ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                              <span>Verify GST</span>
                            </button>
                          </div>

                          {gstValid && gstDetails && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                <span>GST Verified: {gstDetails.tradeName || gstDetails.legalName}</span>
                              </div>
                              <div className="text-[11px] text-emerald-700">Address: {gstDetails.address}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION B: KYC DOCUMENTS & CROP OPTION */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-blue-600" />
                          <span className="text-sm font-bold text-slate-900">KYC Identity Documents</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Mandatory</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Aadhaar Front */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900">Aadhaar Card (Front)</div>
                            <div className="text-[11px] text-slate-400">Clear photo or scan</div>
                          </div>

                          {aadhaarFrontDoc ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                <CheckCircle2 size={14} /> Uploaded
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveCropModal("aadhaarFront")}
                                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1"
                              >
                                <Crop size={12} /> Crop / Adjust
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveCropModal("aadhaarFront")}
                              className="w-full py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold text-blue-700 flex items-center justify-center gap-1.5"
                            >
                              <Upload size={13} /> Upload &amp; Crop
                            </button>
                          )}
                        </div>

                        {/* Aadhaar Back */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900">Aadhaar Card (Back)</div>
                            <div className="text-[11px] text-slate-400">Address side</div>
                          </div>

                          {aadhaarCombined ? (
                            <div className="text-xs font-bold text-slate-500 py-2">Combined on Front</div>
                          ) : aadhaarBackDoc ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                <CheckCircle2 size={14} /> Uploaded
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveCropModal("aadhaarBack")}
                                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1"
                              >
                                <Crop size={12} /> Crop / Adjust
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveCropModal("aadhaarBack")}
                              className="w-full py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold text-blue-700 flex items-center justify-center gap-1.5"
                            >
                              <Upload size={13} /> Upload &amp; Crop
                            </button>
                          )}
                        </div>

                        {/* PAN Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900">PAN Card Document</div>
                            <div className="text-[11px] text-slate-400">Front side photo</div>
                          </div>

                          {panDoc ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                <CheckCircle2 size={14} /> Uploaded
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveCropModal("panDoc")}
                                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1"
                              >
                                <Crop size={12} /> Crop / Adjust
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveCropModal("panDoc")}
                              className="w-full py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold text-blue-700 flex items-center justify-center gap-1.5"
                            >
                              <Upload size={13} /> Upload &amp; Crop
                            </button>
                          )}
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={aadhaarCombined}
                          onChange={e => setAadhaarCombined(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                        />
                        <span>Both sides of Aadhaar Card are on one image / PDF file</span>
                      </label>
                    </div>

                    {/* SECTION C: BANK DETAILS */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={18} className="text-blue-600" />
                          <span className="text-sm font-bold text-slate-900">Payout Bank Account</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Direct Transfer</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Account Holder Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={accountHolderName}
                            onChange={e => setAccountHolderName(e.target.value)}
                            placeholder="Name as per Bank records"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Account Type <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={accountType}
                            onChange={e => setAccountType(e.target.value as "Savings" | "Current")}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-blue-600"
                          >
                            <option value="Savings">Savings Account</option>
                            <option value="Current">Current Account</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Bank Account Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                            placeholder="Enter bank account number"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 focus:border-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Confirm Account Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={confirmAccountNumber}
                            onChange={e => setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))}
                            placeholder="Re-enter bank account number"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            IFSC Code <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={11}
                            required
                            value={ifscCode}
                            onChange={e => handleIfscChange(e.target.value)}
                            placeholder="e.g. SBIN0001234"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 uppercase focus:border-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase">Bank &amp; Branch</label>
                          <div className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100 flex items-center text-xs font-bold text-slate-700 truncate">
                            {ifscLoading ? "Looking up IFSC..." : bankName ? `${bankName} (${branchName})` : "Will auto-populate from IFSC"}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={bankVerifying || !accountNumber || !ifscCode}
                          onClick={handleVerifyBankAccount}
                          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {bankVerifying ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          <span>Verify Account Holder</span>
                        </button>

                        {bankVerified && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Bank Account Verified ✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="px-5 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = "/"
                          }}
                          className="px-4 h-12 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm transition-all shadow-xs"
                        >
                          Save &amp; Exit
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={savingStep}
                        className="px-8 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                      >
                        {savingStep ? (
                          <><RefreshCw size={16} className="animate-spin" /> Saving...</>
                        ) : (
                          <>Continue <ArrowRight size={16} /></>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── STEP 3: REVIEW, MOU & SUBMIT ─── */}
                {currentStep === 3 && (
                  <form onSubmit={handleFinalSubmit} className="space-y-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Review &amp; Sign MOU Agreement
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        Review your application details and execute your official digital Partner MOU before submitting.
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Personal & Business */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                          <span>Applicant Details</span>
                          <button type="button" onClick={() => setCurrentStep(1)} className="text-blue-600 font-bold text-xs hover:underline">Edit</button>
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
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                          <span>Bank &amp; Address Details</span>
                          <button type="button" onClick={() => setCurrentStep(2)} className="text-blue-600 font-bold text-xs hover:underline">Edit</button>
                        </div>
                        <div>Address: <strong>{addressLine1}, {city}, {stateName} - {pinCode}</strong></div>
                        <div>Bank: <strong>{bankName || "Verified Bank"}</strong></div>
                        <div>A/C Number: <strong className="font-mono">••••••••{accountNumber.slice(-4)}</strong> (Masked)</div>
                        <div>IFSC: <strong className="font-mono">{ifscCode}</strong></div>
                        <div>GST: <strong>{isGstRegistered === "Yes" ? gstin : "Not Registered"}</strong></div>
                      </div>
                    </div>

                    {/* MOU Agreement Section */}
                    <div className="p-5 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-blue-600" />
                          <div>
                            <div className="text-sm font-black text-slate-900">Partner Memorandum of Understanding (MOU)</div>
                            <div className="text-xs text-slate-500">Official legal partnership agreement with Techstar Money Solution Pvt. Ltd.</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Requirement: Preview MOU before signing */}
                        <a
                          href={`/api/partner/agreement/pdf?mobile=${mobileNumber}&preview=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 text-decoration-none shadow-sm"
                        >
                          <Eye size={15} className="text-blue-600" />
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
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={declareTruth}
                          onChange={e => setDeclareTruth(e.target.checked)}
                          className="w-4 h-4 rounded mt-0.5 accent-blue-600"
                        />
                        <span>I confirm that all personal, business, KYC, and bank details provided are true, complete, and authentic.</span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={declareTerms}
                          onChange={e => setDeclareTerms(e.target.checked)}
                          className="w-4 h-4 rounded mt-0.5 accent-blue-600"
                        />
                        <span>I accept the Techstar Money Solution Private Limited DSA Partner Terms, Code of Conduct, and Operating Policies.</span>
                      </label>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-6 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                      >
                        ← Back to Step 2
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !declareTruth || !declareTerms || !isAgreementSigned}
                        className="px-8 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                      >
                        {submitting ? (
                          <><RefreshCw size={16} className="animate-spin" /> Submitting Application...</>
                        ) : (
                          <>🚀 Submit DSA Partner Application</>
                        )}
                      </button>
                    </div>
                  </form>
                )}
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
      />

      <PartnerPortalFooter />
    </div>
  )
}
