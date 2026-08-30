"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { 
  ShieldCheck, 
  CreditCard, 
  Wallet, 
  Plus, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Activity, 
  TrendingUp, 
  Clock, 
  FileText, 
  ExternalLink,
  Zap,
  Sparkles,
  ChevronRight,
  Lock,
  Info
} from "lucide-react"

import { 
  AdminButton, 
  AdminLinkButton, 
  PageHeader, 
  StatusBadge, 
  EmptyState, 
  StatCard 
} from "@/components/admin/ui"
import WalletTopUpModal from "@/components/partner/WalletTopUpModal"
import { formatINR, toAmount } from "@/lib/hooks/useBanks"
import { timeAgo, toDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

export default function PartnerCreditCheckPage() {
  const { user, profile } = useAuth()
  
  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState<number>(Number(profile?.walletBalance) || 0)
  const [topUpModalOpen, setTopUpModalOpen] = useState(false)

  // Check Settings
  const [checkType, setCheckType] = useState<"SCORE" | "REPORT">("SCORE")
  const [bureau, setBureau] = useState<"CIBIL" | "EXPERIAN">("CIBIL")

  // Customer Input Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    customerMobile: "",
    customerPan: "",
    customerDob: "",
    customerGender: "Male",
    customerPincode: "",
    customerConsent: false, // Mandatory Checkbox
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<any | null>(null)
  const [pastReports, setPastReports] = useState<any[]>([])

  const currentPrice = checkType === "SCORE" ? 50 : 149

  // Sync wallet balance & past credit reports from Firestore
  useEffect(() => {
    if (!user) return

    if (profile?.walletBalance !== undefined) {
      setWalletBalance(Number(profile.walletBalance) || 0)
    }

    const qReports = query(
      collection(db, "credit_reports"),
      where("partnerId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(qReports, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0
        const tB = b.createdAt?.toMillis?.() || 0
        return tB - tA
      })
      setPastReports(docs)
    }, (err) => {
      console.warn("Credit reports fetch note:", err)
    })

    return () => unsubscribe()
  }, [user, profile])

  const handlePerformCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName.trim()) {
      setError("Please enter customer First Name.")
      return
    }
    if (!formData.lastName.trim()) {
      setError("Please enter customer Last Name.")
      return
    }
    if (!formData.customerDob) {
      setError("Please enter customer Date of Birth (DOB).")
      return
    }
    if (formData.customerPan.trim().length !== 10) {
      setError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).")
      return
    }
    if (formData.customerMobile.length !== 10) {
      setError("Please enter a valid 10-digit customer mobile number.")
      return
    }
    if (!formData.customerConsent) {
      setError("You must tick the Customer Consent confirmation box to proceed under CICRA regulations.")
      return
    }

    if (walletBalance < currentPrice) {
      setError(`Insufficient prepaid wallet balance. Required: ₹${currentPrice}, Available: ₹${walletBalance}.`)
      setTopUpModalOpen(true)
      return
    }

    setLoading(true)
    setActiveReport(null)

    try {
      const res = await fetch("/api/partner/credit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: user?.uid,
          partnerMobile: profile?.mobileNumber,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          customerName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          customerMobile: formData.customerMobile.trim(),
          customerPan: formData.customerPan.trim().toUpperCase(),
          customerDob: formData.customerDob,
          customerGender: formData.customerGender,
          customerPincode: formData.customerPincode.trim(),
          customerConsent: formData.customerConsent,
          checkType,
          bureau,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.insufficientBalance) {
          setTopUpModalOpen(true)
        }
        throw new Error(data.error || "Credit check failed. Please check customer details.")
      }

      setActiveReport(data.report)
      setWalletBalance(data.newBalance)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to execute credit bureau inquiry.")
    } finally {
      setLoading(false)
    }
  }

  const partnerDisplayName = profile?.name || profile?.fullName || "Partner"

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header with Live Wallet Chip & Top-up ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
              Customer Credit Bureau Check
            </h1>
            <span className="px-2 py-0.5 rounded-full text-admin-2xs font-extrabold uppercase tracking-wide bg-admin-accent-soft text-admin-accent border border-admin-accent/20">
              CICRA Compliant
            </span>
          </div>
          <p className="text-admin-xs text-admin-muted mt-0.5">
            Instant credit score inquiries and comprehensive risk reports via TransUnion CIBIL and Experian.
          </p>
        </div>

        {/* Live Wallet Balance Pill */}
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-admin bg-admin-surface border border-admin-border flex items-center gap-2 shadow-2xs">
            <Wallet size={16} className="text-admin-accent shrink-0" />
            <div className="text-left">
              <p className="text-admin-2xs text-admin-muted uppercase font-bold leading-none">Prepaid Utility Balance</p>
              <p className="text-admin-sm font-bold font-mono text-admin-text admin-num mt-0.5">
                {formatINR(walletBalance)}
              </p>
            </div>
          </div>

          <AdminButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setTopUpModalOpen(true)}
          >
            Top Up Wallet
          </AdminButton>
        </div>
      </div>

      {/* ── Non-Transferable Balance Protection Banner ── */}
      <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border flex items-start gap-2.5 text-admin-xs text-admin-muted">
        <Lock size={15} className="text-admin-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-admin-text">Prepaid Utility Protection:</strong> Funds added to the partner wallet are dedicated strictly for credit bureau inquiries and cannot be transferred/withdrawn to personal bank accounts. Sourcing commission earnings are separate and settled to your bank automatically.
        </p>
      </div>

      {/* ── Check Tier Selection (2 Options: ₹50 vs ₹149) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Quick Score Check */}
        <button
          type="button"
          onClick={() => setCheckType("SCORE")}
          className={cn(
            "p-4 rounded-admin border text-left transition-all relative overflow-hidden flex flex-col justify-between",
            checkType === "SCORE"
              ? "bg-admin-surface border-admin-accent ring-2 ring-admin-accent/20 shadow-sm"
              : "bg-admin-surface-2 border-admin-border text-admin-muted hover:border-admin-border-focus"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className={checkType === "SCORE" ? "text-admin-accent" : "text-admin-muted"} />
                <h3 className="font-bold text-admin-sm text-admin-text">
                  Quick Credit Score
                </h3>
              </div>
              <p className="text-admin-2xs text-admin-muted leading-relaxed">
                Fetches official 3-digit score (300-900), risk band, active loan counts, and payment track.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-admin-lg font-bold font-mono text-admin-accent admin-num">
                ₹50
              </span>
              <p className="text-admin-2xs text-admin-muted">per inquiry</p>
            </div>
          </div>
        </button>

        {/* Option 2: Comprehensive Report */}
        <button
          type="button"
          onClick={() => setCheckType("REPORT")}
          className={cn(
            "p-4 rounded-admin border text-left transition-all relative overflow-hidden flex flex-col justify-between",
            checkType === "REPORT"
              ? "bg-admin-surface border-admin-accent ring-2 ring-admin-accent/20 shadow-sm"
              : "bg-admin-surface-2 border-admin-border text-admin-muted hover:border-admin-border-focus"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText size={18} className={checkType === "REPORT" ? "text-tone-violet-fg" : "text-admin-muted"} />
                <h3 className="font-bold text-admin-sm text-admin-text">
                  Comprehensive Credit Report
                </h3>
              </div>
              <p className="text-admin-2xs text-admin-muted leading-relaxed">
                Full 360° credit report with DPD payment track, account-wise breakdown, credit utilization, and inquiries.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-admin-lg font-bold font-mono text-tone-violet-fg admin-num">
                ₹149
              </span>
              <p className="text-admin-2xs text-admin-muted">per full report</p>
            </div>
          </div>
        </button>
      </div>

      {/* ── Main Workspace: Inquiry Form & Live Report Output ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Customer Details (5 Cols) */}
        <form
          onSubmit={handlePerformCheck}
          className="lg:col-span-5 bg-admin-surface rounded-admin border border-admin-border p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-admin-border">
            <h3 className="text-admin-sm font-bold text-admin-text">Customer Details &amp; Consent</h3>
            <span className="text-admin-2xs font-mono font-bold text-admin-accent admin-num">
              Fee: ₹{currentPrice}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-tone-danger-bg text-tone-danger-fg text-admin-xs font-semibold rounded-admin border border-tone-danger-bd flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bureau Provider Switcher */}
          <div className="space-y-1.5">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              Select Bureau Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBureau("CIBIL")}
                className={cn(
                  "py-2 px-3 rounded-admin text-admin-xs font-bold border transition-all text-center",
                  bureau === "CIBIL"
                    ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                    : "bg-admin-surface-2 border-admin-border text-admin-text hover:bg-admin-surface-hover"
                )}
              >
                TransUnion CIBIL
              </button>
              <button
                type="button"
                onClick={() => setBureau("EXPERIAN")}
                className={cn(
                  "py-2 px-3 rounded-admin text-admin-xs font-bold border transition-all text-center",
                  bureau === "EXPERIAN"
                    ? "bg-tone-violet-fg text-white border-tone-violet-fg shadow-xs"
                    : "bg-admin-surface-2 border-admin-border text-admin-text hover:bg-admin-surface-hover"
                )}
              >
                Experian Bureau
              </button>
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                First Name <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Last Name <span className="text-tone-danger-fg">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sharma"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Date of Birth (DOB) <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none" />
                <input
                  type="date"
                  required
                  value={formData.customerDob}
                  onChange={e => setFormData({ ...formData, customerDob: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-medium text-admin-text focus:outline-none focus:border-admin-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Gender <span className="text-tone-danger-fg">*</span>
              </label>
              <select
                value={formData.customerGender}
                onChange={e => setFormData({ ...formData, customerGender: e.target.value })}
                className="w-full px-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-semibold text-admin-text focus:outline-none focus:border-admin-accent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Transgender</option>
              </select>
            </div>
          </div>

          {/* PAN & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                PAN Number <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formData.customerPan}
                  onChange={e => setFormData({ ...formData, customerPan: e.target.value.toUpperCase() })}
                  className="w-full pl-9 pr-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text uppercase focus:outline-none focus:border-admin-accent admin-num"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Mobile Number <span className="text-tone-danger-fg">*</span>
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.customerMobile}
                  onChange={e => setFormData({ ...formData, customerMobile: e.target.value.replace(/\D/g, "") })}
                  className="w-full pl-9 pr-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:outline-none focus:border-admin-accent admin-num"
                />
              </div>
            </div>
          </div>

          {/* PIN Code */}
          <div className="space-y-1">
            <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
              PIN Code (Optional)
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 411001"
                value={formData.customerPincode}
                onChange={e => setFormData({ ...formData, customerPincode: e.target.value.replace(/\D/g, "") })}
                className="w-full pl-9 pr-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:outline-none focus:border-admin-accent admin-num"
              />
            </div>
          </div>

          {/* ── MANDATORY CUSTOMER CONSENT TICK BOX ── */}
          <div className="p-3.5 bg-admin-surface-2/80 rounded-admin border border-admin-border space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={formData.customerConsent}
                onChange={e => setFormData({ ...formData, customerConsent: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-admin-border text-admin-accent focus:ring-admin-accent shrink-0 cursor-pointer"
              />
              <span className="text-admin-2xs text-admin-text font-medium leading-relaxed">
                <strong className="text-admin-accent font-bold">Customer Consent Declaration:</strong> I hereby declare that I have received explicit authorization &amp; consent from the applicant ({formData.firstName || "Customer"} {formData.lastName}) to fetch their credit information report from {bureau === "CIBIL" ? "TransUnion CIBIL" : "Experian"} as per CICRA Act 2005.
              </span>
            </label>
          </div>

          {/* Action Button */}
          <AdminButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={!formData.customerConsent || loading}
            loading={loading}
            icon={Zap}
            className="w-full justify-center text-admin-xs font-bold mt-2"
          >
            Pull {bureau === "CIBIL" ? "TransUnion CIBIL" : "Experian"} ({formatINR(currentPrice)})
          </AdminButton>

          <p className="text-admin-2xs text-admin-muted text-center leading-relaxed">
            Fee of ₹{currentPrice} will be deducted from your prepaid balance upon verification.
          </p>
        </form>

        {/* Right Section: Active Report Output / Placeholder (7 Cols) */}
        <div className="lg:col-span-7 bg-admin-surface rounded-admin border border-admin-border p-5 sm:p-6 shadow-sm min-h-[420px] flex flex-col justify-center">
          {activeReport ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-admin-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-admin-sm text-admin-text">
                      {activeReport.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-admin-2xs font-bold uppercase bg-tone-success-bg text-tone-success-fg border border-tone-success-bd">
                      {activeReport.bureau} Verified
                    </span>
                  </div>
                  <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                    PAN: {activeReport.customerPan} • DOB: {activeReport.customerDob || "—"} • Mobile: {activeReport.customerMobile}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-admin-2xs text-admin-muted">Inquiry Timestamp:</span>
                  <p className="text-admin-xs font-bold font-mono text-admin-text admin-num">
                    {new Date(activeReport.reportDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Central Score Card */}
              <div className="p-6 rounded-admin bg-gradient-to-br from-admin-surface-2 via-admin-surface to-admin-surface-2 border border-admin-border text-center space-y-2 relative overflow-hidden">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-tone-success-bd bg-tone-success-bg/30 text-center shadow-inner">
                  <div>
                    <span className="text-3xl font-extrabold font-mono text-tone-success-fg admin-num">
                      {activeReport.score}
                    </span>
                    <p className="text-admin-2xs uppercase font-bold text-tone-success-fg tracking-wider">
                      {activeReport.riskBand}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-admin-xs pt-2">
                  <span className="text-admin-muted">Score Range: <strong>300 - 900</strong></span>
                  <span>•</span>
                  <span className="text-tone-success-fg font-bold">Lender Approval Probability: High</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-admin-xs">
                <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border">
                  <span className="text-admin-2xs text-admin-muted uppercase font-bold">Active Accounts</span>
                  <p className="text-admin-base font-bold font-mono text-admin-text admin-num mt-0.5">
                    {activeReport.activeLoans} Loans, {activeReport.creditCards} Cards
                  </p>
                </div>

                <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border">
                  <span className="text-admin-2xs text-admin-muted uppercase font-bold">On-time Payments</span>
                  <p className="text-admin-base font-bold font-mono text-tone-success-fg admin-num mt-0.5">
                    {activeReport.onTimePaymentRate}%
                  </p>
                </div>

                <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border">
                  <span className="text-admin-2xs text-admin-muted uppercase font-bold">Credit Utilization</span>
                  <p className="text-admin-base font-bold font-mono text-admin-text admin-num mt-0.5">
                    {activeReport.creditUtilization}%
                  </p>
                </div>

                <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border">
                  <span className="text-admin-2xs text-admin-muted uppercase font-bold">Recent Enquiries</span>
                  <p className="text-admin-base font-bold font-mono text-admin-text admin-num mt-0.5">
                    {activeReport.recentInquiries} in last 90d
                  </p>
                </div>

                <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border sm:col-span-2">
                  <span className="text-admin-2xs text-admin-muted uppercase font-bold">DPD Payment Track</span>
                  <p className="text-admin-xs font-bold text-admin-text mt-0.5 truncate">
                    {activeReport.dpdSummary}
                  </p>
                </div>
              </div>

              {/* Consent & Audit Trail Footer */}
              <div className="p-3 bg-admin-surface-2/60 rounded-admin border border-admin-border text-admin-2xs text-admin-muted flex items-center justify-between">
                <span>Consent Logged: <code className="font-mono text-admin-accent">{activeReport.consentIp || "127.0.0.1"}</code></span>
                <span>Ref: <code className="font-mono text-admin-accent">{activeReport.id.slice(0, 8)}</code></span>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-admin-border">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() => window.print()}
                >
                  Print / Download Bureau File
                </AdminButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-admin bg-admin-surface-2 border border-admin-border text-admin-muted flex items-center justify-center mx-auto">
                <CreditCard size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-admin-sm text-admin-text">
                  Live Bureau Inquirer Ready
                </h4>
                <p className="text-admin-xs text-admin-muted max-w-sm mx-auto leading-relaxed">
                  Enter First Name, Last Name, DOB, PAN, Mobile number and check the customer consent box to run TransUnion CIBIL or Experian inquiries.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Past Customer Credit Checks Ledger ── */}
      <div className="rounded-admin border border-admin-border bg-admin-surface shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-admin-border flex items-center justify-between bg-admin-surface-2/40">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-admin-accent" />
            <h3 className="text-admin-sm font-bold text-admin-text">Past Credit Inquiries</h3>
            <span className="px-2 py-0.5 rounded-full text-admin-2xs font-bold bg-admin-surface-2 text-admin-muted border border-admin-border">
              {pastReports.length}
            </span>
          </div>
        </div>

        {pastReports.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              title="No Credit Checks Executed Yet"
              description="When you run credit score or comprehensive bureau inquiries for your loan applicants, they will be archived here."
            />
          </div>
        ) : (
          <div className="divide-y divide-admin-border">
            {pastReports.map(rep => (
              <div
                key={rep.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-admin-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-admin bg-tone-success-bg text-tone-success-fg border border-tone-success-bd flex items-center justify-center font-bold font-mono text-admin-sm shrink-0 admin-num">
                    {rep.score || "—"}
                  </div>
                  <div>
                    <p className="font-bold text-admin-sm text-admin-text">
                      {rep.customerName || `${rep.firstName || ""} ${rep.lastName || ""}`}
                    </p>
                    <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                      PAN: {rep.customerPan} • DOB: {rep.customerDob || "—"} • {rep.bureau} ({rep.checkType === "REPORT" ? "Report" : "Score"})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="text-left sm:text-right">
                    <span className="text-admin-2xs text-admin-muted font-mono admin-num">
                      {rep.createdAt ? timeAgo(rep.createdAt) : "Recently"}
                    </span>
                    <p className="text-admin-2xs font-bold text-tone-success-fg">
                      {rep.riskBand}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveReport(rep)}
                    className="p-1.5 rounded-admin bg-admin-surface-2 text-admin-text hover:bg-admin-surface-hover transition-colors border border-admin-border"
                    title="View Report"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Razorpay Wallet Top-up Modal ── */}
      <WalletTopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        partnerId={user?.uid || ""}
        partnerMobile={profile?.mobileNumber || ""}
        partnerEmail={profile?.email || user?.email || ""}
        partnerName={partnerDisplayName}
        onSuccess={(newBal) => {
          setWalletBalance(newBal)
        }}
      />
    </div>
  )
}
