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
  Smartphone
} from "lucide-react"

export default function PartnerRegistration() {
  const { user, profile, signInWithGooglePopup } = useAuth()
  const router = useRouter()
  
  const [step, setStep] = useState(1)
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

  useEffect(() => {
    // If user is already active, redirect
    if (profile?.role === "partner" && profile?.dsaStatus === "Active") {
      router.push("/partner")
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
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({
          action: "verify-aadhaar-otp",
          payload: { reference_id: aadhaarRefId, otp: aadhaarOtp }
        })
      })
      const data = await res.json()
      console.log("Aadhaar Verify Response:", data)
      const kycInfo = data?.data?.name ? data.data : data?.name ? data : null;
      if (kycInfo) {
        setKycData(kycInfo)
        nextStep()
      } else {
        setError(data?.message || data?.error || "Invalid OTP or Failed Verification")
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
      const panInfo = (panStatus === "valid" || panStatus === "active") ? (data.data || data) : null;
      if (panInfo) {
        setPanData(panInfo)
        nextStep()
      } else {
        setError(data?.message || data?.error || "Invalid PAN or Verification Failed")
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
      const partnerRef = doc(db, "users", user.uid)
      
      const partnerData = {
        role: "partner",
        dsaCode,
        dsaStatus: "Active",
        mobileNumber: formData.mobileNumber,
        businessType: formData.businessType,
        kycVerified: true,
        panVerified: true,
        kycData: {
          name: kycData?.name || kycData?.full_name || "",
          dob: kycData?.dob || kycData?.date_of_birth || "",
          gender: kycData?.gender || "",
          address: kycData?.address || {},
          photoBase64: kycData?.photo_link || kycData?.photo_base64 || kycData?.profile_image || kycData?.photo || "", // Store Base64 photo
        },
        panData: {
          panNumber: formData.panNumber || "",
          name: panData?.full_name || panData?.name || "",
        },
        agreementData: {
          signedAt: new Date().toISOString(),
          ipConsent: "OTP Verified",
          version: "1.0"
        },
        updatedAt: serverTimestamp()
      }

      // Deep clean the object to remove any potential 'undefined' values that Firebase rejects
      const safePartnerData = JSON.parse(JSON.stringify(partnerData));
      
      // We must explicitly add the serverTimestamp back because JSON.stringify strips it
      safePartnerData.updatedAt = serverTimestamp();

      await setDoc(partnerRef, safePartnerData, { merge: true })
      setGeneratedDsaCode(dsaCode)
      nextStep()
    } catch (e) {
      console.error("Firestore Error:", e);
      setError("Failed to create Partner Profile")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-12 pb-24 px-4">
      {/* Progress Header */}
      <div className="w-full max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-black text-secondary tracking-tight text-center mb-6">DSA Partner Onboarding</h1>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }} />
          
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs relative z-10 transition-all ${
              step >= i ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-slate-200 text-slate-400'
            }`}>
              {step > i ? <CheckCircle2 size={16} /> : i}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">
          <span>Basic Info</span>
          <span>Aadhaar</span>
          <span>PAN Verify</span>
          <span>Agreement</span>
          <span>Done</span>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 md:p-10 relative overflow-hidden">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100">
            {error}
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-secondary flex items-center gap-2">
              <UserCircle className="text-primary" /> Profile Setup
            </h2>
            
            {!user ? (
              <div className="space-y-4 pt-4">
                <p className="text-sm font-bold text-slate-500">Step 1: Authenticate to start</p>
                <button 
                  onClick={handleAuthContinue}
                  disabled={loading}
                  className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-50 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Business Type</label>
                  <select 
                    className="w-full h-14 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none"
                    value={formData.businessType}
                    onChange={e => setFormData({...formData, businessType: e.target.value})}
                  >
                    <option>Individual</option>
                    <option>Proprietorship</option>
                    <option>Company</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Mobile Number (WhatsApp)</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none"
                      value={formData.mobileNumber}
                      onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAuthContinue}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Aadhaar eKYC */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-secondary flex items-center gap-2">
              <ShieldCheck className="text-primary" /> Aadhaar eKYC
            </h2>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-xs font-bold text-blue-600">Your Aadhaar is securely verified via Sandbox API. We do not store your Aadhaar number.</p>
            </div>

            {!aadhaarRefId ? (
              <div className="space-y-4">
                <input 
                  type="text"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar Number"
                  className="w-full h-14 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-center tracking-[0.2em] outline-none"
                  value={formData.aadhaarNumber}
                  onChange={e => setFormData({...formData, aadhaarNumber: e.target.value.replace(/\D/g, '')})}
                />
                <button 
                  onClick={sendAadhaarOtp}
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Send Aadhaar OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-bold text-center text-slate-500">OTP sent to Aadhaar linked mobile</p>
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full h-14 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-black text-2xl text-center tracking-[0.5em] outline-none"
                  value={aadhaarOtp}
                  onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                />
                <button 
                  onClick={verifyAadhaarOtp}
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify eKYC"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PAN Verification */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-secondary flex items-center gap-2">
              <CreditCard className="text-primary" /> PAN & Identity Match
            </h2>

            {/* Aadhaar Data Summary Display */}
            {kycData && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck size={100} />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Aadhaar eKYC Details</h3>
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
                    {kycData.photo_link || kycData.photo_base64 || kycData.profile_image || kycData.photo ? (
                      <img src={`data:image/jpeg;base64,${kycData.photo_link || kycData.photo_base64 || kycData.profile_image || kycData.photo}`} alt="Aadhaar Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 text-xs font-bold">No Photo</div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Full Name</p>
                      <p className="font-black text-secondary text-sm">{kycData.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">DOB</p>
                        <p className="font-bold text-secondary text-xs">{kycData.dob || kycData.date_of_birth || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Care Of / Father</p>
                        <p className="font-bold text-secondary text-xs">{kycData.care_of || kycData.father_name || kycData.relative_name || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Address</p>
                      <p className="font-medium text-secondary text-xs">
                        {typeof kycData.address === 'object' && kycData.address !== null 
                          ? [kycData.address.house, kycData.address.street, kycData.address.landmark, kycData.address.vtc, kycData.address.district, kycData.address.state, kycData.address.pincode].filter(Boolean).join(', ')
                          : kycData.address || "N/A"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Name as per Aadhaar (Read-only)</label>
                <input 
                  type="text"
                  readOnly
                  className="w-full h-14 px-4 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl font-bold outline-none cursor-not-allowed"
                  value={kycData?.name || ""}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">10-digit PAN Number</label>
                <input 
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full h-14 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-center tracking-[0.2em] outline-none uppercase"
                  value={formData.panNumber}
                  onChange={e => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                />
              </div>
              <button 
                onClick={verifyPan}
                disabled={loading}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify PAN Match"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Agreement */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-secondary flex items-center gap-2">
              <FileText className="text-primary" /> DSA Agreement
            </h2>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-64 overflow-y-auto custom-scrollbar text-xs font-medium text-slate-600 space-y-4">
              <h3 className="font-black text-secondary text-sm text-center">DIRECT SELLING AGENT (DSA) AGREEMENT</h3>
              <p>This Agreement is executed on <strong>{new Date().toLocaleDateString()}</strong> between <strong>TechStar Solution</strong> and <strong>{kycData?.name || panData?.full_name}</strong>.</p>
              <p><strong>1. Scope of Work:</strong> The DSA shall source loan applications and submit them to TechStar via the Partner Portal.</p>
              <p><strong>2. Compliance:</strong> The DSA agrees to comply with all RBI guidelines, data privacy laws, and avoid any misrepresentation to customers.</p>
              <p><strong>3. Commission:</strong> TechStar will pay commission based on disbursed loan amounts as per the current Product Master slab. Commission is subject to TDS deductions.</p>
              <p><strong>4. Confidentiality:</strong> All customer data is confidential and must not be shared with unauthorized third parties.</p>
              <p className="pt-4 border-t border-slate-200">
                <strong>DSA Details Verified via eKYC:</strong><br/>
                Name: {kycData?.name}<br/>
                PAN: {formData.panNumber}<br/>
                Aadhaar: **** **** {formData.aadhaarNumber.slice(-4)}<br/>
                Address: {typeof kycData?.address === 'object' && kycData?.address !== null 
                  ? [kycData.address.house, kycData.address.street, kycData.address.vtc].filter(Boolean).join(', ') 
                  : (typeof kycData?.address === 'string' ? kycData.address.split(', ').slice(0, 3).join(', ') : "N/A")
                }...
              </p>
            </div>

            <button 
              onClick={finalizeRegistration}
              disabled={loading}
              className="w-full h-14 bg-secondary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : "I Agree & eSign (OTP Verified)"}
            </button>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500 py-8">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-[2rem] mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary tracking-tight">Registration Complete!</h2>
              <p className="text-slate-500 font-medium mt-2">Your DSA Account is now Active.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl inline-block text-center mt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your DSA Code</p>
              <p className="text-2xl font-black text-primary tracking-widest">{generatedDsaCode || profile?.dsaCode || 'T00---'}</p>
            </div>
            
            <button 
              onClick={() => router.push('/partner')}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 mt-8 shadow-lg shadow-primary/20"
            >
              Go to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
