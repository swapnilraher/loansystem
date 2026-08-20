"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  IndianRupee,
  Landmark,
  Network,
  Phone,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
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

import { db } from "@/lib/firebase"
import { collection, onSnapshot, query } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import { useViewerIdentity } from "@/lib/hooks/useViewerIdentity"
import { useLeads } from "@/lib/hooks/useLeads"
import { useUsers } from "@/lib/hooks/useUsers"
import { useNow } from "@/lib/hooks/useNow"
import { can, canSeeLead, ownsLead } from "@/lib/permissions"
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { computeStaffPerformance, useStaffIncentives } from "@/lib/hooks/useStaffPerformance"
import { STATUS_DISBURSED, STATUS_PENDING_APPROVAL, CLOSED_STATUSES } from "@/lib/disbursement"
import { endOfDay, formatDayShort, startOfDay, timeAgo, toMillis } from "@/lib/dates"
import {
  AdminLinkButton,
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
  StatusBadge,
  Tone,
} from "@/components/admin/ui"
import type { Lead } from "@/lib/hooks/useLeads"

const CHART_DAYS = 7

/** Recharts takes plain attribute values, so tokens go in as `var(--…)`. */
const CHART = {
  grid: "var(--admin-border)",
  tick: "var(--admin-text-subtle)",
  leads: "var(--admin-accent)",
  disbursed: "var(--tone-violet-fg)",
  bars: [
    "var(--tone-info-fg)",
    "var(--tone-violet-fg)",
    "var(--tone-cyan-fg)",
    "var(--tone-warn-fg)",
    "var(--tone-success-fg)",
  ],
}

const tooltipStyle = {
  background: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  boxShadow: "var(--admin-shadow-2)",
  fontSize: "12px",
  color: "var(--admin-text)",
}

export default function AdminOverview() {
  const { user, profile, role } = useAuth()
  const viewer = useViewerIdentity()
  const { leads: allLeads, loading } = useLeads()
  const { users: adminUsers } = useUsers()
  const [activities, setActivities] = useState<{ type?: string; userName?: string }[]>([])
  const now = useNow()

  // Every metric below is computed from leads this role is allowed to see, so a
  // telecaller's dashboard reflects only their own leads + the unassigned pool.
  const leads = useMemo(
    () => allLeads.filter(l => canSeeLead(role, l, viewer)),
    [allLeads, role, viewer]
  )

  const canViewTeam = can(role, "staff:view")
  const canApprove = can(role, "disbursement:approve")
  const isTelecaller = role === "Telecaller"

  // A telecaller only ever loads their own incentive rows.
  const { incentives } = useStaffIncentives(canViewTeam ? undefined : viewer.ids)

  // The whole activity log is only needed for the Team Performance panel, which
  // Admins and Managers see. A telecaller was downloading every activity in the
  // organisation to render nothing with it.
  useEffect(() => {
    if (!canViewTeam) return
    const unsubscribe = onSnapshot(query(collection(db, "lead_activities")), snapshot => {
      setActivities(snapshot.docs.map(doc => doc.data()))
    })
    return () => unsubscribe()
  }, [canViewTeam])

  const pipeline = useMemo(() => {
    const todayStart = startOfDay(now)
    const disbursedLeads = leads.filter(l => l.status === STATUS_DISBURSED || l.status === "Converted")
    const mine = leads.filter(l => ownsLead(l, viewer))
    const openLeads = leads.filter(l => !CLOSED_STATUSES.includes(l.status))

    return {
      total: leads.length,
      today: leads.filter(l => (toMillis(l.createdAt) ?? 0) >= todayStart).length,
      unassigned: openLeads.filter(l => !l.assignedTo).length,
      assigned: leads.filter(l => !!l.assignedTo).length,
      pendingApproval: leads.filter(l => l.status === STATUS_PENDING_APPROVAL).length,
      disbursedCount: disbursedLeads.length,
      disbursedVolume: disbursedLeads.reduce(
        (s, l) => s + (toAmount(l.disbursedAmount) || toAmount(l.amount)),
        0
      ),
      processing: leads.filter(l =>
        ["Login to Bank", "Bank Processing"].includes(l.status)
      ).length,
      myLeads: mine.length,
      myDisbursed: mine.filter(l => l.status === STATUS_DISBURSED).length,
      myNew: mine.filter(l => l.status === "New Lead" || l.status === "New").length,
      conversionRate: leads.length ? Math.round((disbursedLeads.length / leads.length) * 100) : 0,
      incentivePool: leads
        .filter(l => l.status === STATUS_DISBURSED)
        .reduce((s, l) => s + (Number(l.staffIncentiveAmount) || 0), 0),
      commissionPool: leads
        .filter(l => l.status === STATUS_DISBURSED)
        .reduce((s, l) => s + (Number(l.connectorCommissionAmount) || 0), 0),
    }
  }, [leads, viewer, now])

  /**
   * Follow-ups that are due — overdue or scheduled before tonight. This is the
   * one list a telecaller opens the CRM for, so it sits above everything else.
   */
  const followUps = useMemo(() => {
    const cutoff = endOfDay(now)
    return leads
      .filter(l => {
        if (CLOSED_STATUSES.includes(l.status)) return false
        const due = toMillis(l.followUpDate)
        return due !== null && due <= cutoff
      })
      .sort((a, b) => (toMillis(a.followUpDate) ?? 0) - (toMillis(b.followUpDate) ?? 0))
  }, [leads, now])

  const overdueCount = useMemo(
    () => followUps.filter(l => (toMillis(l.followUpDate) ?? 0) <= now).length,
    [followUps, now]
  )

  /** Leads created and files disbursed per day, last 7 days. */
  const trend = useMemo(() => {
    const todayStart = startOfDay(now)
    const days = Array.from({ length: CHART_DAYS }, (_, i) => {
      const start = todayStart - (CHART_DAYS - 1 - i) * 86_400_000
      return { start, end: start + 86_400_000, label: formatDayShort(start), leads: 0, disbursed: 0 }
    })

    leads.forEach(lead => {
      const created = toMillis(lead.createdAt)
      const day = created === null ? undefined : days.find(d => created >= d.start && created < d.end)
      if (day) day.leads += 1

      if (lead.status === STATUS_DISBURSED) {
        const approved = toMillis(lead.approvedAt) ?? created
        const approvedDay =
          approved === null ? undefined : days.find(d => approved >= d.start && approved < d.end)
        if (approvedDay) approvedDay.disbursed += 1
      }
    })

    return days
  }, [leads, now])

  const leadSpark = useMemo(() => trend.map(d => d.leads), [trend])

  const loanMix = useMemo(() => {
    const byType: Record<string, number> = {}
    leads.forEach(lead => {
      const key = (lead.type || "Other").replace(" Loan", "")
      byType[key] = (byType[key] || 0) + 1
    })
    return Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [leads])

  // What this staff member has personally earned (telecaller view).
  const myIncentive = useMemo(
    () =>
      computeStaffPerformance(leads, incentives, {
        name: profile?.name || user?.displayName || user?.email || "",
        ids: viewer.ids,
      }).incentiveEarned,
    [leads, incentives, profile?.name, user?.displayName, user?.email, viewer]
  )

  // Bank-wise performance, from files a Manager actually signed off.
  const bankPerformance = useMemo(() => {
    const byBank: Record<string, { files: number; volume: number; incentive: number }> = {}
    leads.forEach(l => {
      if (l.status !== STATUS_DISBURSED || !l.bankName) return
      const row = byBank[l.bankName] || { files: 0, volume: 0, incentive: 0 }
      row.files += 1
      row.volume += toAmount(l.disbursedAmount)
      row.incentive += Number(l.staffIncentiveAmount) || 0
      byBank[l.bankName] = row
    })
    return Object.entries(byBank)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6)
  }, [leads])

  // Connector (DSA) contribution, admin/manager view.
  const connectorPerformance = useMemo(() => {
    const byPartner: Record<string, { leads: number; disbursed: number; commission: number }> = {}
    leads.forEach(l => {
      if (!l.partnerId) return
      const key = l.partnerName || l.dsaCode || "Connector"
      const row = byPartner[key] || { leads: 0, disbursed: 0, commission: 0 }
      row.leads += 1
      if (l.status === STATUS_DISBURSED) {
        row.disbursed += 1
        row.commission += Number(l.connectorCommissionAmount) || 0
      }
      byPartner[key] = row
    })
    return Object.entries(byPartner)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.disbursed - a.disbursed || b.leads - a.leads)
      .slice(0, 6)
  }, [leads])

  /** Average time each status transition takes, from `statusDurations`. */
  const velocity = useMemo(() => {
    const transitions: Record<string, { totalMs: number; count: number }> = {}

    leads.forEach(l => {
      if (!l.statusDurations) return
      Object.entries(l.statusDurations).forEach(([key, val]) => {
        if (!key.endsWith("_timeMs")) return
        const ms = Number(val)
        if (isNaN(ms)) return
        const name = key.replace("_timeMs", "")
        if (!transitions[name]) transitions[name] = { totalMs: 0, count: 0 }
        transitions[name].totalMs += ms
        transitions[name].count += 1
      })
    })

    return Object.entries(transitions)
      .map(([name, data]) => {
        const avgHrs = data.totalMs / data.count / 3_600_000
        const duration =
          avgHrs < 1
            ? `${Math.round(avgHrs * 60)} min`
            : avgHrs < 24
              ? `${avgHrs.toFixed(1)} hrs`
              : `${(avgHrs / 24).toFixed(1)} days`
        const [from, to] = name.split("To")
        return { name, from: from || "Stage A", to: to || "Stage B", duration, count: data.count, avgHrs }
      })
      .sort((a, b) => b.avgHrs - a.avgHrs)
      .slice(0, 6)
  }, [leads])

  const stats = useMemo(() => {
    if (isTelecaller) {
      return [
        { label: "My leads", value: pipeline.myLeads, hint: `${pipeline.myNew} new`, icon: Briefcase, tone: "info" as Tone, spark: leadSpark, href: "/admin/leads" },
        { label: "Follow-ups due", value: followUps.length, hint: overdueCount ? `${overdueCount} overdue` : "on schedule", icon: Clock, tone: (overdueCount ? "danger" : "neutral") as Tone, href: "/admin/leads" },
        { label: "Files disbursed", value: pipeline.myDisbursed, hint: `${pipeline.pendingApproval} awaiting sign-off`, icon: CheckCircle2, tone: "success" as const },
        { label: "Incentive earned", value: formatINRShort(myIncentive), hint: "approved disbursals only", icon: IndianRupee, tone: "violet" as const },
      ]
    }

    if (role === "Manager") {
      return [
        { label: "Awaiting your sign-off", value: pipeline.pendingApproval, hint: "verify, then release incentive", icon: CheckCircle2, tone: (pipeline.pendingApproval ? "warn" : "neutral") as Tone, href: "/admin/approvals" },
        { label: "Team leads", value: pipeline.total, hint: `${pipeline.today} today`, icon: Users, tone: "info" as Tone, spark: leadSpark, href: "/admin/leads" },
        { label: "Files disbursed", value: pipeline.disbursedCount, hint: formatINRShort(pipeline.disbursedVolume), icon: Landmark, tone: "success" as const },
        { label: "Conversion", value: `${pipeline.conversionRate}%`, hint: `${pipeline.processing} in process`, icon: TrendingUp, tone: "violet" as const },
      ]
    }

    return [
      { label: "Total leads", value: pipeline.total, hint: `${pipeline.today} today`, icon: Users, tone: "info" as Tone, spark: leadSpark, href: "/admin/leads" },
      { label: "Unassigned pool", value: pipeline.unassigned, hint: `${pipeline.assigned} assigned`, icon: UserPlus, tone: (pipeline.unassigned ? "warn" : "neutral") as Tone, href: "/admin/leads" },
      { label: "Files disbursed", value: pipeline.disbursedCount, hint: `${pipeline.conversionRate}% conversion`, icon: CheckCircle2, tone: "success" as const },
      { label: "Disbursed volume", value: formatINRShort(pipeline.disbursedVolume), hint: "confirmed disbursals", icon: Banknote, tone: "violet" as const },
    ]
  }, [isTelecaller, role, pipeline, followUps.length, overdueCount, myIncentive, leadSpark])

  const followUpColumns: Column<Lead>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Customer",
        card: "title",
        cell: lead => (
          <span className="font-medium">{lead.name || lead.fullName || "Unnamed lead"}</span>
        ),
        sortValue: lead => lead.name || lead.fullName || "",
      },
      {
        id: "phone",
        header: "Phone",
        card: "meta",
        cell: lead => {
          const phone = lead.phone || lead.mobile
          return phone ? (
            <a
              href={`tel:${phone}`}
              onClick={e => e.stopPropagation()}
              className="admin-focus admin-num inline-flex items-center gap-1.5 text-admin-accent hover:underline"
            >
              <Phone size={12} />
              {phone}
            </a>
          ) : (
            <span className="text-admin-subtle">—</span>
          )
        },
      },
      {
        id: "due",
        header: "Due",
        card: "meta",
        sortValue: lead => toMillis(lead.followUpDate) ?? 0,
        cell: lead => {
          const due = toMillis(lead.followUpDate)
          const isOverdue = due !== null && due <= now
          return (
            <span className={isOverdue ? "text-tone-danger-fg font-medium" : "text-admin-muted"}>
              {timeAgo(lead.followUpDate, now) || "—"}
            </span>
          )
        },
      },
      {
        id: "reason",
        header: "Reason",
        card: "meta",
        defaultHidden: true,
        cell: lead => <span className="text-admin-muted">{lead.followUpReason || "—"}</span>,
      },
      {
        id: "owner",
        header: "Owner",
        card: "meta",
        defaultHidden: isTelecaller,
        cell: lead => (
          <span className="text-admin-muted">{lead.assignedToName || "Unassigned"}</span>
        ),
        sortValue: lead => lead.assignedToName || "",
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        cell: lead => <StatusBadge status={lead.status} dot />,
        sortValue: lead => lead.status,
      },
    ],
    [now, isTelecaller]
  )

  const greeting = profile?.name || user?.displayName || user?.email || "there"

  return (
    <div className="space-y-2.5">
      <PageHeader
        title={isTelecaller ? "My dashboard" : role === "Manager" ? "Team dashboard" : "Overview"}
        subtitle={
          isTelecaller
            ? `Welcome back, ${greeting}. Here are your leads and follow-ups.`
            : role === "Manager"
              ? `Welcome back, ${greeting}. Here is how the team is tracking today.`
              : `Welcome back, ${greeting}. Here is what is happening across the business.`
        }
        actions={
          <>
            <AdminLinkButton href="/admin/leads" icon={Briefcase} size="sm">
              Open leads
            </AdminLinkButton>
            {canViewTeam && (
              <AdminLinkButton href="/admin/reports" icon={BarChart3} size="sm" variant="primary">
                Reports
              </AdminLinkButton>
            )}
          </>
        }
      />

      {/* Disbursal sign-off callout */}
      {pipeline.pendingApproval > 0 &&
        (canApprove ? (
          <Link
            href="/admin/approvals"
            className="admin-focus flex items-center gap-3 p-3.5 bg-tone-warn border border-tone-warn-bd rounded-admin hover:brightness-[0.98] transition-all group"
          >
            <span className="w-9 h-9 rounded-admin-sm bg-admin-surface border border-tone-warn-bd text-tone-warn-fg flex items-center justify-center shrink-0">
              <Clock size={17} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-admin-sm font-semibold text-tone-warn-fg">
                {pipeline.pendingApproval} disbursal{pipeline.pendingApproval !== 1 ? "s" : ""} waiting on your approval
              </span>
              <span className="block text-admin-xs text-tone-warn-fg/80 mt-0.5">
                Verify the file, pick the bank and release the incentive.
              </span>
            </span>
            <ArrowUpRight
              size={17}
              className="text-tone-warn-fg shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-3 p-3.5 bg-tone-warn border border-tone-warn-bd rounded-admin">
            <span className="w-9 h-9 rounded-admin-sm bg-admin-surface border border-tone-warn-bd text-tone-warn-fg flex items-center justify-center shrink-0">
              <Clock size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-admin-sm font-semibold text-tone-warn-fg">
                {pipeline.pendingApproval} of your file{pipeline.pendingApproval !== 1 ? "s are" : " is"} awaiting manager approval
              </span>
              <span className="block text-admin-xs text-tone-warn-fg/80 mt-0.5">
                Incentive is credited once a Manager confirms the disbursal.
              </span>
            </span>
          </div>
        ))}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            tone={stat.tone}
            spark={"spark" in stat ? stat.spark : undefined}
            href={"href" in stat ? stat.href : undefined}
            loading={loading}
          />
        ))}
      </div>

      {/* The working list: what needs a call today. */}
      <section>
        <div className="flex items-baseline justify-between mb-2.5">
          <h2 className="text-admin-lg font-semibold text-admin-text">
            {isTelecaller ? "Your follow-ups due" : "Follow-ups due"}
          </h2>
          {followUps.length > 0 && (
            <span className="admin-num text-admin-xs text-admin-muted">
              {overdueCount} overdue · {followUps.length} total
            </span>
          )}
        </div>
        <DataTable
          columns={followUpColumns}
          rows={followUps.slice(0, 8)}
          getRowId={lead => lead.id}
          loading={loading}
          columnPicker={false}
          initialSort={{ columnId: "due", direction: "asc" }}
          emptyTitle="No follow-ups due"
          emptyDescription="Nothing is scheduled for today. Anything overdue would show up here."
        />
      </section>

      {canViewTeam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="Incentive released"
            value={formatINR(pipeline.incentivePool)}
            hint="paid to staff on approved disbursals"
            icon={IndianRupee}
            tone="success"
            loading={loading}
          />
          <StatCard
            label="Commission payable"
            value={formatINR(pipeline.commissionPool)}
            hint="owed to connectors"
            icon={Network}
            tone="info"
            href="/admin/payouts"
            loading={loading}
          />
          <StatCard
            label="Unassigned pool"
            value={pipeline.unassigned}
            hint="claimed by the first telecaller to make contact"
            icon={UserPlus}
            tone={pipeline.unassigned ? "warn" : "neutral"}
            href="/admin/leads"
            loading={loading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel
          className="lg:col-span-2"
          title="Leads & disbursals"
          subtitle={`Last ${CHART_DAYS} days`}
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.leads} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART.leads} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.disbursed} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={CHART.disbursed} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART.tick, fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART.tick, fontSize: 11 }}
                  width={40}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
                <Area
                  type="monotone"
                  name="Leads created"
                  dataKey="leads"
                  stroke={CHART.leads}
                  strokeWidth={2}
                  fill="url(#fillLeads)"
                />
                <Area
                  type="monotone"
                  name="Files disbursed"
                  dataKey="disbursed"
                  stroke={CHART.disbursed}
                  strokeWidth={2}
                  fill="url(#fillDisbursed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recent leads" subtitle="Newest first" action={<Link href="/admin/leads" className="admin-focus text-admin-xs font-semibold text-admin-accent hover:underline">View all</Link>}>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState size="sm" title="No leads yet" description="New enquiries land here in real time." />
          ) : (
            <ul className="divide-y divide-admin-border -my-1.5">
              {leads.slice(0, 6).map(lead => (
                <li key={lead.id} className="py-2 flex items-center gap-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-admin-sm text-admin-text truncate">
                      {lead.name || lead.fullName || "Unnamed lead"}
                    </span>
                    <span className="block text-admin-2xs text-admin-subtle truncate">
                      {lead.type || "Loan"} · {timeAgo(lead.createdAt, now) || "just now"}
                    </span>
                  </span>
                  <StatusBadge status={lead.status} dot />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Loan type mix" subtitle="All visible leads">
          {loanMix.length === 0 ? (
            <EmptyState size="sm" title="Nothing to plot yet" />
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanMix} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART.tick, fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART.tick, fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--admin-surface-2)" }} />
                  <Bar dataKey="value" name="Leads" fill={CHART.bars[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {canViewTeam ? (
          <Panel
            title="Team activity"
            subtitle="Calls and status updates logged"
            action={
              can(role, "staff:manage") ? (
                <Link href="/admin/users" className="admin-focus text-admin-xs font-semibold text-admin-accent hover:underline">
                  Manage team
                </Link>
              ) : undefined
            }
          >
            {adminUsers.length === 0 ? (
              <EmptyState size="sm" title="No team members yet" />
            ) : (
              <ul className="divide-y divide-admin-border -my-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {adminUsers.map(member => {
                  const calls = activities.filter(
                    a => a.type === "Call" && (a.userName || "").includes(member.name)
                  ).length
                  const updates = activities.filter(
                    a => a.type === "Status Update" && (a.userName || "").includes(member.name)
                  ).length
                  return (
                    <li key={member.id} className="py-2 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-muted flex items-center justify-center text-admin-2xs font-semibold uppercase shrink-0">
                        {member.name.substring(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-admin-sm text-admin-text truncate">{member.name}</span>
                        <span className="block text-admin-2xs text-admin-subtle truncate">{member.role}</span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="admin-num block text-admin-sm text-admin-text">{calls}</span>
                        <span className="block text-admin-2xs text-admin-subtle">calls</span>
                      </span>
                      <span className="text-right shrink-0 w-14">
                        <span className="admin-num block text-admin-sm text-admin-text">{updates}</span>
                        <span className="block text-admin-2xs text-admin-subtle">updates</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        ) : (
          <Panel title="Stage velocity" subtitle="Average time between statuses">
            <VelocityList items={velocity} />
          </Panel>
        )}
      </div>

      {canViewTeam && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Bank-wise performance" subtitle="Confirmed disbursals by lender">
              {bankPerformance.length === 0 ? (
                <EmptyState size="sm" title="No approved disbursals yet" />
              ) : (
                <ul className="divide-y divide-admin-border -my-1.5">
                  {bankPerformance.map(bank => (
                    <li key={bank.name} className="py-2 flex items-center gap-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-admin-sm text-admin-text truncate">{bank.name}</span>
                        <span className="block text-admin-2xs text-admin-subtle truncate">
                          {bank.files} file{bank.files !== 1 ? "s" : ""} · incentive{" "}
                          {formatINRShort(bank.incentive)}
                        </span>
                      </span>
                      <span className="admin-num text-admin-sm font-semibold text-admin-text shrink-0">
                        {formatINRShort(bank.volume)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Connector performance" subtitle="Leads sourced by DSA partners">
              {connectorPerformance.length === 0 ? (
                <EmptyState size="sm" title="No connector leads yet" />
              ) : (
                <ul className="divide-y divide-admin-border -my-1.5">
                  {connectorPerformance.map(partner => (
                    <li key={partner.name} className="py-2 flex items-center gap-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-admin-sm text-admin-text truncate">{partner.name}</span>
                        <span className="block text-admin-2xs text-admin-subtle truncate">
                          {partner.leads} lead{partner.leads !== 1 ? "s" : ""} · {partner.disbursed} disbursed
                        </span>
                      </span>
                      <span className="admin-num text-admin-sm font-semibold text-admin-text shrink-0">
                        {formatINRShort(partner.commission)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Stage velocity" subtitle="Slowest transitions first — where files stall">
            <VelocityList items={velocity} />
          </Panel>
        </>
      )}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-4 min-w-0 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="min-w-0">
          <h3 className="text-admin-base font-semibold text-admin-text truncate">{title}</h3>
          {subtitle && <p className="text-admin-xs text-admin-subtle mt-0.5 truncate">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}

function VelocityList({
  items,
}: {
  items: { name: string; from: string; to: string; duration: string; count: number }[]
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={Timer}
        title="No transition history yet"
        description="Timings appear here once leads start moving between statuses."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map(item => (
        <div
          key={item.name}
          className="bg-admin-surface-2 border border-admin-border rounded-admin-sm p-3"
        >
          <p className="text-admin-2xs uppercase tracking-wide text-admin-subtle truncate">
            {item.from} → {item.to}
          </p>
          <p className="admin-num text-admin-lg font-semibold text-admin-text mt-1">{item.duration}</p>
          <p className="text-admin-2xs text-admin-subtle mt-0.5">
            {item.count} transition{item.count !== 1 ? "s" : ""}
          </p>
        </div>
      ))}
    </div>
  )
}
