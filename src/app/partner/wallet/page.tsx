"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { 
  Wallet, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  IndianRupee, 
  ShieldAlert,
  Building2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Landmark,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Zap,
  CreditCard,
  FileText
} from "lucide-react"
import Link from "next/link"

import { 
  AdminButton, 
  AdminLinkButton, 
  EmptyState, 
  PageHeader, 
  StatCard, 
  StatusBadge, 
  toneForStatus 
} from "@/components/admin/ui"
import WalletTopUpModal from "@/components/partner/WalletTopUpModal"
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { timeAgo, toDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

export default function PartnerWallet() {
  const { user, profile } = useAuth()
  const [commissions, setCommissions] = useState<any[]>([])
  const [walletTxs, setWalletTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"commissions" | "topups">("commissions")
  const [filterStatus, setFilterStatus] = useState("all")
  const [topUpModalOpen, setTopUpModalOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number>(Number(profile?.walletBalance) || 0)

  useEffect(() => {
    if (!user) return

    // 1. Sync commissions ledger
    const qComm = query(
      collection(db, "commission_ledger"),
      where("partnerId", "==", user.uid)
    )

    const unsubComm = onSnapshot(qComm, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      data.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
        const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
        return tB - tA
      })
      setCommissions(data)
      setLoading(false)
    }, (err) => {
      console.warn("Wallet ledger error:", err)
      setLoading(false)
    })

    // 2. Sync wallet transactions (Top-ups & Bureau deductions)
    const qTx = query(
      collection(db, "wallet_transactions"),
      where("partnerId", "==", user.uid)
    )

    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      txData.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
        const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
        return tB - tA
      })
      setWalletTxs(txData)
    }, (err) => {
      console.warn("Wallet txs error:", err)
    })

    if (profile?.walletBalance !== undefined) {
      setWalletBalance(Number(profile.walletBalance) || 0)
    }

    return () => {
      unsubComm()
      unsubTx()
    }
  }, [user, profile])

  const totalEarned = useMemo(() => {
    return commissions.reduce((sum, c) => sum + toAmount(c.commissionAmount || 0), 0)
  }, [commissions])

  const underSettlement = useMemo(() => {
    return commissions
      .filter(c => c.status === "Under Settlement" || c.status === "Pending")
      .reduce((sum, c) => sum + toAmount(c.commissionAmount || 0), 0)
  }, [commissions])

  const settled = useMemo(() => {
    return commissions
      .filter(c => c.status === "Settled" || c.status === "Paid")
      .reduce((sum, c) => sum + toAmount(c.commissionAmount || 0), 0)
  }, [commissions])

  const hold = useMemo(() => {
    return commissions
      .filter(c => c.status === "Hold" || c.status === "Blocked")
      .reduce((sum, c) => sum + toAmount(c.commissionAmount || 0), 0)
  }, [commissions])

  const filteredCommissions = useMemo(() => {
    if (filterStatus === "all") return commissions
    return commissions.filter(c => {
      const s = String(c.status || "").toLowerCase()
      if (filterStatus === "settled") return s === "settled" || s === "paid"
      if (filterStatus === "pending") return s === "under settlement" || s === "pending"
      if (filterStatus === "hold") return s === "hold" || s === "blocked"
      return true
    })
  }, [commissions, filterStatus])

  const bankDetails = profile?.bankDetails
  const partnerDisplayName = profile?.name || profile?.fullName || "Partner"

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div>
          <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
            Partner Commission &amp; Prepaid Wallet
          </h1>
          <p className="text-admin-xs text-admin-muted mt-0.5">
            Manage your prepaid credit balance for bureau checks and track loan sourcing commissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <AdminButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setTopUpModalOpen(true)}
          >
            Top Up Wallet
          </AdminButton>

          <AdminLinkButton href="/partner/credit-check" variant="secondary" size="md" icon={ShieldCheck}>
            Credit Check Tool
          </AdminLinkButton>

          <AdminLinkButton href="/partner/profile" variant="secondary" size="md" icon={Landmark}>
            Bank Settings
          </AdminLinkButton>
        </div>
      </div>

      {/* ── 2 Main Master Cards: Usable Prepaid Wallet + Commission Payouts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Usable Prepaid Credit Balance (Razorpay Top-ups) */}
        <div className="lg:col-span-5 rounded-admin border border-admin-accent/30 bg-gradient-to-br from-admin-surface via-admin-accent-soft/30 to-admin-surface p-6 shadow-sm space-y-5 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-admin-accent text-admin-2xs uppercase font-extrabold tracking-wider">
                <Wallet size={16} />
                <span>Usable Prepaid Balance</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-admin-2xs font-extrabold uppercase bg-admin-accent text-white shadow-2xs">
                Instant Razorpay
              </span>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-admin-text admin-num tracking-tight">
                {formatINR(walletBalance)}
              </p>
              <p className="text-admin-2xs text-admin-muted mt-1">
                Available for instant customer credit checks (₹50) &amp; reports (₹149).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-admin-border/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setTopUpModalOpen(true)}
              className="flex-1 py-2 px-3 rounded-admin bg-admin-accent text-white font-bold text-admin-xs hover:bg-admin-accent/90 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Add Balance (Max ₹10k)</span>
            </button>

            <Link
              href="/partner/credit-check"
              className="py-2 px-3 rounded-admin bg-admin-surface-2 border border-admin-border text-admin-text font-bold text-admin-xs hover:bg-admin-surface-hover transition-colors flex items-center gap-1"
            >
              <Zap size={14} className="text-admin-accent" />
              <span>Run Check</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Sourcing Commissions & Bank Settlement */}
        <div className="lg:col-span-7 rounded-admin border border-admin-border bg-admin-surface p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-admin-muted text-admin-2xs uppercase font-extrabold tracking-wider">
                <TrendingUp size={15} className="text-tone-success-fg" />
                <span>Lifetime Sourcing Commission</span>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-admin-text admin-num tracking-tight">
                {formatINR(totalEarned)}
              </p>
            </div>

            {/* Linked Bank Badge */}
            {bankDetails ? (
              <div className="flex items-center gap-2.5 p-2.5 bg-admin-surface-2 rounded-admin border border-admin-border text-admin-xs shadow-2xs">
                <div className="w-7 h-7 rounded-admin bg-tone-success-bg text-tone-success-fg flex items-center justify-center shrink-0 border border-tone-success-bd">
                  <Landmark size={14} />
                </div>
                <div>
                  <p className="font-bold text-admin-text truncate max-w-[16ch]">
                    {bankDetails.bankName || "Linked Bank"}
                  </p>
                  <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                    A/C ••••{String(bankDetails.accountNumber || "").slice(-4)}
                  </p>
                </div>
              </div>
            ) : (
              <Link
                href="/partner/profile"
                className="flex items-center gap-1.5 p-2 bg-tone-warn-bg text-tone-warn-fg rounded-admin border border-tone-warn-bd text-admin-2xs font-bold hover:opacity-90 transition-opacity"
              >
                <ShieldAlert size={14} />
                <span>Add Bank for Payouts →</span>
              </Link>
            )}
          </div>

          {/* 3 Settlement Sub-Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-admin-border text-admin-xs">
            <div className="p-2.5 bg-admin-surface-2 rounded-admin border border-admin-border">
              <span className="text-tone-warn-fg text-admin-2xs font-bold uppercase block truncate">Under Settlement</span>
              <p className="text-admin-sm font-bold font-mono text-admin-text admin-num mt-0.5">{formatINR(underSettlement)}</p>
            </div>
            <div className="p-2.5 bg-admin-surface-2 rounded-admin border border-admin-border">
              <span className="text-tone-success-fg text-admin-2xs font-bold uppercase block truncate">Settled</span>
              <p className="text-admin-sm font-bold font-mono text-admin-text admin-num mt-0.5">{formatINR(settled)}</p>
            </div>
            <div className="p-2.5 bg-admin-surface-2 rounded-admin border border-admin-border">
              <span className="text-tone-danger-fg text-admin-2xs font-bold uppercase block truncate">Hold</span>
              <p className="text-admin-sm font-bold font-mono text-admin-text admin-num mt-0.5">{formatINR(hold)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ledger Tabs: Sourcing Commissions vs Wallet Top-ups / Checks ── */}
      <div className="rounded-admin border border-admin-border bg-admin-surface shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-admin-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-admin-surface-2/40">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("commissions")}
              className={cn(
                "px-3 py-1.5 rounded-admin text-admin-xs font-bold transition-all",
                activeTab === "commissions"
                  ? "bg-admin-accent text-white shadow-xs"
                  : "bg-admin-surface text-admin-muted hover:text-admin-text border border-admin-border"
              )}
            >
              Loan Sourcing Commissions ({commissions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("topups")}
              className={cn(
                "px-3 py-1.5 rounded-admin text-admin-xs font-bold transition-all",
                activeTab === "topups"
                  ? "bg-admin-accent text-white shadow-xs"
                  : "bg-admin-surface text-admin-muted hover:text-admin-text border border-admin-border"
              )}
            >
              Wallet Recharges &amp; Credit Checks ({walletTxs.length})
            </button>
          </div>

          {/* Filter Pills for Commissions */}
          {activeTab === "commissions" && (
            <div className="flex items-center gap-1 bg-admin-surface p-0.5 border border-admin-border rounded-admin text-admin-2xs">
              {[
                { id: "all", label: "All" },
                { id: "settled", label: "Settled" },
                { id: "pending", label: "Pending" },
                { id: "hold", label: "Hold" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded font-bold transition-all",
                    filterStatus === tab.id
                      ? "bg-admin-accent text-white shadow-xs"
                      : "text-admin-muted hover:text-admin-text"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Tab 1: Commissions */}
        {activeTab === "commissions" && (
          <div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-admin-surface-2 rounded-admin animate-pulse" />
                ))}
              </div>
            ) : filteredCommissions.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  title="No Commission Entries Yet"
                  description="Commissions are logged automatically upon loan disbursals by our lending bank partners."
                  action={
                    <AdminLinkButton href="/partner/leads/new" variant="primary" size="md">
                      Submit Customer Lead
                    </AdminLinkButton>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-admin-border">
                {filteredCommissions.map(c => {
                  const commAmt = toAmount(c.commissionAmount || 0)
                  const disbAmt = toAmount(c.disbursedAmount || 0)
                  const isSettled = c.status === "Settled" || c.status === "Paid"
                  const isPending = c.status === "Under Settlement" || c.status === "Pending"

                  return (
                    <div 
                      key={c.id} 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-admin-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "w-10 h-10 rounded-admin flex items-center justify-center shrink-0 border font-bold",
                          isSettled ? "bg-tone-success-bg text-tone-success-fg border-tone-success-bd" :
                          isPending ? "bg-tone-warn-bg text-tone-warn-fg border-tone-warn-bd" :
                          "bg-admin-surface-2 text-admin-muted border-admin-border"
                        )}>
                          {isSettled ? <ArrowDownRight size={18} /> : <Clock size={18} />}
                        </div>

                        <div className="space-y-0.5">
                          <p className="font-bold text-admin-sm text-admin-text">
                            {c.customerName || "Customer Lead Payout"}
                          </p>
                          <p className="text-admin-2xs text-admin-muted">
                            {c.productType || "Loan"} • Disbursed: <span className="font-mono admin-num font-bold text-admin-text">{formatINR(disbAmt)}</span>
                            {c.bankName ? ` • ${c.bankName}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-right pl-13 sm:pl-0">
                        <p className="font-bold font-mono text-admin-base text-admin-text admin-num">
                          +{formatINR(commAmt)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.commissionPercentage && (
                            <span className="text-admin-2xs text-admin-muted font-mono admin-num">
                              {c.commissionPercentage}% slab
                            </span>
                          )}
                          <StatusBadge status={c.status || "Pending"} size="sm" dot />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Tab 2: Wallet Top-ups & Credit Checks */}
        {activeTab === "topups" && (
          <div>
            {walletTxs.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  title="No Wallet Recharges Yet"
                  description="Top up your wallet via Razorpay to perform credit score checks and generate full bureau reports."
                  action={
                    <AdminButton variant="primary" size="md" icon={Plus} onClick={() => setTopUpModalOpen(true)}>
                      Top Up Wallet Now
                    </AdminButton>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-admin-border">
                {walletTxs.map(tx => {
                  const isCredit = tx.type === "CREDIT"
                  return (
                    <div 
                      key={tx.id} 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-admin-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "w-10 h-10 rounded-admin flex items-center justify-center shrink-0 border font-bold",
                          isCredit 
                            ? "bg-tone-success-bg text-tone-success-fg border-tone-success-bd"
                            : "bg-admin-surface-2 text-admin-accent border-admin-border"
                        )}>
                          {isCredit ? <Plus size={18} /> : <Zap size={18} />}
                        </div>

                        <div className="space-y-0.5">
                          <p className="font-bold text-admin-sm text-admin-text">
                            {isCredit ? "Wallet Recharge via Razorpay" : `Credit Check: ${tx.customerName || "Customer"}`}
                          </p>
                          <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                            {isCredit ? `Pay ID: ${tx.paymentId || "—"}` : `Bureau: ${tx.bureau || "CIBIL"} • PAN: ${tx.customerPan || "—"}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-right pl-13 sm:pl-0">
                        <p className={cn(
                          "font-bold font-mono text-admin-base admin-num",
                          isCredit ? "text-tone-success-fg" : "text-admin-text"
                        )}>
                          {isCredit ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                        </p>
                        <span className="text-admin-2xs text-admin-muted font-mono admin-num mt-0.5">
                          {tx.createdAt ? timeAgo(tx.createdAt) : "Recently"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
