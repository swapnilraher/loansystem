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
  Filter
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
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { timeAgo, toDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

export default function PartnerWallet() {
  const { user, profile } = useAuth()
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "commission_ledger"),
      where("partnerId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe()
  }, [user])

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

  const filteredTransactions = useMemo(() => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div>
          <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
            Partner Commission &amp; Wallet
          </h1>
          <p className="text-admin-xs text-admin-muted mt-0.5">
            Real-time ledger of loan sourcing incentives and direct bank payouts.
          </p>
        </div>

        <AdminLinkButton href="/partner/profile" variant="secondary" size="md" icon={Landmark}>
          Payout Bank Settings
        </AdminLinkButton>
      </div>

      {/* ── Executive Wallet Master Card ── */}
      <div className="rounded-admin border border-admin-border bg-gradient-to-br from-admin-surface via-admin-surface-2 to-admin-surface p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-admin-muted text-admin-2xs uppercase font-extrabold tracking-wider">
              <Wallet size={15} className="text-admin-accent" />
              <span>Total Lifetime Commissions</span>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-admin-text admin-num tracking-tight">
              {formatINR(totalEarned)}
            </p>
          </div>

          {/* Linked Bank Badge */}
          {bankDetails ? (
            <div className="flex items-center gap-3 p-3 bg-admin-surface rounded-admin border border-admin-border text-admin-xs shadow-2xs">
              <div className="w-8 h-8 rounded-admin bg-tone-success-bg text-tone-success-fg flex items-center justify-center shrink-0 border border-tone-success-bd">
                <Landmark size={16} />
              </div>
              <div>
                <p className="font-bold text-admin-text truncate max-w-[18ch]">
                  {bankDetails.bankName || "Linked Bank"}
                </p>
                <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                  A/C ••••{String(bankDetails.accountNumber || "").slice(-4)} • {bankDetails.ifsc || "IFSC"}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/partner/profile"
              className="flex items-center gap-2 p-3 bg-tone-warn-bg text-tone-warn-fg rounded-admin border border-tone-warn-bd text-admin-xs font-bold hover:opacity-90 transition-opacity"
            >
              <ShieldAlert size={16} />
              <span>Add Verified Bank for Payouts →</span>
            </Link>
          )}
        </div>

        {/* 3-Column Settlement Sub-Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-admin-border">
          <div className="p-3 bg-admin-surface rounded-admin border border-admin-border">
            <div className="flex items-center gap-1.5 text-tone-warn-fg text-admin-2xs font-bold uppercase">
              <Clock size={13} />
              <span>Under Settlement</span>
            </div>
            <p className="text-admin-lg font-bold font-mono text-admin-text admin-num mt-1">
              {formatINR(underSettlement)}
            </p>
            <p className="text-admin-2xs text-admin-muted mt-0.5">Processing in next cycle</p>
          </div>

          <div className="p-3 bg-admin-surface rounded-admin border border-admin-border">
            <div className="flex items-center gap-1.5 text-tone-success-fg text-admin-2xs font-bold uppercase">
              <CheckCircle2 size={13} />
              <span>Settled to Bank</span>
            </div>
            <p className="text-admin-lg font-bold font-mono text-admin-text admin-num mt-1">
              {formatINR(settled)}
            </p>
            <p className="text-admin-2xs text-admin-muted mt-0.5">Credited via IMPS/NEFT</p>
          </div>

          <div className="p-3 bg-admin-surface rounded-admin border border-admin-border">
            <div className="flex items-center gap-1.5 text-tone-danger-fg text-admin-2xs font-bold uppercase">
              <ShieldAlert size={13} />
              <span>On Hold / Queries</span>
            </div>
            <p className="text-admin-lg font-bold font-mono text-admin-text admin-num mt-1">
              {formatINR(hold)}
            </p>
            <p className="text-admin-2xs text-admin-muted mt-0.5">Pending client verification</p>
          </div>
        </div>
      </div>

      {/* ── Transaction Ledger Table ── */}
      <div className="rounded-admin border border-admin-border bg-admin-surface shadow-sm overflow-hidden space-y-0">
        {/* Ledger Toolbar */}
        <div className="p-4 border-b border-admin-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-admin-surface-2/40">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-admin-accent" />
            <h3 className="text-admin-sm font-bold text-admin-text">Commission History &amp; Settlements</h3>
            <span className="px-2 py-0.5 rounded-full text-admin-2xs font-bold bg-admin-surface-2 text-admin-muted border border-admin-border">
              {filteredTransactions.length}
            </span>
          </div>

          {/* Filter Pills */}
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
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-admin-surface-2 rounded-admin animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="No Commission Entries Yet"
              description="Commission entries are generated automatically as soon as your customer loan files get disbursed by our lending partners."
              action={
                <AdminLinkButton href="/partner/leads/new" variant="primary" size="md">
                  Submit Customer Lead
                </AdminLinkButton>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-admin-border">
            {filteredTransactions.map(c => {
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
    </div>
  )
}
