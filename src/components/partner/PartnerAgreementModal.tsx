"use client"

import React, { useState } from "react"
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertCircle,
  Smartphone,
  ArrowRight,
  Eye,
  X,
  Lock,
} from "lucide-react"

interface PartnerAgreementModalProps {
  partnerData: {
    mobileNumber: string
    email?: string
    fullName?: string
    dsaCode?: string
    agreementSigned?: boolean
    agreementSignedAt?: string
  }
  onSigned?: () => void
}

export default function PartnerAgreementModal({
  partnerData,
  onSigned,
}: PartnerAgreementModalProps) {
  const [showModal, setShowModal] = useState(!partnerData.agreementSigned)
  const [viewPdfModal, setViewPdfModal] = useState(false)
  const [step, setStep] = useState<"review" | "otp">("review")
  const [otp, setOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [isSignedLocally, setIsSignedLocally] = useState(partnerData.agreementSigned || false)

  const pdfUrl = `/api/partner/agreement/pdf?mobile=${partnerData.mobileNumber}`

  // Send OTP for agreement signing
  const handleRequestOtp = async () => {
    setSendingOtp(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: partnerData.mobileNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send OTP")
      setStep("otp")
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Verify OTP and sign agreement
  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.")
      return
    }

    setVerifying(true)
    setError("")
    try {
      const res = await fetch("/api/partner/agreement/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: partnerData.mobileNumber,
          email: partnerData.email,
          otp: otp.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to execute agreement signature")

      setIsSignedLocally(true)
      setSuccessMsg("🎉 Memorandum of Understanding (MOU) executed successfully! Executed agreement PDF has been sent to your email.")
      setTimeout(() => {
        setShowModal(false)
        if (onSigned) onSigned()
      }, 3000)
    } catch (err: any) {
      setError(err.message || "OTP verification failed. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  if (isSignedLocally && !showModal) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>DSA Partner MOU Agreement Executed &amp; Email Dispatched</span>
        </div>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shrink-0"
        >
          <Download size={13} />
          <span>Download MOU PDF</span>
        </a>
      </div>
    )
  }

  return (
    <>
      {/* Pending Agreement Banner in Dashboard */}
      {!isSignedLocally && (
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-2 border-blue-500/30 rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    DSA Partner Agreement (MOU) Signature Required
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Please review and accept your official Partner Agreement with Techstar Money Solution Pvt. Ltd. via mobile OTP verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewPdfModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <Eye size={14} className="text-blue-600" />
                <span>Preview MOU</span>
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <ShieldCheck size={15} />
                <span>Sign Agreement via OTP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main OTP Signing Modal */}
      {showModal && !isSignedLocally && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  TSM
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Techstar Money Solution Pvt. Ltd.</h3>
                  <p className="text-[10px] text-blue-300 uppercase font-semibold">DSA Partner MOU Agreement</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {successMsg ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-emerald-900">{successMsg}</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Step 1: Review Agreement Summary */}
                  {step === "review" ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-700">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="font-semibold text-slate-500">Document Type:</span>
                          <span className="font-bold text-slate-900">Memorandum of Understanding (MOU)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="font-semibold text-slate-500">First Party:</span>
                          <span className="font-bold text-blue-700">Techstar Money Solution Pvt. Ltd.</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="font-semibold text-slate-500">Second Party (Partner):</span>
                          <span className="font-bold text-slate-900">{partnerData.fullName || "DSA Partner"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="font-semibold text-slate-500">Partner Code:</span>
                          <span className="font-mono font-bold text-slate-900">{partnerData.dsaCode || "Pending"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Execution Date:</span>
                          <span className="font-bold text-slate-900">{new Date().toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <ShieldCheck size={14} className="text-blue-600" />
                          OTP-Based Electronic Agreement Signing:
                        </p>
                        <p>
                          By proceeding, an OTP verification code will be dispatched to your registered mobile number <strong>+91 {partnerData.mobileNumber}</strong>. Upon entering the valid OTP, this agreement will be legally executed and emailed to you as a PDF attachment.
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Download size={14} />
                          <span>View Full PDF</span>
                        </a>

                        <button
                          type="button"
                          disabled={sendingOtp}
                          onClick={handleRequestOtp}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                          {sendingOtp ? (
                            <span>Sending OTP...</span>
                          ) : (
                            <>
                              <span>Request OTP to Sign MOU</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Enter 6-digit OTP */
                    <form onSubmit={handleSignAgreement} className="space-y-4">
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                          <Smartphone size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Enter Verification OTP</h4>
                        <p className="text-xs text-slate-500">
                          We sent a 6-digit OTP code to <strong>+91 {partnerData.mobileNumber}</strong>
                        </p>
                      </div>

                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <label className="block text-center text-xs font-semibold text-slate-600">
                          6-DIGIT OTP CODE
                        </label>
                        <input
                          autoFocus
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, ""))
                            setError("")
                          }}
                          placeholder="••••••"
                          className="w-full text-center text-xl font-mono tracking-[0.3em] font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setStep("review")}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800"
                        >
                          &larr; Back
                        </button>

                        <button
                          type="submit"
                          disabled={verifying || otp.length !== 6}
                          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md"
                        >
                          {verifying ? (
                            <span>Signing &amp; Executing MOU...</span>
                          ) : (
                            <>
                              <Lock size={14} />
                              <span>Verify OTP &amp; Execute MOU</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {viewPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="text-sm font-bold">Preview Partner Agreement (MOU) PDF</span>
              <button
                onClick={() => setViewPdfModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <iframe src={pdfUrl} className="w-full flex-1 border-none" title="Agreement PDF" />
          </div>
        </div>
      )}
    </>
  )
}
