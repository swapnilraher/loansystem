"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Activity, 
  Plus, 
  ArrowRight, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  FileText, 
  TrendingUp, 
  Briefcase, 
  Wallet, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  UploadCloud,
  Search,
  Layers,
  Sparkles,
  Award
} from "lucide-react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useRouter } from "next/navigation"

import {
  AdminButton,
  AdminLinkButton,
  DataTable,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
  StatusBadge,
  Tone,
  toneForStatus
} from "@/components/admin/ui"
import PartnerAgreementModal from "@/components/partner/PartnerAgreementModal"
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { timeAgo, toDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

const CHART_THEME = {
  grid: "var(--admin-border)",
  tick: "var(--admin-text-subtle)",
  accent: "var(--admin-accent)",
  success: "var(--tone-success-fg)",
}

const tooltipStyle = {
  background: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  boxShadow: "var(--admin-shadow-2)",
  fontSize: "12px",
  color: "var(--admin-text)",
  padding: "8px 12px",
}

export default function PartnerDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [tableFilter, setTableFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Security routing check
  useEffect(() => {
    if (profile) {
      const currentSt = String(profile.dsaStatus || profile.status || "").toLowerCase()
      if (currentSt === "draft" && !profile.applicationId) {
        router.push("/onboarding")
      }
    }
  }, [profile, router])

  // Real-time Leads Listener
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "leads"),
      where("partnerId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      data.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
        const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
        return tB - tA
      })
      setLeads(data)
      setLoading(false)
    }, (err) => {
      console.warn("Leads subscription note:", err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Partner Identity & Status Checks
  const dsaStatusRaw = String(profile?.dsaStatus || profile?.status || "").toLowerCase()
  const isApproved = dsaStatusRaw === "active" || dsaStatusRaw === "approved"
  const isUnderVerification = !isApproved
  const partnerDsaCode = profile?.dsaCode || (isApproved ? "DSA-ACTIVE" : "PENDING")
  const partnerName = profile?.name || profile?.fullName || user?.displayName || "Partner"
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/apply?ref=${partnerDsaCode}` : `/apply?ref=${partnerDsaCode}`

  // Metrics Calculations
  const totalLeads = leads.length
  const disbursedLeads = useMemo(() => leads.filter(l => {
    const s = String(l.status || "").toLowerCase()
    return s === "disbursed" || s === "converted"
  }), [leads])
  
  const inProcessLeads = useMemo(() => leads.filter(l => {
    const s = String(l.status || "").toLowerCase()
    return s !== "disbursed" && s !== "converted" && s !== "rejected" && s !== "declined"
  }), [leads])

  const totalDisbursedAmount = useMemo(() => {
    return disbursedLeads.reduce((sum, l) => sum + toAmount(l.disbursedAmount || l.amount || 0), 0)
  }, [disbursedLeads])

  const totalPipelineAmount = useMemo(() => {
    return inProcessLeads.reduce((sum, l) => sum + toAmount(l.amount || 0), 0)
  }, [inProcessLeads])

  // Conversion Ratio
  const conversionRate = totalLeads > 0 ? Math.round((disbursedLeads.length / totalLeads) * 100) : 0

  // 7-Day Performance Sparkline & Trend
  const chartData = useMemo(() => {
    const days: { [key: string]: { day: string; leads: number; disbursed: number } } = {}
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
      days[key] = { day: key, leads: 0, disbursed: 0 }
    }

    leads.forEach(l => {
      const d = toDate(l.createdAt)
      if (d) {
        const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
        if (days[key]) {
          days[key].leads += 1
          const s = String(l.status || "").toLowerCase()
          if (s === "disbursed" || s === "converted") {
            days[key].disbursed += 1
          }
        }
      }
    })

    return Object.values(days)
  }, [leads])

  // Product Distribution Breakdown
  const productDistribution = useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {
      "Personal Loan": { count: 0, volume: 0 },
      "Business Loan": { count: 0, volume: 0 },
      "Home Loan": { count: 0, volume: 0 },
      "Loan Against Property (LAP)": { count: 0, volume: 0 },
      "Other": { count: 0, volume: 0 }
    }

    leads.forEach(l => {
      const p = l.type || l.loanType || "Personal Loan"
      const amt = toAmount(l.amount || 0)
      if (map[p]) {
        map[p].count += 1
        map[p].volume += amt
      } else {
        map["Other"].count += 1
        map["Other"].volume += amt
      }
    })

    return Object.entries(map).filter(([_, val]) => val.count > 0 || totalLeads === 0)
  }, [leads, totalLeads])

  // Filtered Leads for Table
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchQuery === "" || 
        String(lead.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(lead.mobile || lead.phone || "").includes(searchQuery) ||
        String(lead.type || "").toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (tableFilter === "all") return true
      const s = String(lead.status || "").toLowerCase()
      if (tableFilter === "disbursed") return s === "disbursed" || s === "converted"
      if (tableFilter === "in_process") return s !== "disbursed" && s !== "converted" && s !== "rejected"
      if (tableFilter === "rejected") return s === "rejected" || s === "declined"
      return true
    })
  }, [leads, searchQuery, tableFilter])

  const copyToClipboard = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text)
    if (type === "link") {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! Apply for Instant Personal, Business, or Home Loans through TechStar Money Solutions with best interest rates:\n👉 ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-16 bg-admin-surface border border-admin-border rounded-admin" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-admin-surface border border-admin-border rounded-admin" />
          ))}
        </div>
        <div className="h-72 bg-admin-surface border border-admin-border rounded-admin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Top Executive Action Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-admin-xl font-bold tracking-tight text-admin-text">
              Partner Workspace
            </h1>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-admin-2xs font-extrabold uppercase tracking-wider border",
              isApproved 
                ? "bg-tone-success-bg text-tone-success-fg border-tone-success-bd"
                : "bg-tone-warn-bg text-tone-warn-fg border-tone-warn-bd"
            )}>
              {isApproved ? "● Active DSA Partner" : "● Verification Pending"}
            </span>
          </div>
          <p className="text-admin-xs text-admin-muted font-normal">
            Welcome back, <span className="font-semibold text-admin-text">{partnerName}</span>. Monitor customer sourcing, live pipeline, and commissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* DSA Code Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-admin bg-admin-surface-2 border border-admin-border text-admin-xs">
            <span className="text-admin-muted text-admin-2xs uppercase font-bold">DSA Code:</span>
            <span className="font-mono font-bold text-admin-accent admin-num">{partnerDsaCode}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(partnerDsaCode, "code")}
              className="ml-1 text-admin-muted hover:text-admin-text transition-colors"
              title="Copy DSA Code"
            >
              {copiedCode ? <Check size={13} className="text-tone-success-fg" /> : <Copy size={13} />}
            </button>
          </div>

          <AdminLinkButton href="/partner/leads/new" variant="primary" size="md">
            <Plus size={15} />
            <span>New Lead</span>
          </AdminLinkButton>

          <AdminLinkButton href="/partner/wallet" variant="secondary" size="md">
            <Wallet size={15} />
            <span>Wallet</span>
          </AdminLinkButton>
        </div>
      </div>

      {/* ── Top Notice: Verification In Progress Banner ── */}
      {isUnderVerification && (
        <div className="rounded-admin p-4 sm:p-5 bg-gradient-to-r from-tone-warn-bg/70 via-tone-warn-bg/40 to-admin-surface border border-tone-warn-bd text-admin-text shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-admin bg-tone-warn-bg border border-tone-warn-bd flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-tone-warn-fg animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-admin-sm text-admin-text">
                  Your Account Is Under Compliance Review
                </span>
                <span className="px-2 py-0.5 rounded-full text-admin-2xs font-extrabold uppercase tracking-wide bg-tone-warn-bg text-tone-warn-fg border border-tone-warn-bd">
                  In Progress
                </span>
              </div>
              <p className="text-admin-xs text-admin-muted leading-relaxed max-w-3xl">
                Your DSA Partner onboarding application is currently being validated by our operations team. You can create customer leads immediately; loan disbursement payouts will unlock once verified.
              </p>
            </div>
          </div>
          <Link
            href={profile?.mobileNumber ? `/application-status?mobile=${profile.mobileNumber}` : "/application-status"}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-admin bg-admin-accent hover:opacity-90 text-white font-bold text-admin-xs shadow-sm transition-all shrink-0"
          >
            <span>Track Application Status</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── MOU Agreement Modal (Approved & Unsigned Only) ── */}
      {isApproved && profile?.mobileNumber && !profile.agreementSigned && (
        <PartnerAgreementModal
          partnerData={{
            mobileNumber: profile.mobileNumber,
            email: profile.email || user?.email || "",
            fullName: profile.name || user?.displayName || "Partner",
            dsaCode: partnerDsaCode,
            agreementSigned: profile.agreementSigned || false,
            agreementSignedAt: profile.agreementSignedAt,
          }}
        />
      )}

      {/* ── Executive KPI StatCards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads Sourced"
          value={totalLeads}
          tone="primary"
          icon={Users}
          hint={`${conversionRate}% overall conversion rate`}
          delta={{
            value: `+${leads.length} Total`,
            direction: totalLeads > 0 ? "up" : "flat",
            label: "sourced files"
          }}
          sparkline={chartData.map(d => d.leads)}
          href="/partner/leads"
        />

        <StatCard
          label="Disbursed Business"
          value={formatINRShort(totalDisbursedAmount)}
          tone="success"
          icon={IndianRupee}
          hint={`${disbursedLeads.length} successful loan disbursals`}
          delta={{
            value: `${disbursedLeads.length} Deals`,
            direction: disbursedLeads.length > 0 ? "up" : "flat",
            label: "converted"
          }}
          sparkline={chartData.map(d => d.disbursed)}
          href="/partner/leads"
        />

        <StatCard
          label="Active Pipeline"
          value={formatINRShort(totalPipelineAmount)}
          tone="warn"
          icon={Clock}
          hint={`${inProcessLeads.length} files under processing`}
          delta={{
            value: `${inProcessLeads.length} Pending`,
            direction: inProcessLeads.length > 0 ? "up" : "flat",
            label: "in banking stage"
          }}
          href="/partner/leads"
        />

        <StatCard
          label="Commission & Wallet"
          value={formatINRShort(totalDisbursedAmount * 0.015)}
          tone="violet"
          icon={Wallet}
          hint="Est. payout based on standard slab"
          delta={{
            value: "Direct Bank",
            direction: "up",
            label: "instant settlement"
          }}
          href="/partner/wallet"
        />
      </div>

      {/* ── 2-Column Visualizer: Activity Chart & Loan Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-2 rounded-admin border border-admin-border bg-admin-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-admin-sm font-bold text-admin-text flex items-center gap-2">
                <TrendingUp size={16} className="text-admin-accent" /> Sourcing Activity &amp; Disbursals
              </h3>
              <p className="text-admin-2xs text-admin-muted">Daily lead flow over the last 7 calendar days</p>
            </div>
            <div className="flex items-center gap-3 text-admin-2xs">
              <span className="flex items-center gap-1.5 font-medium text-admin-text">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--admin-accent)]" /> Leads
              </span>
              <span className="flex items-center gap-1.5 font-medium text-admin-text">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--tone-success-fg)]" /> Disbursed
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="partnerLeadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="partnerDisbursedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--tone-success-fg)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--tone-success-fg)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                <XAxis dataKey="day" stroke={CHART_THEME.tick} fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke={CHART_THEME.tick} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads Sourced"
                  stroke="var(--admin-accent)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#partnerLeadsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  name="Disbursed"
                  stroke="var(--tone-success-fg)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#partnerDisbursedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Portfolio Distribution */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-admin-sm font-bold text-admin-text flex items-center gap-2">
              <Layers size={16} className="text-tone-violet-fg" /> Product Portfolio
            </h3>
            <p className="text-admin-2xs text-admin-muted mt-0.5">Loan category volume distribution</p>
          </div>

          <div className="space-y-3 my-auto">
            {productDistribution.map(([product, data], idx) => {
              const share = totalLeads > 0 ? Math.round((data.count / totalLeads) * 100) : 0
              return (
                <div key={product} className="space-y-1">
                  <div className="flex justify-between text-admin-xs">
                    <span className="font-medium text-admin-text truncate max-w-[18ch]">{product}</span>
                    <span className="font-mono text-admin-muted admin-num text-admin-2xs">
                      {data.count} ({share}%) • {formatINRShort(data.volume)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-admin-surface-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        idx === 0 ? "bg-admin-accent" :
                        idx === 1 ? "bg-tone-violet-fg" :
                        idx === 2 ? "bg-tone-success-fg" :
                        idx === 3 ? "bg-tone-warn-fg" : "bg-tone-cyan-fg"
                      )}
                      style={{ width: `${Math.max(share, 4)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-3 bg-admin-surface-2 rounded-admin border border-admin-border/60 text-admin-2xs flex items-center justify-between text-admin-muted">
            <span>Portfolio Quality</span>
            <span className="font-bold text-tone-success-fg flex items-center gap-1">
              <ShieldCheck size={13} /> High Approval Rate
            </span>
          </div>
        </div>
      </div>

      {/* ── Partner Sourcing Toolkit (3 Feature Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Direct Referral Link */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-4 space-y-3 shadow-sm hover:border-admin-border-focus transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-admin bg-admin-accent/10 text-admin-accent flex items-center justify-center shrink-0">
              <Share2 size={16} />
            </div>
            <div>
              <h4 className="text-admin-xs font-bold text-admin-text">Customer Referral Link</h4>
              <p className="text-admin-2xs text-admin-muted">Auto-tags applications to your DSA code</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-admin-surface-2 border border-admin-border rounded-admin text-admin-2xs font-mono text-admin-text truncate">
            <span className="truncate flex-1">{referralLink}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(referralLink, "link")}
              className="px-2 py-1 rounded bg-admin-surface border border-admin-border text-admin-text font-sans font-bold hover:bg-admin-surface-hover shrink-0"
            >
              {copiedLink ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Card 2: Instant WhatsApp Sourcing */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-4 space-y-3 shadow-sm hover:border-admin-border-focus transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-admin bg-tone-success-bg text-tone-success-fg flex items-center justify-center shrink-0">
              <MessageCircle size={16} />
            </div>
            <div>
              <h4 className="text-admin-xs font-bold text-admin-text">WhatsApp Quick Share</h4>
              <p className="text-admin-2xs text-admin-muted">Broadcast to clients with pre-filled pitch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={shareOnWhatsApp}
            className="w-full py-1.5 px-3 rounded-admin bg-tone-success text-tone-success-fg border border-tone-success-bd font-bold text-admin-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={14} />
            <span>Share via WhatsApp</span>
          </button>
        </div>

        {/* Card 3: Commission Tier & MOU */}
        <div className="rounded-admin border border-admin-border bg-admin-surface p-4 space-y-3 shadow-sm hover:border-admin-border-focus transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-admin bg-tone-violet-bg text-tone-violet-fg flex items-center justify-center shrink-0">
              <Award size={16} />
            </div>
            <div>
              <h4 className="text-admin-xs font-bold text-admin-text">Partner Tier: Gold DSA</h4>
              <p className="text-admin-2xs text-admin-muted">Payout cycle: Instant upon bank disbursal</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-admin-2xs pt-1 border-t border-admin-border/60">
            <span className="text-admin-muted">Commission Slab: <strong>Up to 2.50%</strong></span>
            {profile?.mobileNumber && (
              <a
                href={`/api/partner/agreement/pdf?mobile=${profile.mobileNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-admin-accent font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>MOU PDF</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Sourced Leads Table ── */}
      <div className="rounded-admin border border-admin-border bg-admin-surface shadow-sm overflow-hidden space-y-0">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-admin-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-admin-surface-2/40">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-admin-accent" />
            <h3 className="text-admin-sm font-bold text-admin-text">Recent Leads &amp; Applications</h3>
            <span className="px-2 py-0.5 rounded-full text-admin-2xs font-bold bg-admin-surface-2 text-admin-muted border border-admin-border">
              {filteredLeads.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-admin-xs bg-admin-surface border border-admin-border rounded-admin text-admin-text placeholder:text-admin-subtle focus:outline-none focus:border-admin-accent"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-admin-surface p-0.5 border border-admin-border rounded-admin text-admin-2xs">
              {[
                { id: "all", label: "All" },
                { id: "in_process", label: "In Pipeline" },
                { id: "disbursed", label: "Disbursed" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTableFilter(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded font-bold transition-all",
                    tableFilter === tab.id
                      ? "bg-admin-accent text-white shadow-xs"
                      : "text-admin-muted hover:text-admin-text"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AdminLinkButton href="/partner/leads" variant="secondary" size="sm">
              <span>View All</span>
              <ChevronRight size={13} />
            </AdminLinkButton>
          </div>
        </div>

        {/* Leads Table Content */}
        {filteredLeads.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <EmptyState
              title={leads.length === 0 ? "No Customer Leads Yet" : "No Leads Found"}
              description={
                leads.length === 0 
                  ? "Start by adding your first applicant or sharing your branded referral link." 
                  : "No lead matches your active search and status filter."
              }
              action={
                <AdminLinkButton href="/partner/leads/new" variant="primary" size="md">
                  <Plus size={15} />
                  <span>Create First Lead</span>
                </AdminLinkButton>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-admin-xs border-collapse">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-2/60 text-admin-muted text-admin-2xs uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Loan Amount</th>
                  <th className="py-3 px-4">Status / Stage</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredLeads.slice(0, 8).map(lead => {
                  const leadAmount = toAmount(lead.amount || 0)
                  const leadStatus = lead.status || "New Lead"
                  return (
                    <tr key={lead.id} className="hover:bg-admin-surface-hover transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-admin bg-admin-surface-2 border border-admin-border flex items-center justify-center font-bold text-admin-text shrink-0 text-admin-xs">
                            {lead.name?.[0]?.toUpperCase() || "L"}
                          </div>
                          <div>
                            <p className="font-bold text-admin-text group-hover:text-admin-accent transition-colors">
                              {lead.name || "Unnamed Applicant"}
                            </p>
                            <p className="text-admin-2xs text-admin-muted font-mono admin-num">
                              {lead.mobile || lead.phone || "—"} {lead.city ? `• ${lead.city}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-text font-medium text-admin-2xs">
                          {lead.type || lead.loanType || "Personal Loan"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold font-mono text-admin-text admin-num">
                          {formatINR(leadAmount)}
                        </p>
                        {lead.disbursedAmount && (
                          <p className="text-admin-2xs text-tone-success-fg font-mono admin-num">
                            Disbursed: {formatINR(toAmount(lead.disbursedAmount))}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={leadStatus} dot size="sm" />
                      </td>

                      <td className="py-3 px-4 text-admin-2xs text-admin-muted font-mono admin-num">
                        {lead.createdAt ? timeAgo(lead.createdAt) : "Just now"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.mobile && (
                            <a
                              href={`https://wa.me/91${String(lead.mobile).replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-admin bg-tone-success-bg text-tone-success-fg hover:opacity-80 transition-opacity"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={13} />
                            </a>
                          )}
                          <Link
                            href={`/partner/leads`}
                            className="p-1.5 rounded-admin bg-admin-surface-2 text-admin-text hover:bg-admin-surface-hover transition-colors"
                            title="View details"
                          >
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
