"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { UserCircle, Building2, Smartphone, ShieldCheck, CreditCard, Banknote, Loader2, CheckCircle2 } from "lucide-react"

export default function PartnerProfile() {
  const { user, profile } = useAuth()
  
  const [bankData, setBankData] = useState({
    accountNumber: "",
    ifsc: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [savedBank, setSavedBank] = useState<any>(null)

  useEffect(() => {
    if (user && profile?.bankDetails) {
      setSavedBank(profile.bankDetails)
    }
  }, [user, profile])

  const verifyAndSaveBank = async () => {
    if (!bankData.accountNumber || !bankData.ifsc) {
      setError("Please enter both Account Number and IFSC Code")
      return
    }
    
    setLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({
          action: "verify-bank",
          payload: { 
            account_number: bankData.accountNumber,
            ifsc: bankData.ifsc 
          }
        })
      })
      
      const data = await res.json()
      console.log("Bank Verify Response:", data)
      
      const isSuccess = data?.code === 200 || data?.status === 'success' || data?.data?.account_exists;
      
      if (isSuccess && data?.data) {
        // Name matching can be optional, we just store what the bank returns
        const rawBankDetails = {
          accountNumber: bankData.accountNumber,
          ifsc: bankData.ifsc,
          bankName: data.data.bank_name || "Verified Bank",
          nameAtBank: data.data.name_at_bank || data.data.registered_name || data.data.full_name || "Account Holder",
          verifiedAt: new Date().toISOString()
        }

        const bankDetails = JSON.parse(JSON.stringify(rawBankDetails));

        // Save to Firebase
        if (user) {
          const userRef = doc(db, "users", user.uid)
          await updateDoc(userRef, { bankDetails })
          setSavedBank(bankDetails)
          setSuccessMsg("Bank Account verified and saved successfully!")
        }
      } else {
        setError(data?.message || "Invalid Bank Details or Verification Failed")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to verify bank details")
    }
    setLoading(false)
  }

  if (!profile) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">My Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your DSA account and payout settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <UserCircle size={120} />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <UserCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-secondary">{profile.kycData?.name || "Partner"}</h2>
              <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
                DSA Code: <span className="text-primary">{profile.dsaCode}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 relative z-10">
            <div className="flex items-center gap-3">
              <Smartphone className="text-slate-400" size={20} />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Number</p>
                <p className="font-bold text-secondary">{profile.mobileNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="text-slate-400" size={20} />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Business Type</p>
                <p className="font-bold text-secondary">{profile.businessType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="text-slate-400" size={20} />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PAN Number</p>
                <p className="font-bold text-secondary uppercase tracking-widest">{profile.panData?.panNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold w-max border border-emerald-100">
              <ShieldCheck size={16} /> KYC Verified
            </div>
          </div>
        </div>

        {/* Bank Account Verification */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Banknote size={120} />
          </div>
          
          <h2 className="text-xl font-black text-secondary flex items-center gap-2 relative z-10">
            <Banknote className="text-primary" /> Payout Bank Account
          </h2>

          {savedBank ? (
            <div className="space-y-4 relative z-10">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-3">
                  <CheckCircle2 size={18} /> Verified Bank Details
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Name at Bank</p>
                    <p className="font-bold text-secondary text-sm">{savedBank.nameAtBank}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Bank Name & IFSC</p>
                    <p className="font-bold text-secondary text-sm">{savedBank.bankName} ({savedBank.ifsc})</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Account Number</p>
                    <p className="font-bold text-secondary text-sm tracking-widest">XXXXX{savedBank.accountNumber?.slice(-4)}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSavedBank(null)}
                className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
              >
                Change Bank Account
              </button>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              <p className="text-xs font-medium text-slate-500">
                Add your bank account to receive your monthly commissions automatically. We will instantly verify the account by depositing ₹1 (Penny Drop).
              </p>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                  {error}
                </div>
              )}
              
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100">
                  {successMsg}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Account Number</label>
                <input 
                  type="text"
                  placeholder="Enter Bank Account Number"
                  className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none"
                  value={bankData.accountNumber}
                  onChange={e => setBankData({...bankData, accountNumber: e.target.value.replace(/\D/g, '')})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">IFSC Code</label>
                <input 
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none uppercase"
                  value={bankData.ifsc}
                  onChange={e => setBankData({...bankData, ifsc: e.target.value.toUpperCase()})}
                />
              </div>

              <button 
                onClick={verifyAndSaveBank}
                disabled={loading}
                className="w-full h-12 bg-primary text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify via Penny Drop"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
