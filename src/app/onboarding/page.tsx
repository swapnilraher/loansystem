"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Building2,
  User,
  CreditCard,
  Building,
  FileText,
  MapPin,
  Landmark,
  FileCheck,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  Lock,
  Camera,
  RefreshCw,
  Search,
  CheckSquare,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  MessageSquare
} from "lucide-react";

import WhatsAppOtpModal from "@/components/onboarding/WhatsAppOtpModal";
import ImageCropModal from "@/components/onboarding/ImageCropModal";

type PartnerType = "Individual" | "Firm";
type FirmType = "Proprietorship" | "Partnership" | "Private Limited" | "Limited" | "LLP";

export default function OnboardingPage() {
  // ─── Screen 1 & 2: Mobile & WhatsApp OTP Verification ───
  const [mobileNumber, setMobileNumber] = useState("");
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // ─── Stepper Counter (1 to 8) ───
  const [currentStep, setCurrentStep] = useState(1);
  const [savingStep, setSavingStep] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // ─── Step 1: Basic Details ───
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // ─── Step 2: Business & PAN ───
  const [partnerType, setPartnerType] = useState<PartnerType>("Individual");
  const [firmType, setFirmType] = useState<FirmType>("Proprietorship");
  const [panNumber, setPanNumber] = useState("");
  const [panValid, setPanValid] = useState(false);
  const [panChecking, setPanChecking] = useState(false);
  const [panDuplicateError, setPanDuplicateError] = useState<string | null>(null);

  // ─── Step 3: Contact Person Details ───
  const [contactPersonName, setContactPersonName] = useState("");
  const [designation, setDesignation] = useState("Individual");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");

  // ─── Step 4: Office Address Details ───
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [pinCode, setPinCode] = useState("");

  // ─── Step 5: GST Registration ───
  const [isGstRegistered, setIsGstRegistered] = useState<"Yes" | "No">("No");
  const [gstin, setGstin] = useState("");
  const [gstValid, setGstValid] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);

  // ─── Step 6: KYC Document Uploads ───
  const [aadhaarDoc, setAadhaarDoc] = useState<{ fileName: string; sizeBytes: number; uploadedAt: string } | null>(null);
  const [panDoc, setPanDoc] = useState<{ fileName: string; sizeBytes: number; uploadedAt: string } | null>(null);
  const [activeCropModal, setActiveCropModal] = useState<"aadhaarDoc" | "panDoc" | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // ─── Step 7: Bank Details ───
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountType, setAccountType] = useState<"Savings" | "Current">("Savings");
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscValid, setIfscValid] = useState(false);
  const [bankVerificationStatus, setBankVerificationStatus] = useState<"pending" | "verified">("pending");

  // ─── Step 8: Review & Declarations ───
  const [declareTruth, setDeclareTruth] = useState(false);
  const [declareTerms, setDeclareTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Final Success Screen ───
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Auto-sync designation when partnerType or firmType changes
  useEffect(() => {
    if (partnerType === "Individual") {
      setDesignation("Individual");
    } else {
      if (firmType === "Proprietorship") setDesignation("Proprietor");
      else if (firmType === "Partnership") setDesignation("Partner");
      else if (firmType === "Private Limited" || firmType === "Limited") setDesignation("Director");
      else if (firmType === "LLP") setDesignation("Designated Partner");
    }
  }, [partnerType, firmType]);

  // Designation options by partner/firm type
  const getDesignationOptions = () => {
    if (partnerType === "Individual") {
      return ["Individual", "Proprietor"];
    }
    switch (firmType) {
      case "Proprietorship":
        return ["Proprietor", "Authorized Representative"];
      case "Partnership":
        return ["Partner", "Authorized Partner", "Authorized Signatory"];
      case "Private Limited":
      case "Limited":
        return ["Director", "Authorized Signatory"];
      case "LLP":
        return ["Designated Partner", "Partner", "Authorized Signatory"];
      default:
        return ["Authorized Signatory", "Representative"];
    }
  };

  // ─── 1. Send WhatsApp OTP ───
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMobileError(null);

    const cleanNumber = mobileNumber.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      setMobileError("Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send WhatsApp verification OTP.");
      }

      setShowOtpModal(true);
    } catch (err: any) {
      setMobileError(err.message || "Failed to connect to WhatsApp OTP service.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── 2. On OTP Verified ───
  const handleOtpVerified = async () => {
    setShowOtpModal(false);
    setIsMobileVerified(true);
    setCurrentStep(1);

    // Try loading any previous draft
    try {
      const res = await fetch(`/api/onboarding/resume?mobile=${mobileNumber}`);
      const data = await res.json();
      if (res.ok && data.application) {
        const app = data.application;
        if (app.fullName) setFullName(app.fullName);
        if (app.email) setEmail(app.email);
        if (app.partnerType) setPartnerType(app.partnerType);
        if (app.firmType) setFirmType(app.firmType);
        if (app.panNumber) {
          setPanNumber(app.panNumber);
          setPanValid(true);
        }
        if (app.contactPersonName) setContactPersonName(app.contactPersonName);
        if (app.designation) setDesignation(app.designation);
        if (app.dob) setDob(app.dob);
        if (app.gender) setGender(app.gender);
        if (app.addressLine1) setAddressLine1(app.addressLine1);
        if (app.addressLine2) setAddressLine2(app.addressLine2);
        if (app.area) setArea(app.area);
        if (app.city) setCity(app.city);
        if (app.district) setDistrict(app.district);
        if (app.stateName) setStateName(app.stateName);
        if (app.pinCode) setPinCode(app.pinCode);
        if (app.isGstRegistered) setIsGstRegistered(app.isGstRegistered);
        if (app.gstin) {
          setGstin(app.gstin);
          setGstValid(true);
        }
        if (app.documents?.aadhaarDoc) setAadhaarDoc(app.documents.aadhaarDoc);
        if (app.documents?.panDoc) setPanDoc(app.documents.panDoc);
        if (app.bankDetails) {
          setAccountHolderName(app.bankDetails.accountHolderName || "");
          setAccountNumber(app.bankDetails.accountNumber || "");
          setConfirmAccountNumber(app.bankDetails.accountNumber || "");
          setIfscCode(app.bankDetails.ifsc || "");
          setBankName(app.bankDetails.bankName || "");
          setBranchName(app.bankDetails.branchName || "");
          setAccountType(app.bankDetails.accountType || "Savings");
          if (app.bankDetails.ifsc) setIfscValid(true);
        }
      }
    } catch (e) {
      console.warn("Could not resume draft:", e);
    }
  };

  // ─── 3. Save Progress to Backend ───
  const saveProgress = async (stepNum: number, stepPayload: any) => {
    setSavingStep(true);
    setStepError(null);
    try {
      const res = await fetch("/api/onboarding/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          step: stepNum,
          stepData: stepPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save step progress.");
      return true;
    } catch (err: any) {
      setStepError(err.message || "Failed to save progress. Please try again.");
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  // ─── Step 1 Submit ───
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStepError("Full Name is required.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStepError("Please provide a valid Email Address.");
      return;
    }

    const ok = await saveProgress(2, {
      fullName: fullName.trim(),
      email: email.trim(),
      mobileNumber,
      isMobileVerified: true,
    });
    if (ok) setCurrentStep(2);
  };

  // ─── Step 2: Check PAN ───
  const handleCheckPan = async () => {
    setStepError(null);
    setPanDuplicateError(null);
    const cleanPan = panNumber.trim().toUpperCase();

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPan)) {
      setStepError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      return;
    }

    setPanChecking(true);
    try {
      const res = await fetch("/api/onboarding/pan/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber: cleanPan, mobileNumber }),
      });

      const data = await res.json();
      if (!res.ok || data.isDuplicate) {
        setPanDuplicateError(data.error || "This PAN is already linked with an existing Techstar Money partner account.");
        setPanValid(false);
      } else {
        setPanValid(true);
        setPanNumber(cleanPan);
      }
    } catch (err: any) {
      setStepError(err.message || "Failed to check PAN status.");
    } finally {
      setPanChecking(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panValid) {
      setStepError("Please verify your PAN number before continuing.");
      return;
    }

    const ok = await saveProgress(3, {
      partnerType,
      firmType: partnerType === "Firm" ? firmType : null,
      panNumber: panNumber.trim().toUpperCase(),
      panValid: true,
    });
    if (ok) setCurrentStep(3);
  };

  // ─── Step 3 Submit ───
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPersonName.trim()) {
      setStepError("Contact Person Name is required.");
      return;
    }
    if (!dob) {
      setStepError("Date of Birth is required.");
      return;
    }

    const ok = await saveProgress(4, {
      contactPersonName: contactPersonName.trim(),
      designation,
      dob,
      gender,
    });
    if (ok) setCurrentStep(4);
  };

  // ─── Step 4 Submit ───
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1.trim() || !city.trim() || !district.trim() || !stateName.trim() || !pinCode.trim()) {
      setStepError("Please fill in all mandatory address fields marked with *.");
      return;
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      setStepError("Please enter a valid 6-digit PIN code.");
      return;
    }

    const ok = await saveProgress(5, {
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      area: area.trim(),
      city: city.trim(),
      district: district.trim(),
      stateName: stateName.trim(),
      pinCode: pinCode.trim(),
    });
    if (ok) setCurrentStep(5);
  };

  // ─── Step 5: GST Verification & Submit ───
  const handleVerifyGst = () => {
    const cleanGst = gstin.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      setStepError("Please enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).");
      setGstValid(false);
      return;
    }
    setGstVerifying(true);
    setTimeout(() => {
      setGstValid(true);
      setGstin(cleanGst);
      setGstVerifying(false);
      setStepError(null);
    }, 600);
  };

  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGstRegistered === "Yes" && !gstValid) {
      setStepError("Please verify your GSTIN or select 'No' if not GST registered.");
      return;
    }

    const ok = await saveProgress(6, {
      isGstRegistered,
      gstin: isGstRegistered === "Yes" ? gstin.trim().toUpperCase() : null,
      gstValid: isGstRegistered === "Yes" ? gstValid : false,
    });
    if (ok) setCurrentStep(6);
  };

  // ─── Step 6: KYC Document Upload Handler ───
  const handleDocumentCropped = async (file: File) => {
    if (!activeCropModal) return;
    const docType = activeCropModal;
    setUploadingDoc(true);
    setStepError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", docType);
    formData.append("mobileNumber", mobileNumber);

    try {
      const res = await fetch("/api/onboarding/document/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Document upload failed");

      if (docType === "aadhaarDoc") {
        setAadhaarDoc(data.document);
      } else if (docType === "panDoc") {
        setPanDoc(data.document);
      }
    } catch (err: any) {
      setStepError(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
      setActiveCropModal(null);
    }
  };

  const handleStep6Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarDoc) {
      setStepError("Aadhaar Card document upload is mandatory.");
      return;
    }
    if (!panDoc) {
      setStepError("PAN Card document upload is mandatory.");
      return;
    }

    const ok = await saveProgress(7, {
      documents: {
        aadhaarDoc,
        panDoc,
      },
    });
    if (ok) setCurrentStep(7);
  };

  // ─── Step 7: IFSC Lookup ───
  const handleIfscLookup = async (code: string) => {
    const cleanIfsc = code.trim().toUpperCase();
    setIfscCode(cleanIfsc);
    if (cleanIfsc.length !== 11) {
      setIfscValid(false);
      return;
    }

    setIfscLoading(true);
    setStepError(null);
    try {
      const res = await fetch(`/api/onboarding/ifsc?code=${cleanIfsc}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setIfscValid(false);
        setStepError(data.error || "Invalid IFSC code. Bank details not found.");
      } else {
        setIfscValid(true);
        setBankName(data.bank || "");
        setBranchName(data.branch || "");
        setStepError(null);
      }
    } catch (err: any) {
      setIfscValid(false);
      setStepError("Could not fetch bank details from Razorpay IFSC service.");
    } finally {
      setIfscLoading(false);
    }
  };

  const handleStep7Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim()) {
      setStepError("Account Holder Name is required.");
      return;
    }
    if (!accountNumber.trim() || accountNumber.length < 9) {
      setStepError("Please enter a valid Bank Account Number.");
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      setStepError("Account Number and Confirmation do not match.");
      return;
    }
    if (!ifscValid || !bankName) {
      setStepError("Please enter a valid 11-digit IFSC code.");
      return;
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
    });
    if (ok) setCurrentStep(8);
  };

  // ─── Step 8: Final Submission ───
  const handleFinalSubmit = async () => {
    if (!declareTruth || !declareTerms) {
      setStepError("Please confirm all declaration and terms checkboxes before submitting.");
      return;
    }

    setSubmitting(true);
    setStepError(null);
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          agreementConsent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");

      setSubmittedAppId(data.applicationId);
    } catch (err: any) {
      setStepError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render Success Screen ───
  if (submittedAppId) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-200 text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              <Clock className="w-3.5 h-3.5" /> Under Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Application Submitted Successfully!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto">
              Your DSA Partner application has been received. Our compliance team will review your details and documents. Approval takes up to 24 hours.
            </p>
          </div>

          {/* Application ID Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block">Your Application ID</span>
            <span className="font-mono font-black text-slate-900 text-2xl tracking-wider">{submittedAppId}</span>
            <p className="text-[11px] text-slate-400 font-medium pt-1">
              A confirmation receipt with tracking details has been sent to your WhatsApp number.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href={`/application-status?id=${submittedAppId}`}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              Track Application <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/917020646007?text=Hello%20Techstar%20Money%20Team,%20I%20have%20submitted%20my%20DSA%20Partner%20Application%20ID:%20"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render Pre-Verification Screens (Screen 1: Mobile & Screen 2: OTP) ───
  if (!isMobileVerified) {
    const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber.replace(/\D/g, ""));

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
        {/* Header */}
        <header className="bg-slate-900 text-white py-4 px-6 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                T
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">Techstar Money</span>
                <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Techstar Money Solution Pvt. Ltd.
                </span>
              </div>
            </div>

            <Link
              href="/partner/login"
              className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1"
            >
              Partner Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Main Hero Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Left Column: Techstar Money Value Prop */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
              <div className="space-y-6 relative z-10">
                <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  DSA Partner Program
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Grow Your Financial Services Business
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Join 500+ certified loan partners across Maharashtra. Access 50+ leading banks, digital lead management, and quick payouts.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    "Zero setup fees or hidden charges",
                    "Instant digital onboarding with WhatsApp OTP",
                    "Industry-best commission slabs on disbursals",
                    "Dedicated Relationship Manager file support",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400">
                🛡️ 100% Secure & Compliant Financial Portal
              </div>
            </div>

            {/* Right Column: Screen 1 Mobile Entry Form */}
            <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Become a Techstar Money Partner
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Start your journey with Techstar Money and grow your financial services business.
                </p>
              </div>

              {mobileError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{mobileError}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enter your mobile number *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 border-r border-slate-300 pr-3">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">+91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile number"
                      className="w-full pl-22 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                    We will send a 6-digit WhatsApp OTP to verify your mobile number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || !isMobileValid}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending WhatsApp OTP...
                    </>
                  ) : (
                    <>
                      Get Started <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Already registered with Techstar Money?{" "}
                <Link href="/partner/login" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
                  Login to Portal
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All rights reserved.
        </footer>

        {/* Screen 2: WhatsApp OTP Modal */}
        <WhatsAppOtpModal
          isOpen={showOtpModal}
          phoneNumber={mobileNumber}
          onClose={() => setShowOtpModal(false)}
          onVerified={handleOtpVerified}
          onChangeNumber={() => setShowOtpModal(false)}
        />
      </div>
    );
  }

  // ─── 8-STEP ONBOARDING WIZARD ───
  const STEP_TITLES = [
    "Basic Details",
    "Business & PAN",
    "Contact Person",
    "Office Address",
    "GST Registration",
    "KYC Documents",
    "Bank Details",
    "Review & Submit",
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white py-3.5 px-6 shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-base shadow-sm">
              T
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Techstar Money</span>
              <span className="block text-[9px] text-emerald-400 font-bold uppercase">Partner Onboarding</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <span className="hidden sm:inline">📱 +91 {mobileNumber}</span>
            <Link href="/application-status" className="text-slate-400 hover:text-white">
              Status Tracker
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-4 space-y-6">
        {/* Stepper Progress Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
              Step {currentStep} of 8: {STEP_TITLES[currentStep - 1]}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {Math.round((currentStep / 8) * 100)}% Complete
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>

          {/* Step Pills for Desktop */}
          <div className="hidden sm:grid grid-cols-8 gap-1.5 mt-4 pt-3 border-t border-slate-100">
            {STEP_TITLES.map((title, idx) => {
              const stepIdx = idx + 1;
              const isPast = currentStep > stepIdx;
              const isCurrent = currentStep === stepIdx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => isPast && setCurrentStep(stepIdx)}
                  disabled={!isPast}
                  className={`text-left p-1.5 rounded-lg text-[10px] font-bold transition-all truncate ${
                    isCurrent
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isPast
                      ? "text-slate-700 hover:bg-slate-50 cursor-pointer"
                      : "text-slate-350 cursor-not-allowed"
                  }`}
                >
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400">Step {stepIdx}</span>
                  <span className="truncate block">{title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Step Error Banner */}
        {stepError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{stepError}</span>
          </div>
        )}

        {/* STEP CONTENT CARDS */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10">
          {/* ─────────────────────────────────────────────────────────────
              STEP 1: BASIC DETAILS
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">Basic Details</h2>
                <p className="text-slate-500 text-xs mt-1">Please provide your primary contact information.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name (as per PAN Card) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh.sharma@gmail.com"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={`+91 ${mobileNumber}`}
                      className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> WhatsApp Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingStep}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: BUSINESS & PAN DETAILS
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">Business & PAN Details</h2>
                <p className="text-slate-500 text-xs mt-1">Select your partner registration entity type and verify PAN.</p>
              </div>

              {/* Partner Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Partner Entity Type *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {(["Individual", "Firm"] as PartnerType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setPartnerType(type); setPanValid(false); }}
                      className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center flex items-center justify-center gap-2 ${
                        partnerType === type
                          ? "bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {type === "Individual" ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Firm Type Selection (If Firm) */}
              {partnerType === "Firm" && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Firm Type *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(["Proprietorship", "Partnership", "Private Limited", "Limited", "LLP"] as FirmType[]).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFirmType(ft)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                          firmType === ft
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PAN Number Input & Duplicate Check */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  {partnerType === "Individual" ? "Individual PAN Number *" : "Firm PAN Number *"}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => {
                      setPanNumber(e.target.value.toUpperCase());
                      setPanValid(false);
                      setPanDuplicateError(null);
                    }}
                    placeholder="e.g. ABCDE1234F"
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCheckPan}
                    disabled={panChecking || panNumber.trim().length !== 10}
                    className="py-3.5 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    {panChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Check PAN"}
                  </button>
                </div>

                {panValid && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-4 h-4" /> PAN format valid and verified available.
                  </p>
                )}

                {panDuplicateError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 mt-2">
                    <p className="text-xs text-red-700 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      PAN Already Linked
                    </p>
                    <p className="text-xs text-red-600">
                      {panDuplicateError}
                    </p>
                    <Link
                      href="/partner/login"
                      className="inline-block py-2 px-4 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-700"
                    >
                      Go to Partner Login &rarr;
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={savingStep || !panValid}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: CONTACT PERSON DETAILS
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">Contact Person Details</h2>
                <p className="text-slate-500 text-xs mt-1">Designated person details for communication and agreements.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Designation *
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {getDesignationOptions().map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={savingStep}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: OFFICE ADDRESS DETAILS
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">Office Address</h2>
                <p className="text-slate-500 text-xs mt-1">Official operating address of your business.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Address Line 1 (Shop / Office No, Building) *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Office No 402, Business Hub"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Address Line 2 (Street / Landmark)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Near City Center Mall, Shivaji Nagar"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Deccan Gymkhana"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit PIN code"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={savingStep}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 5: GST REGISTRATION
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 5 && (
            <form onSubmit={handleStep5Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">GST Registration</h2>
                <p className="text-slate-500 text-xs mt-1">Specify whether your firm is registered under GST.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700">
                  Is your business GST registered? *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  {(["Yes", "No"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setIsGstRegistered(opt);
                        if (opt === "No") {
                          setGstin("");
                          setGstValid(false);
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-sm font-bold transition-all text-center ${
                        isGstRegistered === opt
                          ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {isGstRegistered === "Yes" && (
                  <div className="space-y-2 pt-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-700">
                      GST Number (GSTIN) *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        maxLength={15}
                        value={gstin}
                        onChange={(e) => {
                          setGstin(e.target.value.toUpperCase());
                          setGstValid(false);
                        }}
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyGst}
                        disabled={gstVerifying || gstin.trim().length !== 15}
                        className="py-3.5 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        {gstVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify GST"}
                      </button>
                    </div>

                    {gstValid && (
                      <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4" /> GSTIN format validated successfully.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={savingStep || (isGstRegistered === "Yes" && !gstValid)}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 6: KYC DOCUMENTS UPLOAD
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 6 && (
            <form onSubmit={handleStep6Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">KYC Verification Documents</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Upload Aadhaar Card & PAN Card. Take photo with camera or choose from gallery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Aadhaar Upload Card */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Contact Person Aadhaar *</span>
                    {aadhaarDoc ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-500">Required</span>
                    )}
                  </div>

                  {aadhaarDoc ? (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate flex-1">{aadhaarDoc.fileName}</span>
                      </div>
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveCropModal("aadhaarDoc")}
                          className="text-emerald-600 hover:underline"
                        >
                          Replace Document
                        </button>
                        <button
                          type="button"
                          onClick={() => setAadhaarDoc(null)}
                          className="text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCropModal("aadhaarDoc")}
                      className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-600 transition-all"
                    >
                      <Camera className="w-6 h-6 text-emerald-600" />
                      <span className="text-xs font-bold">Upload Aadhaar Card</span>
                      <span className="text-[10px] text-slate-400">Camera / Gallery / PDF</span>
                    </button>
                  )}
                </div>

                {/* PAN Card Upload Card */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">PAN Card Document *</span>
                    {panDoc ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-500">Required</span>
                    )}
                  </div>

                  {panDoc ? (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate flex-1">{panDoc.fileName}</span>
                      </div>
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveCropModal("panDoc")}
                          className="text-emerald-600 hover:underline"
                        >
                          Replace Document
                        </button>
                        <button
                          type="button"
                          onClick={() => setPanDoc(null)}
                          className="text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCropModal("panDoc")}
                      className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-600 transition-all"
                    >
                      <Camera className="w-6 h-6 text-emerald-600" />
                      <span className="text-xs font-bold">Upload PAN Card</span>
                      <span className="text-[10px] text-slate-400">Camera / Gallery / PDF</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={savingStep || !aadhaarDoc || !panDoc}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 7: BANK ACCOUNT DETAILS (RAZORPAY IFSC)
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 7 && (
            <form onSubmit={handleStep7Submit} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">Bank Account Details</h2>
                <p className="text-slate-500 text-xs mt-1">For monthly DSA payouts and commission disbursals.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma / Techstar Enterprise"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Number *
                  </label>
                  <input
                    type="password"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank Account Number"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter Bank Account Number"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    IFSC Code *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={ifscCode}
                      onChange={(e) => handleIfscLookup(e.target.value)}
                      placeholder="e.g. HDFC0000103"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                    {ifscLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Type *
                  </label>
                  <select
                    value={accountType}
                    onChange={(e: any) => setAccountType(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>

                {/* Auto-populated Bank Details */}
                {bankName && (
                  <div className="sm:col-span-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <Landmark className="w-4 h-4" /> Bank & Branch Details (Razorpay Verified)
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">
                      <strong>Bank:</strong> {bankName} &nbsp;|&nbsp; <strong>Branch:</strong> {branchName}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={savingStep || !ifscValid || !bankName}
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
                >
                  {savingStep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 8: REVIEW & SUBMIT APPLICATION
          ────────────────────────────────────────────────────────────── */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-slate-900">Review Your Application</h2>
                <p className="text-slate-500 text-xs mt-1">Please review all submitted information before final submission.</p>
              </div>

              {/* Review Sections */}
              <div className="space-y-4">
                {/* 1. Basic Details */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1. Basic Details</span>
                    <p className="font-bold text-slate-800 text-sm">{fullName}</p>
                    <p className="text-xs text-slate-500">{email} • +91 {mobileNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 2. Business & PAN */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2. Business Details</span>
                    <p className="font-bold text-slate-800 text-sm">
                      {partnerType} {partnerType === "Firm" ? `(${firmType})` : ""}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">PAN: {panNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 3. Contact Person */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">3. Contact Person</span>
                    <p className="font-bold text-slate-800 text-sm">{contactPersonName} ({designation})</p>
                    <p className="text-xs text-slate-500">DOB: {dob} • Gender: {gender}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 4. Office Address */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">4. Office Address</span>
                    <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                      {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}, {city}, {district}, {stateName} - {pinCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 5. GST */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">5. GST Registration</span>
                    <p className="font-bold text-slate-800 text-xs">
                      {isGstRegistered === "Yes" ? `GSTIN: ${gstin}` : "Not GST Registered"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 6. Documents */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">6. KYC Documents</span>
                    <p className="text-xs text-slate-700 font-semibold">
                      ✓ Aadhaar ({aadhaarDoc?.fileName}) &nbsp;•&nbsp; ✓ PAN ({panDoc?.fileName})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 7. Bank Details */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">7. Bank Details</span>
                    <p className="font-bold text-slate-800 text-sm">{bankName} ({branchName})</p>
                    <p className="text-xs text-slate-500 font-mono">
                      A/C: ****{accountNumber.slice(-4)} • IFSC: {ifscCode} • {accountType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(7)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>

              {/* Declarations */}
              <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declareTruth}
                    onChange={(e) => setDeclareTruth(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700 leading-relaxed">
                    I confirm that all information and KYC documents provided by me are true, valid, and belong to me/my entity.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declareTerms}
                    onChange={(e) => setDeclareTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700 leading-relaxed">
                    I agree to Techstar Money Terms & Conditions, RBI Compliance guidelines, and Privacy Policy.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting || !declareTruth || !declareTerms}
                  className="py-4 px-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Partner Application <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All rights reserved.
      </footer>

      {/* Document Crop / Upload Modal */}
      {activeCropModal && (
        <ImageCropModal
          isOpen={true}
          title={activeCropModal === "aadhaarDoc" ? "Upload Aadhaar Card" : "Upload PAN Card"}
          onClose={() => setActiveCropModal(null)}
          onConfirm={handleDocumentCropped}
        />
      )}
    </div>
  );
}
