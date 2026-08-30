"use client"

import React, { useState } from "react"
import { 
  X, 
  Wallet, 
  IndianRupee, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react"
import { AdminButton } from "@/components/admin/ui"
import { formatINR } from "@/lib/hooks/useBanks"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface WalletTopUpModalProps {
  isOpen: boolean
  onClose: () => void
  partnerId: string
  partnerMobile: string
  partnerEmail?: string
  partnerName?: string
  onSuccess?: (newBalance: number) => void
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export default function WalletTopUpModal({
  isOpen,
  onClose,
  partnerId,
  partnerMobile,
  partnerEmail,
  partnerName = "DSA Partner",
  onSuccess,
}: WalletTopUpModalProps) {
  const [amount, setAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState<string>("1000")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleAmountChange = (val: number) => {
    setAmount(val)
    setCustomAmount(String(val))
    setError(null)
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    setCustomAmount(raw)
    const num = Number(raw)
    if (num > 10000) {
      setError("Maximum top-up amount limit is ₹10,000 per transaction.")
    } else {
      setError(null)
    }
    setAmount(num)
  }

  const handleInitiatePayment = async () => {
    setError(null)
    if (!amount || amount < 10) {
      setError("Minimum top-up amount is ₹10.")
      return
    }
    if (amount > 10000) {
      setError("Maximum top-up amount limit is ₹10,000.")
      return
    }

    setLoading(true)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay payment gateway SDK. Please check your connection.")
      }

      // 1. Create Order on Backend
      const orderRes = await fetch("/api/partner/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          partnerId,
          mobileNumber: partnerMobile,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initiate payment gateway order.")
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Techstar Money Solutions Pvt. Ltd.",
        description: `Partner Wallet Top-up (₹${amount.toLocaleString()})`,
        image: "https://res.cloudinary.com/ugpy6fko/image/upload/v1740833190/techstar-logo.png",
        order_id: orderData.orderId,
        prefill: {
          name: partnerName,
          email: partnerEmail || "partner@techstarmoney.com",
          contact: partnerMobile,
        },
        theme: {
          color: "#1769AA", // Techstar Admin Accent
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
        handler: async (response: any) => {
          try {
            // 3. Verify Payment Signature & Credit Balance
            const verifyRes = await fetch("/api/partner/wallet/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount,
                partnerId,
                mobileNumber: partnerMobile,
              }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.")
            }

            setSuccessMsg(verifyData.message || `₹${amount.toLocaleString()} credited successfully!`)
            setTimeout(() => {
              if (onSuccess) onSuccess(verifyData.newBalance)
              onClose()
            }, 1800)
          } catch (vErr: any) {
            setError(vErr.message || "Payment completed, but verification failed. Please contact support.")
          } finally {
            setLoading(false)
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (failedRes: any) => {
        setError(failedRes.error?.description || "Payment failed or was cancelled by user.")
        setLoading(false)
      })
      rzp.open()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred while starting payment.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-admin-surface border border-admin-border rounded-admin max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-admin-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-admin bg-admin-accent-soft text-admin-accent flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="font-bold text-admin-sm text-admin-text">Top Up Partner Wallet</h3>
              <p className="text-admin-2xs text-admin-muted">Powered by Razorpay Secure Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-admin-muted hover:text-admin-text p-1 rounded-admin hover:bg-admin-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-tone-danger-bg text-tone-danger-fg text-admin-xs font-semibold rounded-admin border border-tone-danger-bd flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-tone-success-bg text-tone-success-fg text-admin-xs font-bold rounded-admin border border-tone-success-bd text-center space-y-1">
            <CheckCircle2 size={24} className="mx-auto" />
            <p>{successMsg}</p>
          </div>
        )}

        {!successMsg && (
          <div className="space-y-4">
            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Select Top-Up Amount (Max ₹10,000)
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountChange(amt)}
                    className={cn(
                      "py-2 px-1.5 rounded-admin text-admin-xs font-mono font-bold border transition-all admin-num",
                      amount === amt
                        ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                        : "bg-admin-surface-2 border-admin-border text-admin-text hover:bg-admin-surface-hover"
                    )}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-admin-2xs font-bold text-admin-muted uppercase tracking-wider">
                Or Enter Custom Amount (₹)
              </label>
              <div className="relative">
                <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  type="text"
                  maxLength={5}
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="e.g. 2500"
                  className="w-full pl-9 pr-3 py-2.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-sm font-mono font-bold text-admin-text focus:outline-none focus:border-admin-accent admin-num"
                />
              </div>
              {amount > 0 && (
                <p className="text-admin-2xs text-admin-accent font-semibold pl-1">
                  Recharge Value: {formatINR(amount)}
                </p>
              )}
            </div>

            {/* Use-case description & Non-transferable balance protection */}
            <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border text-admin-2xs text-admin-muted space-y-1.5 leading-relaxed">
              <p className="font-semibold text-admin-text flex items-center gap-1">
                <Zap size={12} className="text-amber-500" /> Utility Balance (Non-Transferable to Bank):
              </p>
              <p>• <strong>₹50</strong> / inquiry for Instant Credit Score Check (CIBIL / Experian)</p>
              <p>• <strong>₹149</strong> / report for Comprehensive Credit Bureau Report</p>
              <p className="text-admin-subtle pt-1 border-t border-admin-border/50 text-[10px]">
                * Note: Recharged funds cannot be transferred or withdrawn to your bank account and are strictly reserved for partner utility checks.
              </p>
            </div>

            {/* Pay Button */}
            <AdminButton
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleInitiatePayment}
              className="w-full justify-center text-admin-xs font-bold"
              icon={CreditCard}
            >
              Pay {formatINR(amount || 0)} via Razorpay
            </AdminButton>

            <div className="flex items-center justify-center gap-1.5 text-admin-2xs text-admin-subtle">
              <ShieldCheck size={12} className="text-tone-success-fg shrink-0" />
              <span>100% Secure 256-bit Encrypted Checkout • Razorpay Gateway</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
