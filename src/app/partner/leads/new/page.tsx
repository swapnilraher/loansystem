"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { User, Phone, MapPin, Briefcase, IndianRupee, FileText, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"

export default function NewLeadPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    city: "",
    type: "Personal Loan",
    amount: "",
    remarks: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (profile?.dsaStatus && profile.dsaStatus !== "Active") {
      setError("Your account is currently inactive. You cannot submit leads.")
      return
    }
    if (formData.mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const leadData = {
        name: formData.name,
        phone: formData.mobile, // standardizing as 'phone' for CRM
        mobile: formData.mobile,
        city: formData.city,
        type: formData.type,
        amount: formData.amount,
        remarks: formData.remarks,
        status: "New Lead",
        category: "Partner",
        source: "DSA App",
        partnerId: user.uid,
        partnerName: profile?.kycData?.name || profile?.name || "Partner",
        dsaCode: profile?.dsaCode || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, "leads"), leadData)
      setSuccess(true)
      
      // Auto redirect after 2s
      setTimeout(() => {
        router.push("/partner/leads")
      }, 2000)

    } catch (err: any) {
      setError("Failed to submit lead. Please try again.")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-secondary tracking-tight">Lead Submitted!</h2>
        <p className="text-slate-500 font-medium">The internal team has been notified. Redirecting to your leads...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-secondary tracking-tight">Add New Lead</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">Submit customer details to start the processing.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
        
        {/* Name & Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Customer Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input 
                type="text" 
                required
                placeholder="Full Name" 
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mobile Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input 
                type="tel" 
                required
                maxLength={10}
                placeholder="9876543210" 
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none transition-all"
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
              />
            </div>
          </div>
        </div>

        {/* City & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">City</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
              <input 
                type="text" 
                required
                placeholder="E.g. Pune, Mumbai" 
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none transition-all"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Loan Type</label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
              <select 
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none transition-all appearance-none cursor-pointer"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option>Personal Loan</option>
                <option>Home Loan</option>
                <option>Business Loan</option>
                <option>Loan Against Property</option>
                <option>Credit Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Required Loan Amount</label>
          <div className="relative group">
            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
            <input 
              type="number" 
              required
              placeholder="e.g. 500000" 
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none transition-all"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Remarks / Notes</label>
          <div className="relative group">
            <FileText className="absolute left-4 top-4 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
            <textarea 
              placeholder="Any specific requirement or customer background..." 
              className="w-full h-32 pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold text-sm outline-none transition-all resize-none"
              value={formData.remarks}
              onChange={e => setFormData({...formData, remarks: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || (profile?.dsaStatus && profile.dsaStatus !== "Active")}
          className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20 mt-8"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>Submit Lead <ArrowRight size={18} /></>
          )}
        </button>
      </form>
    </div>
  )
}
