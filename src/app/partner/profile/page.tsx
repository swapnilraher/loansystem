"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { 
  UserCircle, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Mail, 
  Calendar, 
  MapPin, 
  FileText, 
  ExternalLink,
  Landmark,
  ShieldAlert,
  Award,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

import { 
  AdminButton, 
  AdminLinkButton, 
  PageHeader, 
  StatusBadge, 
  toneForStatus 
} from "@/components/admin/ui"
import { cn } from "@/lib/utils"

export default function PartnerProfile() {
  const { user, profile } = useAuth()
  
  const [bankData, setBankData] = useState({
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [savedBank, setSavedBank] = useState<any>(null)
  const [isEditingBank, setIsEditingBank] = useState(false)

  useEffect(() => {
    if (user && profile?.bankDetails) {
      setSavedBank(profile.bankDetails)
    }
  }, [user, profile])

  const verifyAndSaveBank = async () => {
    if (!bankData.accountNumber || !bankData.ifsc) {
      setError("Please enter both Account Number and IFSC Code.")
      return
    }
    if (bankData.accountNumber !== bankData.confirmAccountNumber) {
      setError("Account Number and Confirmation do not match.")
      return
    }
    
    setLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-bank",
          payload: { 
            account_number: bankData.accountNumber.trim(),
            ifsc: bankData.ifsc.trim().toUpperCase() 
          }
        })
      })
      
      const data = await res.json()
      console.log("Bank Verify Response:", data)
      
      const isSuccess = data?.code === 200 || data?.status === "success" || data?.data?.account_exists
      
      if (isSuccess && data?.data) {
        const verifiedName = data.data.name_at_bank || data.data.registered_name || data.data.full_name || "Account Holder"
        const bankName = data.data.bank_name || "Verified Bank"

        const bankDetails = {
          accountNumber: bankData.accountNumber.trim(),
          ifsc: bankData.ifsc.trim().toUpperCase(),
          bankName: bankName,
          nameAtBank: verifiedName,
          accountHolderName: verifiedName,
          verified: true,
          verifiedAt: new Date().toISOString()
        }

        if (user) {
          const userRef = doc(db, "users", user.uid)
          await updateDoc(userRef, { bankDetails })
          setSavedBank(bankDetails)
          setIsEditingBank(false)
          setSuccessMsg("✓ Bank Account verified and updated successfully via Penny Drop!")
        }
      } else {
        setError(data?.message || data?.error || "Invalid Bank Details or Verification Failed")
      }
    } catch (err: any) {
      console.error(err)
      setError("Failed to verify bank account. Please check Account and IFSC Code.")
    }
    setLoading(false)
  }

  const dsaCode = profile?.dsaCode || "PENDING"
  const partnerName = profile?.name || profile?.fullName || profile?.contactPersonName || user?.displayName || "Partner"
  const partnerEmail = profile?.email || user?.email || "—"
  const partnerMobile = profile?.mobileNumber || "—"
  const partnerAddress = profile?.addressLine1 
    ? `${profile.addressLine1}${profile.addressLine2 ? `, ${profile.addressLine2}` : ""}, ${profile.city || ""}, ${profile.stateName || ""} - ${profile.pinCode || ""}`
    : typeof profile?.kycData?.address === "object" && profile?.kycData?.address !== null
      ? [profile.kycData.address.house, profile.kycData.address.street, profile.kycData.address.district, profile.kycData.address.state, profile.kycData.address.pincode].filter(Boolean).join(", ")
      : profile?.kycData?.address || "Registered Office Address"

  const isApproved = profile?.dsaStatus === "Active" || profile?.dsaStatus === "approved"

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
              DSA Partner Profile &amp; Settings
            </h1>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-admin-2xs font-extrabold uppercase tracking-wider border",
              isApproved 
                ? "bg-tone-success-bg text-tone-success-fg border-tone-success-bd"
                : "bg-tone-warn-bg text-tone-warn-fg border-tone-warn-bd"
            )}>
              {isApproved ? "● Verified DSA" : "● Under Verification"}
            </span>
          </div>
          <p className="text-admin-xs text-admin-muted">
            Manage your partner identity, compliance documents, and bank payout details.
          </p>
        </div>

        {profile?.mobileNumber && (
          <a
            href={`/api/partner/agreement/pdf?mobile=${profile.mobileNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-admin bg-admin-surface border border-admin-border text-admin-text text-admin-xs font-bold hover:bg-admin-surface-hover transition-colors shadow-2xs shrink-0"
          >
            <FileText size={14} className="text-admin-accent" />
            <span>Download Signed MOU PDF</span>
            <ExternalLink size={12} className="text-admin-muted" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Identity & Firm Details (7 Cols) ── */}
        <div className="lg:col-span-7 bg-admin-surface rounded-admin border border-admin-border p-5 sm:p-6 shadow-sm space-y-6">
          {/* Identity Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-admin-border">
            <div className="w-14 h-14 rounded-admin bg-admin-surface-2 border border-admin-border flex items-center justify-center font-black text-admin-accent text-admin-lg shrink-0">
              {partnerName[0]?.toUpperCase() || "P"}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h2 className="text-admin-base font-bold text-admin-text truncate">
                {partnerName}
              </h2>
              <div className="flex items-center gap-2 text-admin-xs">
                <span className="font-mono text-admin-muted admin-num">DSA Code: <strong className="text-admin-accent">{dsaCode}</strong></span>
                <span>•</span>
                <span className="text-admin-muted">{profile?.partnerType || "Individual"} ({profile?.firmType || "Proprietorship"})</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-admin-xs">
            <div className="space-y-1">
              <span className="text-admin-2xs text-admin-muted uppercase font-bold flex items-center gap-1.5">
                <Smartphone size={13} /> Mobile Number
              </span>
              <p className="font-mono font-bold text-admin-text admin-num">{partnerMobile}</p>
            </div>

            <div className="space-y-1">
              <span className="text-admin-2xs text-admin-muted uppercase font-bold flex items-center gap-1.5">
                <Mail size={13} /> Email Address
              </span>
              <p className="font-semibold text-admin-text truncate">{partnerEmail}</p>
            </div>

            <div className="space-y-1">
              <span className="text-admin-2xs text-admin-muted uppercase font-bold flex items-center gap-1.5">
                <CreditCard size={13} /> Business / Personal PAN
              </span>
              <p className="font-mono font-bold text-admin-text admin-num uppercase">
                {profile?.panNumber || profile?.panData?.panNumber || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-admin-2xs text-admin-muted uppercase font-bold flex items-center gap-1.5">
                <Building2 size={13} /> GST Registration
              </span>
              <p className="font-mono font-bold text-admin-text admin-num uppercase">
                {profile?.gstin || "Not Registered"}
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1 pt-2 border-t border-admin-border/60">
              <span className="text-admin-2xs text-admin-muted uppercase font-bold flex items-center gap-1.5">
                <MapPin size={13} /> Registered Address
              </span>
              <p className="text-admin-text leading-relaxed text-admin-xs">
                {partnerAddress}
              </p>
            </div>
          </div>

          {/* Partner Tier & Agreement Badge */}
          <div className="p-3.5 bg-admin-surface-2 rounded-admin border border-admin-border flex items-center justify-between gap-3 text-admin-xs">
            <div className="flex items-center gap-2 text-admin-text font-bold">
              <Award size={18} className="text-tone-violet-fg shrink-0" />
              <span>DSA Tier: Gold Partner (Commission up to 2.5%)</span>
            </div>
            <span className="text-admin-2xs font-extrabold text-tone-success-fg uppercase px-2 py-0.5 bg-tone-success-bg border border-tone-success-bd rounded-full">
              MOU Signed
            </span>
          </div>
        </div>

        {/* ── Right Column: Payout Bank Settings (5 Cols) ── */}
        <div className="lg:col-span-5 bg-admin-surface rounded-admin border border-admin-border p-5 sm:p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-admin-accent" />
                <h3 className="text-admin-sm font-bold text-admin-text">Payout Bank Account</h3>
              </div>
              {savedBank && !isEditingBank && (
                <button
                  type="button"
                  onClick={() => setIsEditingBank(true)}
                  className="text-admin-2xs font-bold text-admin-accent hover:underline"
                >
                  Change Account
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-tone-danger-bg text-tone-danger-fg text-admin-xs font-semibold rounded-admin border border-tone-danger-bd">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-tone-success-bg text-tone-success-fg text-admin-xs font-bold rounded-admin border border-tone-success-bd">
                {successMsg}
              </div>
            )}

            {savedBank && !isEditingBank ? (
              <div className="p-4 bg-tone-success-bg/40 border border-tone-success-bd/60 rounded-admin space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-tone-success-bd/40 pb-2">
                  <span className="text-admin-2xs font-bold text-tone-success-fg uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Verified for IMPS/NEFT
                  </span>
                  <span className="text-admin-2xs text-admin-muted font-mono admin-num">Active</span>
                </div>

                <div className="space-y-2.5 text-admin-xs">
                  <div>
                    <span className="text-admin-2xs text-admin-muted font-medium">Name at Bank:</span>
                    <p className="font-bold text-admin-text">{savedBank.nameAtBank || savedBank.accountHolderName || partnerName}</p>
                  </div>
                  <div>
                    <span className="text-admin-2xs text-admin-muted font-medium">Bank &amp; IFSC:</span>
                    <p className="font-bold text-admin-text">{savedBank.bankName || "Bank"} ({savedBank.ifsc})</p>
                  </div>
                  <div>
                    <span className="text-admin-2xs text-admin-muted font-medium">Account Number:</span>
                    <p className="font-mono font-bold text-admin-text admin-num">
                      ••••••••{String(savedBank.accountNumber || "").slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-admin-2xs text-admin-muted leading-relaxed">
                  Enter your bank details to receive commissions. We instantly verify the account via Sandbox Penny Drop verification.
                </p>

                <div className="space-y-1">
                  <label className="text-admin-2xs font-bold text-admin-muted uppercase">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="Enter Account Number"
                    value={bankData.accountNumber}
                    onChange={e => setBankData({ ...bankData, accountNumber: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:border-admin-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-admin-2xs font-bold text-admin-muted uppercase">Confirm Account Number</label>
                  <input
                    type="text"
                    placeholder="Re-enter Account Number"
                    value={bankData.confirmAccountNumber}
                    onChange={e => setBankData({ ...bankData, confirmAccountNumber: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text focus:border-admin-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-admin-2xs font-bold text-admin-muted uppercase">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="e.g. SBIN0001234, KKBK0001948"
                    value={bankData.ifsc}
                    onChange={e => setBankData({ ...bankData, ifsc: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-xs font-mono font-bold text-admin-text uppercase focus:border-admin-accent focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {isEditingBank && (
                    <AdminButton variant="secondary" size="sm" onClick={() => setIsEditingBank(false)}>
                      Cancel
                    </AdminButton>
                  )}
                  <AdminButton
                    variant="primary"
                    size="sm"
                    loading={loading}
                    onClick={verifyAndSaveBank}
                    className="flex-1 justify-center font-bold"
                  >
                    Verify via Penny Drop
                  </AdminButton>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-admin-border/60 flex items-center gap-2 text-admin-2xs text-admin-muted">
            <ShieldCheck size={14} className="text-tone-success-fg shrink-0" />
            <span>256-bit encrypted banking handshake with RBI licensed nodes.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
