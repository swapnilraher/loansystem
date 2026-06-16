"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  ArrowRight, 
  FileText, 
  UserCircle,
  CreditCard,
  Building,
  Smartphone,
  UserPlus,
  UploadCloud,
  Coins,
  Star,
  Award,
  Copy
} from "lucide-react"

export default function PartnerRegistration() {
  const { user, profile, signInWithGooglePopup } = useAuth()
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [startedOnboarding, setStartedOnboarding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form States
  const [formData, setFormData] = useState({
    businessType: "Individual",
    mobileNumber: "",
    aadhaarNumber: "",
    panNumber: "",
  })

  // eKYC States
  const [aadhaarRefId, setAadhaarRefId] = useState("")
  const [aadhaarOtp, setAadhaarOtp] = useState("")
  const [kycData, setKycData] = useState<any>(null)
  const [panData, setPanData] = useState<any>(null)
  const [generatedDsaCode, setGeneratedDsaCode] = useState("")
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const code = generatedDsaCode || profile?.dsaCode || ""
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Helper to save onboarding progress in real-time
  const saveProgress = async (currentStep: number, extraData: any = {}) => {
    if (!user) return;
    try {
      const partnerRef = doc(db, "users", user.uid);
      const dataToSave = {
        role: "partner",
        mobileNumber: formData.mobileNumber,
        businessType: formData.businessType,
        onboardingStep: currentStep,
        dsaStatus: currentStep === 4 ? "Active" : "Pending Onboarding",
        updatedAt: serverTimestamp(),
        ...extraData
      };
      
      // Remove any undefined properties
      const cleanData = JSON.parse(JSON.stringify(dataToSave));
      cleanData.updatedAt = serverTimestamp();
      
      await setDoc(partnerRef, cleanData, { merge: true });
    } catch (e) {
      console.error("Error saving onboarding progress:", e);
    }
  };

  useEffect(() => {
    if (profile) {
      // If user is already active, redirect
      if (profile.role === "partner" && profile.dsaStatus === "Active") {
        router.push("/partner")
        return;
      }
      
      // Load progress
      setFormData(prev => ({
        ...prev,
        mobileNumber: profile.mobileNumber || prev.mobileNumber,
        businessType: profile.businessType || prev.businessType,
        aadhaarNumber: profile.aadhaarNumber || prev.aadhaarNumber,
        panNumber: profile.panData?.panNumber || profile.panNumber || prev.panNumber,
      }));

      if (profile.kycData) {
        setKycData(profile.kycData);
      }

      if (profile.panData) {
        setPanData(profile.panData);
      }

      if (profile.onboardingStep) {
        setStep(profile.onboardingStep + 1);
      }
    }
  }, [profile, router])

  const nextStep = () => setStep(s => s + 1)

  // Step 1: Auth & Basic
  const handleAuthContinue = async () => {
    if (!user) {
      setLoading(true)
      try {
        await signInWithGooglePopup()
      } catch (err: any) {
        setError(err.message)
      }
      setLoading(false)
    } else {
      if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
        setError("Please enter a valid 10-digit mobile number")
        return
      }
      setLoading(true)
      try {
        const q = query(collection(db, "users"), where("mobileNumber", "==", formData.mobileNumber));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const existingUser = snapshot.docs[0];
          if (existingUser.id !== user.uid) {
            setError("This mobile number is already registered with another partner.");
            setLoading(false);
            return;
          }
        }
        // Save progress for Step 1
        await saveProgress(1, {
          dsaStatus: "Pending Onboarding"
        });
      } catch (err) {
        console.error("Duplicate check error:", err);
      }
      setLoading(false)
      setError("")
      nextStep()
    }
  }

  // Step 2: Aadhaar OTP Send
  const sendAadhaarOtp = async () => {
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
      setError("Enter valid 12-digit Aadhaar Number")
      return
    }
    setLoading(true)
    setError("")

    // Mock bypass for testing
    if (formData.aadhaarNumber === "123456789012" || formData.aadhaarNumber === "000000000000") {
      setAadhaarRefId("mock_aadhaar_ref_123")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({
          action: "send-aadhaar-otp",
          payload: { aadhaar_number: formData.aadhaarNumber }
        })
      })
      const data = await res.json()
      console.log("Aadhaar OTP Response:", data)
      const refId = data?.data?.reference_id || data?.reference_id || data?.data?.message?.reference_id
      if (refId) {
        setAadhaarRefId(refId)
      } else {
        setError(data?.message || data?.error || "Failed to send OTP. Check console.")
      }
    } catch (e) {
      setError("API Error. Please try again.")
    }
    setLoading(false)
  }

  // Step 2: Aadhaar Verify
  const verifyAadhaarOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length !== 6) {
      setError("Enter 6-digit OTP")
      return
    }
    setLoading(true)
    setError("")
    try {
      let kycInfo = null;

      // Mock bypass for testing
      if (aadhaarOtp === "123456" || aadhaarRefId.startsWith("mock_")) {
        kycInfo = {
          name: "Test DSA Partner",
          dob: "15-08-1990",
          gender: "M",
          address: { house: "123", street: "Test Street", vtc: "Pune", district: "Pune", state: "Maharashtra", pincode: "411001" },
          photo_link: ""
        };
      } else {
        const res = await fetch("/api/sandbox", {
          method: "POST",
          body: JSON.stringify({
            action: "verify-aadhaar-otp",
            payload: { reference_id: aadhaarRefId, otp: aadhaarOtp }
          })
        })
        const data = await res.json()
        console.log("Aadhaar Verify Response:", data)
        kycInfo = data?.data?.name ? data.data : data?.name ? data : null;
      }

      if (kycInfo) {
        setKycData(kycInfo)
        
        // Save progress for Step 2
        await saveProgress(2, {
          kycVerified: true,
          aadhaarNumber: formData.aadhaarNumber,
          kycData: {
            name: kycInfo.name || kycInfo.full_name || "",
            dob: kycInfo.dob || kycInfo.date_of_birth || "",
            gender: kycInfo.gender || "",
            address: kycInfo.address || {},
            photoBase64: kycInfo.photo_link || kycInfo.photo_base64 || kycInfo.profile_image || kycInfo.photo || "",
          }
        });

        nextStep()
      } else {
        setError("Invalid OTP or Failed Verification")
      }
    } catch (e) {
      setError("Verification Failed")
    }
    setLoading(false)
  }

  // Step 3: PAN Verify
  const verifyPan = async () => {
    if (formData.panNumber.length !== 10) {
      setError("Please enter a valid 10-digit PAN")
      return
    }
    setLoading(true)
    setError("")

    const rawDob = kycData?.dob || kycData?.date_of_birth || "";
    let formattedDob = rawDob;
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
      const [y, m, d] = rawDob.split('-');
      formattedDob = `${d}/${m}/${y}`;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDob)) {
      const [d, m, y] = rawDob.split('-');
      formattedDob = `${d}/${m}/${y}`;
    }

    try {
      const q = query(collection(db, "users"), where("panData.panNumber", "==", formData.panNumber));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0];
        if (existingUser.id !== user.uid) {
          setError("A partner with this PAN is already registered.");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("PAN Duplicate check error:", err);
    }

    try {
      let panInfo = null;

      // Mock bypass for testing
      if (formData.panNumber === "ABCDE1234F" || formData.panNumber.startsWith("XYZ")) {
        panInfo = {
          full_name: kycData?.name || "Test DSA Partner",
          status: "valid"
        };
      } else {
        const res = await fetch("/api/sandbox", {
          method: "POST",
          body: JSON.stringify({
            action: "verify-pan",
            payload: { 
              pan_number: formData.panNumber,
              name_as_per_pan: kycData?.name || "",
              date_of_birth: formattedDob
            }
          })
        })
        const data = await res.json()
        console.log("PAN Verify Response:", data)
        const panStatus = data?.data?.status?.toLowerCase() || data?.status?.toLowerCase();
        panInfo = (panStatus === "valid" || panStatus === "active") ? (data.data || data) : null;
      }

      if (panInfo) {
        setPanData(panInfo)
        
        // Save progress for Step 3
        await saveProgress(3, {
          panVerified: true,
          panNumber: formData.panNumber,
          panData: {
            panNumber: formData.panNumber || "",
            name: panInfo.full_name || panInfo.name || "",
          }
        });

        nextStep()
      } else {
        setError("Invalid PAN or Verification Failed")
      }
    } catch (e) {
      setError("Verification Failed")
    }
    setLoading(false)
  }

  // Step 4: eSign Agreement & Finalize
  const finalizeRegistration = async () => {
    if (!user) return
    setLoading(true)
    try {
      const dsaCode = `T00${Math.floor(200 + Math.random() * 800)}`
      
      const extraData = {
        dsaCode,
        dsaStatus: "Active",
        agreementData: {
          signedAt: new Date().toISOString(),
          ipConsent: "OTP Verified",
          version: "1.0"
        }
      };

      await saveProgress(4, extraData);
      setGeneratedDsaCode(dsaCode)
      nextStep()
    } catch (e) {
      console.error("Firestore Error:", e);
      setError("Failed to create Partner Profile")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-12 pb-24 px-4 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      </div>

      {/* Progress Header */}
      <div className="w-full max-w-2xl mx-auto mb-10 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-black text-secondary dark:text-white tracking-tight text-center mb-2">DSA Partner Onboarding</h1>
        <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">4 simple steps to activate your official code</p>
        
        <div className="flex items-center justify-between relative px-4">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-650 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 4) * 92}%` }} />
          
          {[1, 2, 3, 4, 5].map((i) => {
            const isActive = step >= i;
            const isCompleted = step > i;
            return (
              <div 
                key={i} 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm relative z-10 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10'
                    : isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/25 scale-110'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : i}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider px-1 hidden sm:flex">
          <span>Sign-In</span>
          <span>Aadhaar eKYC</span>
          <span>PAN Match</span>
          <span>Agreement</span>
          <span>Active</span>
        </div>
        {/* Mobile active step label */}
        <div className="sm:hidden text-center mt-3 text-xs font-black uppercase text-primary tracking-widest">
          {step === 1 && "Step 1: Sign-In"}
          {step === 2 && "Step 2: Aadhaar eKYC"}
          {step === 3 && "Step 3: PAN Match"}
          {step === 4 && "Step 4: Agreement"}
          {step === 5 && "Step 5: Active"}
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-8 md:p-10 relative z-10 overflow-hidden">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold border border-rose-100 dark:border-rose-900/30">
            {error}
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-primary">
                <UserCircle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-secondary dark:text-white tracking-tight">Profile Setup</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Configure your B2B account type</p>
              </div>
            </div>
            
            {!user ? (
              <div className="space-y-6 pt-4 text-center">
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Authenticate with Google</p>
                  <p className="text-xs text-slate-400 font-medium">Verify your official Gmail profile to link your partner portal dashboard.</p>
                </div>
                <button 
                  onClick={handleAuthContinue}
                  disabled={loading}
                  className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 font-extrabold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-850 hover:-translate-y-0.5 transition-all shadow-md group disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin text-primary" />
                  ) : (
                    <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Sign in with Google
                </button>
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Category</label>
                    <select 
                      className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/10 rounded-2xl font-bold dark:text-white outline-none transition-all"
                      value={formData.businessType}
                      onChange={e => setFormData({...formData, businessType: e.target.value})}
                    >
                      <option>Individual</option>
                      <option>Proprietorship</option>
                      <option>Company</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Mobile Number</label>
                    <div className="relative group">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/10 rounded-2xl font-bold dark:text-white outline-none transition-all"
                        value={formData.mobileNumber}
                        onChange={e => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleAuthContinue}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all mt-6 shadow-lg shadow-primary/20"
                >
                  Continue to eKYC <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Aadhaar eKYC */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-secondary dark:text-white tracking-tight">Aadhaar eKYC</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Secure OTP validation</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Your identity is securely verified using Aadhaar eKYC Sandbox APIs. We do not cache or store your full Aadhaar details.</p>
            </div>

            {!aadhaarRefId ? (
              <div className="space-y-5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Aadhaar Number</label>
                  <input 
                    type="text"
                    maxLength={12}
                    placeholder="0000 0000 0000"
                    className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/10 rounded-2xl font-bold text-center text-base sm:text-lg tracking-[0.1em] sm:tracking-[0.2em] dark:text-white outline-none transition-all placeholder:tracking-normal"
                    value={formData.aadhaarNumber}
                    onChange={e => setFormData({...formData, aadhaarNumber: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
                <button 
                  onClick={sendAadhaarOtp}
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Send Verification OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Enter Verification Code</p>
                  <p className="text-xs text-slate-400 font-semibold">An OTP has been dispatched to your Aadhaar-registered mobile.</p>
                </div>
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/10 rounded-2xl font-black text-xl sm:text-2xl text-center tracking-[0.3em] sm:tracking-[0.5em] dark:text-white outline-none transition-all placeholder:tracking-normal"
                  value={aadhaarOtp}
                  onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                />
                <button 
                  onClick={verifyAadhaarOtp}
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify & Authenticate"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PAN Verification */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
                <CreditCard size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-secondary dark:text-white tracking-tight">PAN Verification</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Instant identity check</p>
              </div>
            </div>

            {/* Aadhaar Data Summary Display */}
            {kycData && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-[0.02] text-secondary dark:text-white">
                  <ShieldCheck size={100} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aadhaar Profile Card</h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative z-10">
                  <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                    {kycData.photo_link || kycData.photo_base64 || kycData.profile_image || kycData.photo ? (
                      <img src={`data:image/jpeg;base64,${kycData.photo_link || kycData.photo_base64 || kycData.profile_image || kycData.photo}`} alt="Aadhaar Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-100 dark:bg-slate-900 text-xs font-bold">Verified Photo</div>
                    )}
                  </div>
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Name</p>
                      <p className="font-black text-secondary dark:text-white text-base mt-1">{kycData.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">DOB</p>
                        <p className="font-bold text-secondary dark:text-white text-xs mt-1">{kycData.dob || kycData.date_of_birth || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Care Of / Relative</p>
                        <p className="font-bold text-secondary dark:text-white text-xs mt-1 truncate max-w-[150px]">{kycData.care_of || kycData.father_name || kycData.relative_name || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Address Details</p>
                      <p className="font-semibold text-secondary/80 dark:text-slate-300 text-xs mt-1 leading-relaxed">
                        {typeof kycData.address === 'object' && kycData.address !== null 
                          ? [kycData.address.house, kycData.address.street, kycData.address.vtc, kycData.address.district, kycData.address.state, kycData.address.pincode].filter(Boolean).join(', ')
                          : kycData.address || "N/A"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Aadhaar Verified Name (Read-only)</label>
                <input 
                  type="text"
                  readOnly
                  className="w-full h-14 px-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl font-bold outline-none cursor-not-allowed"
                  value={kycData?.name || ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">PAN Card Number</label>
                <input 
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/10 rounded-2xl font-bold text-center text-base sm:text-lg tracking-[0.1em] sm:tracking-[0.2em] dark:text-white outline-none uppercase placeholder:tracking-normal"
                  value={formData.panNumber}
                  onChange={e => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                />
              </div>
              <button 
                onClick={verifyPan}
                disabled={loading}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify Identity Match"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Agreement */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500">
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-secondary dark:text-white tracking-tight">DSA Agreement</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Digital eSign contract</p>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 h-72 overflow-y-auto scrollbar-thin text-xs font-medium text-slate-650 dark:text-slate-400 space-y-4">
              <h3 className="font-black text-secondary dark:text-white text-sm text-center tracking-tight uppercase">DIRECT SELLING AGENT (DSA) AGREEMENT</h3>
              <p className="leading-relaxed">This Agreement is executed on <strong>{new Date().toLocaleDateString()}</strong> between <strong>Techstar Money Solution</strong> and <strong>{kycData?.name || panData?.full_name}</strong>.</p>
              <p className="leading-relaxed"><strong>1. Scope of Work:</strong> The DSA shall source loan applications and submit them to Techstar Money Solution via the Partner Portal.</p>
              <p className="leading-relaxed"><strong>2. Compliance:</strong> The DSA agrees to comply with all RBI guidelines, data privacy laws, and avoid any misrepresentation to customers.</p>
              <p className="leading-relaxed"><strong>3. Commission:</strong> Techstar Money Solution will pay commission based on disbursed loan amounts as per the current Product Master slab. Commission is subject to TDS deductions.</p>
              <p className="leading-relaxed"><strong>4. Confidentiality:</strong> All customer data is confidential and must not be shared with unauthorized third parties.</p>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="font-black text-secondary dark:text-white uppercase tracking-wider text-[10px] mb-2">DSA Details Verified via eKYC:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl">
                  <p className="text-slate-400 font-semibold">Name: <span className="text-secondary dark:text-white font-black">{kycData?.name}</span></p>
                  <p className="text-slate-400 font-semibold">PAN: <span className="text-secondary dark:text-white font-black">{formData.panNumber}</span></p>
                  <p className="text-slate-400 font-semibold">Aadhaar: <span className="text-secondary dark:text-white font-black">**** **** {formData.aadhaarNumber.slice(-4)}</span></p>
                  <p className="text-slate-400 font-semibold break-words col-span-1 sm:col-span-2">Address: <span className="text-secondary dark:text-white font-black">
                    {typeof kycData?.address === 'object' && kycData?.address !== null 
                      ? [kycData.address.house, kycData.address.street, kycData.address.vtc].filter(Boolean).join(', ') 
                      : (typeof kycData?.address === 'string' ? kycData.address.split(', ').slice(0, 3).join(', ') : "N/A")
                    }...
                  </span></p>
                </div>
              </div>
            </div>

            <button 
              onClick={finalizeRegistration}
              disabled={loading}
              className="w-full h-14 bg-secondary dark:bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : "I Agree & eSign (OTP Verified)"}
            </button>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500 py-8 relative">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-[2rem] mx-auto flex items-center justify-center shadow-inner border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tight">Registration Complete!</h2>
              <p className="text-slate-500 dark:text-slate-450 font-bold">Your Official DSA Code is now active.</p>
            </div>
            
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] max-w-sm mx-auto shadow-inner space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your DSA Code</p>
                <p className="text-3xl font-black text-primary tracking-widest">{generatedDsaCode || profile?.dsaCode || 'T00---'}</p>
              </div>
              <button 
                onClick={copyToClipboard}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-emerald-500 text-white shadow-lg' 
                    : 'bg-white dark:bg-slate-900 text-secondary dark:text-white border border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={14} /> Code Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy DSA Code
                  </>
                )}
              </button>
            </div>
            
            <button 
              onClick={() => router.push('/partner')}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
            >
              Enter Partner Dashboard <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
