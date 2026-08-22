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
  Search
} from "lucide-react";

import WhatsAppOtpModal from "@/components/onboarding/WhatsAppOtpModal";
import ImageCropModal from "@/components/onboarding/ImageCropModal";

export default function OnboardingPage() {
  // Mobile Verification State
  const [mobileNumber, setMobileNumber] = useState("");
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Step Counter (1 to 8)
  const [currentStep, setCurrentStep] = useState(1);
  const [savingStep, setSavingStep] = useState(false);

  // Step 1: Basic Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Step 2: Partner Type & PAN
  const [partnerType, setPartnerType] = useState<"Individual" | "Firm">("Individual");
  const [firmType, setFirmType] = useState<"Proprietorship" | "Partnership" | "Private Limited" | "Limited" | "LLP">("Proprietorship");
  const [panNumber, setPanNumber] = useState("");
  const [panValid, setPanValid] = useState(false);
  const [panVerifying, setPanVerifying] = useState(false);
  const [panError, setPanError] = useState<string | null>(null);

  // Step 3: Contact Person Details
  const [contactPersonName, setContactPersonName] = useState("");
  const [designation, setDesignation] = useState("Individual / Proprietor");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");

  // Step 4: Office Address Details
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Step 5: GST Registration
  const [isGstRegistered, setIsGstRegistered] = useState<"Yes" | "No">("No");
  const [gstin, setGstin] = useState("");
  const [gstValid, setGstValid] = useState(false);

  // Step 6: Aadhaar & PAN Uploads
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panDoc, setPanDoc] = useState<{ fileName: string; sizeBytes: number; uploadedAt: string } | null>(null);
  const [aadhaarDoc, setAadhaarDoc] = useState<{ fileName: string; sizeBytes: number; uploadedAt: string } | null>(null);
  const [gstDoc, setGstDoc] = useState<{ fileName: string; sizeBytes: number; uploadedAt: string } | null>(null);

  const [activeCropModal, setActiveCropModal] = useState<"panDoc" | "aadhaarDoc" | "gstDoc" | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Step 7: Bank Details
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountType, setAccountType] = useState<"Savings" | "Current">("Savings");
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscValid, setIfscValid] = useState(false);

  // Step 8: Declaration & Final Submission
  const [declareTruth, setDeclareTruth] = useState(false);
  const [declareTerms, setDeclareTerms] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Global Error state
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Auto-validate PAN format on typing
  useEffect(() => {
    if (panNumber.length === 10) {
      handleCheckPan(panNumber);
    } else {
      setPanValid(false);
      setPanError(null);
    }
  }, [panNumber]);

  // Handle IFSC lookup on 11 characters
  useEffect(() => {
    if (ifscCode.length === 11) {
      handleLookupIfsc(ifscCode);
    } else {
      setIfscValid(false);
      setBankName("");
      setBranchName("");
    }
  }, [ifscCode]);

  // ── Initial WhatsApp OTP ──────────────────────────────────────────────────────
  const handleSendMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    setMobileError(null);
    setOtpLoading(true);

    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setShowOtpModal(true);
    } catch (err: any) {
      setMobileError(err.message || "Failed to send OTP via WhatsApp.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpVerified = async (token: string) => {
    setIsMobileVerified(true);
    setShowOtpModal(false);

    // Try to resume existing draft
    try {
      const res = await fetch(`/api/onboarding/resume?mobile=${mobileNumber}`);
      const data = await res.json();

      if (data.exists && data.data) {
        const saved = data.data;
        if (saved.fullName) setFullName(saved.fullName);
        if (saved.email) setEmail(saved.email);
        if (saved.partnerType) setPartnerType(saved.partnerType);
        if (saved.firmType) setFirmType(saved.firmType);
        if (saved.panNumber) setPanNumber(saved.panNumber);
        if (saved.contactPersonName) setContactPersonName(saved.contactPersonName);
        if (saved.designation) setDesignation(saved.designation);
        if (saved.dob) setDob(saved.dob);
        if (saved.gender) setGender(saved.gender);
        if (saved.addressLine1) setAddressLine1(saved.addressLine1);
        if (saved.addressLine2) setAddressLine2(saved.addressLine2);
        if (saved.area) setArea(saved.area);
        if (saved.city) setCity(saved.city);
        if (saved.district) setDistrict(saved.district);
        if (saved.stateName) setStateName(saved.stateName);
        if (saved.pinCode) setPinCode(saved.pinCode);
        if (saved.isGstRegistered) setIsGstRegistered(saved.isGstRegistered);
        if (saved.gstin) setGstin(saved.gstin);
        if (saved.aadhaarNumber) setAadhaarNumber(saved.aadhaarNumber);
        if (saved.documents?.panDoc) setPanDoc(saved.documents.panDoc);
        if (saved.documents?.aadhaarDoc) setAadhaarDoc(saved.documents.aadhaarDoc);
        if (saved.documents?.gstDoc) setGstDoc(saved.documents.gstDoc);
        if (saved.bankDetails) {
          setAccountHolderName(saved.bankDetails.accountHolderName || "");
          setAccountNumber(saved.bankDetails.accountNumber || "");
          setConfirmAccountNumber(saved.bankDetails.accountNumber || "");
          setIfscCode(saved.bankDetails.ifsc || "");
          setBankName(saved.bankDetails.bankName || "");
          setBranchName(saved.bankDetails.branchName || "");
          setAccountType(saved.bankDetails.accountType || "Savings");
        }
        if (saved.status === "under_review" || saved.applicationId) {
          setSubmittedAppId(saved.applicationId);
        }
        if (saved.currentStep) {
          setCurrentStep(saved.currentStep);
        }
      }
    } catch (e) {
      console.warn("Resume draft note:", e);
    }
  };

  // ── PAN Check ─────────────────────────────────────────────────────────────────
  const handleCheckPan = async (pan: string) => {
    setPanVerifying(true);
    setPanError(null);
    try {
      const res = await fetch("/api/onboarding/pan/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber: pan, mobileNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPanValid(false);
        setPanError(data.error || "Invalid PAN number");
      } else {
        setPanValid(true);
        setPanError(null);
      }
    } catch (err: any) {
      setPanValid(false);
      setPanError("Failed to check PAN number");
    } finally {
      setPanVerifying(false);
    }
  };

  // ── Razorpay IFSC Lookup ──────────────────────────────────────────────────────
  const handleLookupIfsc = async (ifsc: string) => {
    setIfscLoading(true);
    try {
      const res = await fetch(`/api/onboarding/ifsc?code=${ifsc}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setBankName(data.bank);
        setBranchName(data.branch);
        setIfscValid(true);
      } else {
        setIfscValid(false);
        setBankName("");
        setBranchName("");
      }
    } catch (err) {
      setIfscValid(false);
    } finally {
      setIfscLoading(false);
    }
  };

  // ── Document Upload Handler ───────────────────────────────────────────────────
  const handleConfirmDocUpload = async (docType: "panDoc" | "aadhaarDoc" | "gstDoc", file: File) => {
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docType);
      formData.append("mobileNumber", mobileNumber);

      const res = await fetch("/api/onboarding/document/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (docType === "panDoc") setPanDoc(data.document);
      if (docType === "aadhaarDoc") setAadhaarDoc(data.document);
      if (docType === "gstDoc") setGstDoc(data.document);
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  // ── Save Step Progress ────────────────────────────────────────────────────────
  const saveStepData = async (stepNum: number, stepPayload: Record<string, any>) => {
    setSavingStep(true);
    setGlobalError(null);
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
      if (!res.ok) throw new Error(data.error || "Failed to save step");
      return true;
    } catch (err: any) {
      setGlobalError(err.message || "Failed to save step progress.");
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  // ── Step Navigation ──────────────────────────────────────────────────────────
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!fullName.trim() || !email.trim()) {
        setGlobalError("Please fill in your Full Name and Email Address.");
        return;
      }
      const saved = await saveStepData(1, { fullName, email });
      if (saved) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!panValid) {
        setGlobalError("Please enter a valid, non-duplicate PAN number.");
        return;
      }
      const saved = await saveStepData(2, { partnerType, firmType, panNumber });
      if (saved) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!contactPersonName.trim() || !dob || !gender) {
        setGlobalError("Please complete all Contact Person fields.");
        return;
      }
      const saved = await saveStepData(3, { contactPersonName, designation, dob, gender });
      if (saved) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!addressLine1.trim() || !city.trim() || !stateName.trim() || !pinCode.trim()) {
        setGlobalError("Please complete all mandatory Office Address fields.");
        return;
      }
      const saved = await saveStepData(4, { addressLine1, addressLine2, area, city, district, stateName, pinCode });
      if (saved) setCurrentStep(5);
    } else if (currentStep === 5) {
      if (isGstRegistered === "Yes" && !gstin.trim()) {
        setGlobalError("Please enter your GSTIN number.");
        return;
      }
      const saved = await saveStepData(5, { isGstRegistered, gstin });
      if (saved) setCurrentStep(6);
    } else if (currentStep === 6) {
      if (!panDoc || !aadhaarDoc) {
        setGlobalError("PAN Document and Aadhaar Document uploads are compulsory.");
        return;
      }
      const saved = await saveStepData(6, { aadhaarNumber });
      if (saved) setCurrentStep(7);
    } else if (currentStep === 7) {
      if (!accountNumber || accountNumber !== confirmAccountNumber || !ifscValid) {
        setGlobalError("Please verify that Bank Account Numbers match and IFSC Code is valid.");
        return;
      }
      const saved = await saveStepData(7, {
        bankDetails: { accountHolderName: accountHolderName || fullName, accountNumber, ifsc: ifscCode, bankName, branchName, accountType }
      });
      if (saved) setCurrentStep(8);
    }
  };

  // ── Final Submission ─────────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!declareTruth || !declareTerms) {
      setGlobalError("You must agree to the truthfulness declaration and terms & conditions.");
      return;
    }

    setSubmittingApp(true);
    setGlobalError(null);

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
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmittedAppId(data.applicationId);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to submit application.");
    } finally {
      setSubmittingApp(false);
    }
  };

  // ── Render Submission Success / Approval Pending Screen ───────────────────────
  if (submittedAppId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 text-center p-8">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted Successfully!</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
            Your Techstar Money DSA Partner application has been received and is currently undergoing admin review.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-medium">Application ID</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{submittedAppId}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-medium">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold text-xs rounded-full">
                <Clock className="w-3.5 h-3.5" /> Under Review
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">SLA Estimate</span>
              <span className="text-xs text-slate-700 font-medium">Up to 24 Hours</span>
            </div>
          </div>

          <p className="text-slate-500 text-xs mb-8">
            You will receive WhatsApp and email updates once your application is reviewed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/application-status?id=${submittedAppId}`}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              Track Application Status
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Initial Mobile Verification Screen (Pre-OTP) ───────────────────────
  if (!isMobileVerified) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
        {/* Top Header */}
        <header className="border-b border-slate-800 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
                T
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white">Techstar Money</span>
                <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">DSA Partner Portal</span>
              </div>
            </div>
            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Main Site →
            </Link>
          </div>
        </header>

        {/* Main Content (2-Column Desktop / Single Column Mobile) */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
            {/* Left Side Branding */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Official Channel Partner Onboarding
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Techstar Money</span> Partner
              </h1>

              <p className="text-slate-400 text-base sm:text-lg max-w-xl">
                Grow your financial services business with access to 40+ leading Banks & NBFCs, instant payouts, and a high-tech DSA portal.
              </p>

              {/* Benefits Bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  "Personal, Business & Home Loans",
                  "Real-Time Lead & Commission Tracking",
                  "Automated WhatsApp Notifications",
                  "Dedicated Partner Relationship Manager",
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-xl">
                    <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-200 text-sm font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Mobile Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Get Started</h2>
                <p className="text-slate-500 text-xs mb-6">
                  Enter your mobile number to receive a verification OTP via WhatsApp.
                </p>

                {mobileError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{mobileError}</span>
                  </div>
                )}

                <form onSubmit={handleSendMobileOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-500 text-sm font-bold border-r border-slate-200 pr-2.5">
                        +91
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="98765 43210"
                        className="w-full pl-16 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || mobileNumber.length < 10}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-base mt-2"
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Sending WhatsApp OTP...
                      </>
                    ) : (
                      <>
                        Get Started (WhatsApp OTP)
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-slate-400 text-center mt-4">
                  By clicking Get Started, you agree to Techstar Money's{" "}
                  <Link href="/terms" className="text-emerald-600 underline">
                    Terms
                  </Link>{" "}
                  &{" "}
                  <Link href="/privacy" className="text-emerald-600 underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All rights reserved.
        </footer>

        {/* WhatsApp OTP Modal */}
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

  // ── Render 8-Step Onboarding Wizard ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white py-4 px-4 sm:px-8 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md">
              T
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">Techstar Money</span>
              <span className="block text-[10px] text-emerald-400 font-bold uppercase">Partner Onboarding</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 {mobileNumber}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mobile Verified
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3">
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-700">
            <span>
              Step <strong className="text-emerald-600 font-bold">{currentStep}</strong> of 8
            </span>
            <span className="text-slate-500 font-normal hidden sm:inline">
              {[
                "Basic Details",
                "Partner Type & PAN",
                "Contact Person",
                "Office Address",
                "GST Registration",
                "KYC Documents",
                "Bank Details",
                "Review & Submit",
              ][currentStep - 1]}
            </span>
            <span className="text-emerald-600 font-bold">{Math.round((currentStep / 8) * 100)}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 my-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {globalError && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="p-6 sm:p-10">
            {/* STEP 1: Basic Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">1. Tell us about yourself</h2>
                  <p className="text-slate-500 text-xs mt-1">Please enter your basic personal contact details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name (as per PAN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Swapnil Ramesh Aher"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="swapnil@example.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={`+91 ${mobileNumber}`}
                    disabled
                    className="w-full p-3 bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm rounded-xl cursor-not-allowed"
                  />
                  <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
                    ✓ Verified via WhatsApp OTP
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: Partner Type & PAN */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">2. Select Partner Type & PAN</h2>
                  <p className="text-slate-500 text-xs mt-1">Choose your business structure and enter your PAN details.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Partner Category</label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    {(["Individual", "Firm"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPartnerType(type)}
                        className={`p-4 border-2 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          partnerType === type
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {type === "Individual" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {partnerType === "Firm" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Firm / Business Structure</label>
                    <div className="flex flex-wrap gap-2">
                      {(["Proprietorship", "Partnership", "Private Limited", "Limited", "LLP"] as const).map((ft) => (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => setFirmType(ft)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            firmType === ft
                              ? "bg-slate-900 text-white border-slate-900 shadow"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {ft}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {partnerType === "Individual" ? "PAN Number" : "Firm PAN Number"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold tracking-widest uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  {panVerifying && <span className="text-xs text-slate-400 mt-1 block">Verifying PAN...</span>}
                  {panValid && <span className="text-xs text-emerald-600 font-bold mt-1 block">✓ Valid & Available PAN Number</span>}
                  {panError && <span className="text-xs text-red-600 font-semibold mt-1 block">{panError}</span>}
                </div>
              </div>
            )}

            {/* STEP 3: Contact Person Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">3. Contact Person Details</h2>
                  <p className="text-slate-500 text-xs mt-1">Enter authorized signatory / contact person details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactPersonName || fullName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="Contact Person Full Name"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Office Address */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">4. Office & Contact Address</h2>
                  <p className="text-slate-500 text-xs mt-1">Provide your primary office address details.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Shop/Office No., Building Name"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 2</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Street, Landmark"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="431001"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: GST Registration */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">5. GST Registration</h2>
                  <p className="text-slate-500 text-xs mt-1">Specify whether your business is GST registered.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Is your business GST Registered?</label>
                  <div className="flex gap-4">
                    {(["Yes", "No"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIsGstRegistered(opt)}
                        className={`py-3 px-8 rounded-xl font-bold text-sm border transition-all ${
                          isGstRegistered === opt
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {isGstRegistered === "Yes" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      GSTIN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="27ABCDE1234F1Z5"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase text-base focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: KYC Documents */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">6. KYC Document Uploads</h2>
                  <p className="text-slate-500 text-xs mt-1">Upload clear photos or PDFs of PAN Card and Aadhaar Card.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Aadhaar Number</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234 5678 9012"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* PAN Upload Card */}
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">PAN Card Document <span className="text-red-500">*</span></h4>
                      <p className="text-slate-400 text-[11px]">Compulsory JPG, PNG or PDF</p>
                    </div>

                    {panDoc ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
                        <span className="truncate max-w-[150px]">{panDoc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setActiveCropModal("panDoc")}
                          className="text-emerald-700 underline text-[11px]"
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveCropModal("panDoc")}
                        className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto transition-all shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" /> Upload PAN Document
                      </button>
                    )}
                  </div>

                  {/* Aadhaar Upload Card */}
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                    <FileCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Aadhaar Document <span className="text-red-500">*</span></h4>
                      <p className="text-slate-400 text-[11px]">Compulsory JPG, PNG or PDF</p>
                    </div>

                    {aadhaarDoc ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
                        <span className="truncate max-w-[150px]">{aadhaarDoc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setActiveCropModal("aadhaarDoc")}
                          className="text-emerald-700 underline text-[11px]"
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveCropModal("aadhaarDoc")}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto transition-all shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" /> Upload Aadhaar Document
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Bank Details */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">7. Bank Account Details</h2>
                  <p className="text-slate-500 text-xs mt-1">Enter your bank account for commission payouts.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={accountHolderName || fullName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name as per Bank Account"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter Account Number"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="Re-enter Account Number"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0000001"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold tracking-widest text-base uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                    {ifscLoading && <span className="text-xs text-slate-400 mt-1 block">Checking IFSC via Razorpay API...</span>}
                    {ifscValid && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 space-y-0.5">
                        <p>✓ <strong>Bank:</strong> {bankName}</p>
                        <p>✓ <strong>Branch:</strong> {branchName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Review & Submit */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">8. Review Your Application</h2>
                  <p className="text-slate-500 text-xs mt-1">Verify all details before final submission.</p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-2">
                      <span>Applicant Details</span>
                      <button type="button" onClick={() => setCurrentStep(1)} className="text-emerald-600 hover:underline">
                        Edit
                      </button>
                    </div>
                    <p><strong>Name:</strong> {fullName}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Mobile:</strong> +91 {mobileNumber}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-2">
                      <span>Business & PAN</span>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-emerald-600 hover:underline">
                        Edit
                      </button>
                    </div>
                    <p><strong>Category:</strong> {partnerType} {partnerType === "Firm" ? `(${firmType})` : ""}</p>
                    <p><strong>PAN:</strong> {panNumber}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-2">
                      <span>Bank & Payouts</span>
                      <button type="button" onClick={() => setCurrentStep(7)} className="text-emerald-600 hover:underline">
                        Edit
                      </button>
                    </div>
                    <p><strong>Bank:</strong> {bankName || "N/A"}</p>
                    <p><strong>Branch:</strong> {branchName || "N/A"}</p>
                    <p><strong>Account:</strong> ••••••{accountNumber.slice(-4)}</p>
                    <p><strong>IFSC:</strong> {ifscCode}</p>
                  </div>

                  {/* Declaration Checkboxes */}
                  <div className="pt-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declareTruth}
                        onChange={(e) => setDeclareTruth(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        I confirm that all information and documents provided by me are true, complete, and accurate.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declareTerms}
                        onChange={(e) => setDeclareTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        I agree to Techstar Money's Terms & Conditions and Partner Onboarding Guidelines.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="py-3 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={savingStep}
                className="py-3.5 px-7 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                {savingStep ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submittingApp || !declareTruth || !declareTerms}
                className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                {submittingApp ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Partner Application
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Image Crop & Upload Modal */}
      {activeCropModal && (
        <ImageCropModal
          isOpen={true}
          title={
            activeCropModal === "panDoc"
              ? "Upload PAN Document"
              : activeCropModal === "aadhaarDoc"
              ? "Upload Aadhaar Document"
              : "Upload GST Document"
          }
          onClose={() => setActiveCropModal(null)}
          onConfirm={(file) => handleConfirmDocUpload(activeCropModal, file)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Techstar Money Solution Pvt. Ltd. All rights reserved.
      </footer>
    </div>
  );
}
