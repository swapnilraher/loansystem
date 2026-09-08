"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { authedJson } from "@/lib/authedFetch"
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
      const partnerNameStr = profile?.name || profile?.fullName || "Partner"

      // The duplicate check moved into the route: `/api/leads` matches an existing file
      // on the phone number and updates it instead of creating a second one, which is
      // what the two `getDocs` lookups here used to do — and it can search every lead,
      // where a partner's own query could only ever see their own.
      const response = await authedJson("/api/leads", "POST", {
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
        // Sent, but NOT yet stored: the route writes a fixed set of fields and drops
        // these three, so a partner-sourced lead currently lands without its owner.
        partnerId: user.uid,
        partnerName: partnerNameStr,
        dsaCode: profile?.dsaCode || "",
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to submit customer lead.")
      }

      // A new lead comes back as `id`, an existing file matched on the phone number as
      // `leadId`, and a resubmission inside the route's 15-second window as neither.
      const leadId = payload.id || payload.leadId
      const typed = formData.remarks.trim()
      const remarkNote = payload.leadId
        ? `Partner (${partnerNameStr}) updated lead details: ${typed || "Updated application"}`
        : typed

      if (leadId && remarkNote) {
        // The lead itself is saved by this point, so a rejected remark must not read
        // back to the partner as a failed submission.
        const remarkRes = await authedJson(`/api/leads/${leadId}/remarks`, "POST", {
          remark: { note: remarkNote, type: "Note" },
        }).catch(() => null)
        const remarkPayload = await remarkRes?.json().catch(() => null)
        if (!remarkRes?.ok || !remarkPayload?.success) {
          console.warn("Lead saved, but its opening remark was not:", remarkPayload?.error)
        }
      }

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
