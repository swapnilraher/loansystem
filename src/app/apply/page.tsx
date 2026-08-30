"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  Building2, 
  ShieldCheck, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Award,
  Zap,
  Lock,
  ChevronRight,
  Landmark
} from "lucide-react"

import { AdminButton } from "@/components/admin/ui"
import { formatINR } from "@/lib/hooks/useBanks"
import { cn } from "@/lib/utils"

function ApplyFormContent() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get("ref") || searchParams.get("partner") || searchParams.get("dsa") || ""

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    city: "",
    type: "Personal Loan",
    amount: "500000",
    employmentType: "Salaried",
    monthlyIncome: "",
    remarks: "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerAttribution, setPartnerAttribution] = useState<string | null>(null)

  useEffect(() => {
    if (refCode) {
      setPartnerAttribution(refCode.toUpperCase())
    }
  }, [refCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.mobile.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit mobile number.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/leads/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          mobile: formData.mobile.replace(/\D/g, ""),
          city: formData.city.trim(),
          type: formData.type,
          amount: formData.amount,
          employmentType: formData.employmentType,
          monthlyIncome: formData.monthlyIncome,
          remarks: formData.remarks.trim(),
          refCode: partnerAttribution || refCode,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application. Please try again.")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Something went wrong. Please check your connection and retry.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-admin-surface rounded-admin border border-admin-border p-6 sm:p-8 text-center space-y-5 shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-tone-success-bg text-tone-success-fg border border-tone-success-bd rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-admin-xl font-bold text-admin-text tracking-tight">
              Application Submitted Successfully!
            </h2>
            <p className="text-admin-xs text-admin-muted leading-relaxed">
              Thank you, <strong className="text-admin-text">{formData.name}</strong>. Your loan request of{" "}
              <strong className="text-admin-accent font-mono">{formatINR(Number(formData.amount))}</strong> has been assigned to our senior credit manager.
            </p>
          </div>

          {partnerAttribution && (
            <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border text-admin-2xs text-admin-muted">
              Referred by Verified DSA Partner: <strong className="text-admin-accent font-mono">{partnerAttribution}</strong>
            </div>
          )}

          <div className="pt-3 border-t border-admin-border/60 text-admin-2xs text-admin-muted space-y-1">
            <p>• Fast approval decision within 24–48 hours</p>
            <p>• Lowest interest rates from 50+ RBI registered banks &amp; NBFCs</p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-admin bg-admin-surface-2 border border-admin-border text-admin-text font-bold text-admin-xs hover:bg-admin-surface-hover transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-admin-bg py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* ── Brand Header & Attribution Banner ── */}
        <div className="text-center space-y-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-admin-accent-soft text-admin-accent border border-admin-accent/20 text-admin-2xs font-extrabold uppercase tracking-wide shadow-2xs">
            <Building2 size={13} />
            <span>Techstar Money Solutions • Instant Digital Lending</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-admin-text">
            Apply for Fast Loan Approval
          </h1>
          <p className="text-admin-xs text-admin-muted max-w-lg mx-auto">
            Get instant approvals from 50+ leading partner banks with competitive interest rates and zero hidden charges.
          </p>

          {/* Partner Referral Badge if ?ref= is present */}
          {partnerAttribution && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-admin bg-tone-success-bg text-tone-success-fg border border-tone-success-bd text-admin-xs font-bold shadow-2xs mt-2">
              <ShieldCheck size={16} />
              <span>Referred by Certified DSA Partner Code: <strong className="font-mono">{partnerAttribution}</strong></span>
            </div>
          )}
        </div>

        {/* ── Main Application Card ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-admin-surface rounded-admin border border-admin-border p-5 sm:p-8 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-admin-border">
            <h3 className="text-admin-sm font-bold text-admin-text">Applicant Details</h3>
            <span className="text-admin-2xs text-admin-muted font-medium flex items-center gap-1">
              <Lock size={12} className="text-tone-success-fg" /> 256-bit Encrypted
            </span>
          </div>

          {error && (
            <div className="p-3 bg-tone-danger-bg text-tone-danger-fg text-admin-xs font-semibold rounded-admin border border-tone-danger-bd">
              {error}
            </div>
          )}

          {/* Full Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Full Name (As on PAN) <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent transition-colors"
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
                  className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:outline-none focus:border-admin-accent transition-colors admin-num"
                />
              </div>
            </div>
          </div>

          {/* City & Loan Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Current City / Location <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune, Mumbai, Bengaluru"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Select Loan Product <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none" />
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent transition-colors cursor-pointer"
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

          {/* Loan Amount & Monthly Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  step={10000}
                  placeholder="500000"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:outline-none focus:border-admin-accent transition-colors admin-num"
                />
              </div>
              {formData.amount && Number(formData.amount) > 0 && (
                <p className="text-admin-2xs text-admin-accent font-semibold pl-1">
                  Amount: {formatINR(Number(formData.amount))}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Employment Type <span className="text-tone-danger-fg">*</span>
              </label>
              <select
                value={formData.employmentType}
                onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent transition-colors cursor-pointer"
              >
                <option value="Salaried">Salaried (Private / Govt)</option>
                <option value="Self-Employed Professional">Self-Employed Professional (Doctor, CA, Architect)</option>
                <option value="Self-Employed Business">Self-Employed Business / Proprietor</option>
                <option value="Director / Partner">Company Director / Partner</option>
              </select>
            </div>
          </div>

          {/* Monthly Income / Turnover */}
          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              Net Monthly Income / Salary (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={formData.monthlyIncome}
              onChange={e => setFormData({ ...formData, monthlyIncome: e.target.value })}
              className="w-full px-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:outline-none focus:border-admin-accent transition-colors admin-num"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              Remarks / Specific Bank Preference (Optional)
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-admin-muted" />
              <textarea
                rows={2}
                placeholder="Any existing loans, balance transfer requirement, or bank preference..."
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs text-admin-text focus:outline-none focus:border-admin-accent transition-colors resize-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <AdminButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            className="w-full justify-center text-admin-xs font-bold mt-3"
          >
            Submit Loan Application for Fast Approval
          </AdminButton>

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-admin-border text-center text-admin-2xs text-admin-muted">
            <div className="p-2 bg-admin-surface-2 rounded-admin">
              <Clock size={14} className="mx-auto mb-1 text-admin-accent" />
              <span className="font-bold text-admin-text block">24–48 Hours</span>
              <span>Express Disbursal</span>
            </div>
            <div className="p-2 bg-admin-surface-2 rounded-admin">
              <Landmark size={14} className="mx-auto mb-1 text-tone-success-fg" />
              <span className="font-bold text-admin-text block">50+ Banks</span>
              <span>HDFC, ICICI, SBI, Axis</span>
            </div>
            <div className="p-2 bg-admin-surface-2 rounded-admin">
              <ShieldCheck size={14} className="mx-auto mb-1 text-tone-violet-fg" />
              <span className="font-bold text-admin-text block">Zero Advance</span>
              <span>100% Transparent</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-admin-bg flex items-center justify-center text-admin-xs text-admin-muted">Loading Application Portal...</div>}>
      <ApplyFormContent />
    </Suspense>
  )
}
