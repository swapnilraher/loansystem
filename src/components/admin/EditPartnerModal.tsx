"use client"

import React, { useState } from "react"
import { X, Save, Building2, User, CreditCard, MapPin, CheckCircle2, AlertCircle } from "lucide-react"

interface EditPartnerModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onSaved: () => void
}

export default function EditPartnerModal({
  isOpen,
  onClose,
  application,
  onSaved,
}: EditPartnerModalProps) {
  const [fullName, setFullName] = useState(application?.fullName || application?.contactPersonName || "")
  const [email, setEmail] = useState(application?.email || "")
  const [panNumber, setPanNumber] = useState(application?.panNumber || application?.panData?.panNumber || "")
  const [partnerType, setPartnerType] = useState(application?.partnerType || "Individual")
  const [firmType, setFirmType] = useState(application?.firmType || "")
  const [addressLine1, setAddressLine1] = useState(application?.addressLine1 || application?.address?.line1 || "")
  const [addressLine2, setAddressLine2] = useState(application?.addressLine2 || application?.address?.line2 || "")
  const [city, setCity] = useState(application?.city || application?.address?.city || "")
  const [stateName, setStateName] = useState(application?.stateName || application?.address?.state || "")
  const [pinCode, setPinCode] = useState(application?.pinCode || application?.address?.pincode || "")
  const [isGstRegistered, setIsGstRegistered] = useState(application?.isGstRegistered || "No")
  const [gstin, setGstin] = useState(application?.gstin || "")

  // Bank Details
  const [accountHolderName, setAccountHolderName] = useState(application?.bankDetails?.accountHolderName || application?.bankDetails?.nameAtBank || "")
  const [bankName, setBankName] = useState(application?.bankDetails?.bankName || "")
  const [branchName, setBranchName] = useState(application?.bankDetails?.branchName || "")
  const [accountNumber, setAccountNumber] = useState(application?.bankDetails?.accountNumber || "")
  const [ifsc, setIfsc] = useState(application?.bankDetails?.ifsc || "")
  const [accountType, setAccountType] = useState(application?.bankDetails?.accountType || "Savings")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen || !application) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/partner/applications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber: application.mobileNumber || application.id,
          applicationId: application.applicationId,
          fullName,
          email,
          panNumber: panNumber.toUpperCase(),
          partnerType,
          firmType,
          addressLine1,
          addressLine2,
          city,
          stateName,
          pinCode,
          isGstRegistered,
          gstin: gstin.toUpperCase(),
          bankDetails: {
            accountHolderName: accountHolderName || fullName,
            nameAtBank: accountHolderName || fullName,
            bankName,
            branchName,
            accountNumber,
            ifsc: ifsc.toUpperCase(),
            accountType,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update application")

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || "Save failed. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Edit Partner Application Details (Admin)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Basic & Business Details */}
          <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <User size={14} /> Basic &amp; Business Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name / Applicant Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Partner Entity Type</label>
                <select
                  value={partnerType}
                  onChange={(e) => setPartnerType(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Individual">Individual</option>
                  <option value="Firm">Firm / Company</option>
                </select>
              </div>

              {partnerType === "Firm" && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Firm Type</label>
                  <select
                    value={firmType}
                    onChange={(e) => setFirmType(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Limited">Limited</option>
                    <option value="LLP">LLP</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Office Address */}
          <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <MapPin size={14} /> Office Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CreditCard size={14} /> Bank Account Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">IFSC Code</label>
                <input
                  type="text"
                  maxLength={11}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? "Saving Changes..." : "Save Application Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
