"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  ChevronLeft,
  ShieldAlert,
  Sparkles
} from "lucide-react"
import Link from "next/link"

import { AdminButton, AdminLinkButton } from "@/components/admin/ui"
import { formatINR } from "@/lib/hooks/useBanks"
import { cn } from "@/lib/utils"

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
    if (formData.mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const cleanMobile = formData.mobile.replace(/\D/g, "")
      const phone10 = cleanMobile.length === 12 && cleanMobile.startsWith("91") ? cleanMobile.slice(2) : cleanMobile

      // Check if lead with this mobile number already exists in CRM
      if (phone10) {
        const qPhone = query(collection(db, "leads"), where("phone", "==", phone10))
        const snap = await getDocs(qPhone)
        let existingDoc = !snap.empty ? snap.docs[0] : null
        
        if (!existingDoc) {
          const qMobile = query(collection(db, "leads"), where("mobile", "==", phone10))
          const snapMobile = await getDocs(qMobile)
          if (!snapMobile.empty) existingDoc = snapMobile.docs[0]
        }

        if (existingDoc) {
          const existingData = existingDoc.data()
          const partnerNameStr = profile?.name || profile?.fullName || "Partner"
          const remarkNote = `Partner (${partnerNameStr}) updated lead details: ${formData.remarks?.trim() || "Updated application"}`
          
          await updateDoc(doc(db, "leads", existingDoc.id), {
            updatedAt: serverTimestamp(),
            amount: formData.amount || existingData.amount,
            type: formData.type || existingData.type,
            city: formData.city || existingData.city,
            lastActivityNote: remarkNote,
            lastActivityType: "Note",
            lastActivityUser: partnerNameStr,
            lastActivityTime: serverTimestamp(),
            lastNote: remarkNote,
            lastNoteUser: partnerNameStr,
            lastNoteTime: serverTimestamp()
          })

          await addDoc(collection(db, `leads/${existingDoc.id}/remarks`), {
            note: remarkNote,
            type: "Note",
            addedBy: user.uid,
            createdAt: serverTimestamp()
          })

          setSuccess(true)
          setTimeout(() => {
            router.push("/partner/leads")
          }, 1800)
          setLoading(false)
          return
        }
      }

      const leadData = {
        name: formData.name.trim(),
        phone: formData.mobile.trim(),
        mobile: formData.mobile.trim(),
        city: formData.city.trim(),
        type: formData.type,
        amount: formData.amount,
        remarks: formData.remarks.trim(),
        status: "New Lead",
        category: "Partner",
        source: "DSA Partner Portal",
        partnerId: user.uid,
        partnerName: profile?.name || profile?.fullName || "Partner",
        dsaCode: profile?.dsaCode || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, "leads"), leadData)
      setSuccess(true)
      
      setTimeout(() => {
        router.push("/partner/leads")
      }, 1800)

    } catch (err) {
      console.error(err)
      setError("Failed to submit customer lead. Please check details and retry.")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300 p-4">
        <div className="w-16 h-16 bg-tone-success-bg text-tone-success-fg border border-tone-success-bd rounded-full flex items-center justify-center shadow-sm">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-admin-lg font-bold text-admin-text tracking-tight">
            Customer Lead Submitted!
          </h2>
          <p className="text-admin-xs text-admin-muted max-w-sm">
            Lead has been sent to underwriting. Redirecting to your active leads dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pb-4 border-b border-admin-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Link
              href="/partner/leads"
              className="p-1 rounded-admin bg-admin-surface-2 text-admin-muted hover:text-admin-text transition-colors border border-admin-border"
            >
              <ChevronLeft size={16} />
            </Link>
            <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
              Submit New Customer Lead
            </h1>
          </div>
          <p className="text-admin-xs text-admin-muted pl-7">
            Directly intake applicant details into Techstar Money banking desk.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-tone-danger-bg text-tone-danger-fg rounded-admin text-admin-xs font-semibold border border-tone-danger-bd flex items-center gap-2">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Form Card ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-admin-surface rounded-admin border border-admin-border shadow-sm p-5 sm:p-7 space-y-5"
      >
        {/* Name & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              Customer Full Name <span className="text-tone-danger-fg">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Sharma"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              10-Digit Mobile Number <span className="text-tone-danger-fg">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent transition-colors admin-num"
              />
            </div>
          </div>
        </div>

        {/* City & Loan Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              City / Location <span className="text-tone-danger-fg">*</span>
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                type="text"
                required
                placeholder="e.g. Pune, Mumbai, Bengaluru"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              Loan Product <span className="text-tone-danger-fg">*</span>
            </label>
            <div className="relative">
              <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none" />
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="Personal Loan">Personal Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Loan Against Property">Loan Against Property (LAP)</option>
                <option value="Gold Loan">Gold Loan</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Required Loan Amount */}
        <div className="space-y-1.5">
          <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
            Required Loan Amount (₹) <span className="text-tone-danger-fg">*</span>
          </label>
          <div className="relative">
            <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
            <input
              type="number"
              required
              min={10000}
              placeholder="e.g. 500000"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent transition-colors admin-num"
            />
          </div>
          {formData.amount && Number(formData.amount) > 0 && (
            <p className="text-admin-2xs text-admin-accent font-semibold pl-1">
              Formatted: {formatINR(Number(formData.amount))}
            </p>
          )}
        </div>

        {/* Remarks / Customer Background */}
        <div className="space-y-1.5">
          <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
            Remarks &amp; Underwriting Notes
          </label>
          <div className="relative">
            <FileText size={15} className="absolute left-3 top-3 text-admin-muted" />
            <textarea
              rows={3}
              placeholder="Enter customer employment (Salaried/Self-Employed), monthly income, or specific bank preference..."
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent transition-colors resize-none"
            />
          </div>
        </div>

        <AdminButton
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={ArrowRight}
          className="w-full justify-center text-admin-xs font-bold mt-2"
        >
          Submit Customer Lead to Banking Desk
        </AdminButton>
      </form>
    </div>
  )
}
