"use client"

import React, { useMemo } from "react"
import { Banknote, Briefcase, Download, ShieldCheck, TrendingUp, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useAuth } from "@/context/AuthContext"
import { useLeads } from "@/lib/hooks/useLeads"
import { useUsers } from "@/lib/hooks/useUsers"
import { useNow } from "@/lib/hooks/useNow"
import { can } from "@/lib/permissions"
import { formatINR, formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import { computeStaffPerformance, useStaffIncentives } from "@/lib/hooks/useStaffPerformance"
import { STATUS_DISBURSED } from "@/lib/disbursement"
import { formatDayShort, startOfDay, toMillis } from "@/lib/dates"
import {
  AdminButton,
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/admin/ui"

const WEEKS = 6
const WEEK_MS = 7 * 86_400_000

const CHART = {
  grid: "var(--admin-border)",
  tick: "var(--admin-text-subtle)",
  bar: "var(--admin-accent)",
  slices: [
    "var(--tone-info-fg)",
    "var(--tone-violet-fg)",
    "var(--tone-cyan-fg)",
    "var(--tone-warn-fg)",
    "var(--tone-success-fg)",
    "var(--tone-neutral-fg)",
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

interface StaffRow {
  id: string
  name: string
  role: string
  assigned: number
  converted: number
  disbursed: number
  disbursedVolume: number
  incentiveEarned: number
  conversionRate: number
  pendingApproval: number
}

/**
 * Every figure here is derived from confirmed disbursals in Firestore.
 * The previous version of this screen rendered hardcoded sample revenue and a
 * list of downloadable report files that did not exist.
 */
export default function ReportsPage() {
  const { role } = useAuth()
  const { leads, loading } = useLeads()
  const { users } = useUsers()
  const { incentives } = useStaffIncentives()
  const now = useNow()

  const canView = can(role, "reports:view")

  const disbursedLeads = useMemo(
    () => leads.filter(lead => lead.status === STATUS_DISBURSED),
    [leads]
  )

  const totals = useMemo(() => {
    const volume = disbursedLeads.reduce((sum, lead) => sum + toAmount(lead.disbursedAmount), 0)
    const incentive = disbursedLeads.reduce(
      (sum, lead) => sum + (Number(lead.staffIncentiveAmount) || 0),
      0
    )
    const commission = disbursedLeads.reduce(
      (sum, lead) => sum + (Number(lead.connectorCommissionAmount) || 0),
      0
    )
    return {
      volume,
      incentive,
      commission,
      files: disbursedLeads.length,
      avgTicket: disbursedLeads.length ? volume / disbursedLeads.length : 0,
      conversion: leads.length ? Math.round((disbursedLeads.length / leads.length) * 100) : 0,
    }
  }, [disbursedLeads, leads.length])

  /** Disbursed volume per week for the last six weeks. */
  const weekly = useMemo(() => {
    const todayStart = startOfDay(now)
    const buckets = Array.from({ length: WEEKS }, (_, i) => {
      const start = todayStart - (WEEKS - 1 - i) * WEEK_MS
      return { start, end: start + WEEK_MS, label: formatDayShort(start), volume: 0, files: 0 }
    })

    disbursedLeads.forEach(lead => {
      const at = toMillis(lead.approvedAt) ?? toMillis(lead.createdAt)
      if (at === null) return
      const bucket = buckets.find(b => at >= b.start && at < b.end)
      if (!bucket) return
      bucket.volume += toAmount(lead.disbursedAmount)
      bucket.files += 1
    })

    return buckets
  }, [disbursedLeads, now])

  const productMix = useMemo(() => {
    const byType: Record<string, number> = {}
    disbursedLeads.forEach(lead => {
      const key = (lead.type || "Other").replace(" Loan", "")
      byType[key] = (byType[key] || 0) + toAmount(lead.disbursedAmount)
    })
    return Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [disbursedLeads])

  const staffRows = useMemo<StaffRow[]>(
    () =>
      users
        .filter(member => member.status !== "Inactive")
        .map(member => {
          const perf = computeStaffPerformance(leads, incentives, { name: member.name, ids: [member.uid, member.id] })
          return { id: member.id, name: member.name, role: member.role, ...perf }
        })
        .sort((a, b) => b.disbursedVolume - a.disbursedVolume),
    [users, leads, incentives]
  )

  const staffColumns: Column<StaffRow>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Staff",
        card: "title",
        sortValue: row => row.name,
        cell: row => (
          <span className="min-w-0 block">
            <span className="block font-medium truncate">{row.name}</span>
            <span className="block text-admin-2xs text-admin-subtle truncate">{row.role}</span>
          </span>
        ),
      },
      {
        id: "assigned",
        header: "Assigned",
        align: "right",
        card: "meta",
        sortValue: row => row.assigned,
        cell: row => row.assigned,
      },
      {
        id: "converted",
        header: "Converted",
        align: "right",
        card: "meta",
        sortValue: row => row.converted,
        cell: row => row.converted,
      },
      {
        id: "disbursed",
        header: "Disbursed",
        align: "right",
        card: "meta",
        sortValue: row => row.disbursed,
        cell: row => row.disbursed,
      },
      {
        id: "rate",
        header: "Conversion",
        align: "right",
        card: "meta",
        sortValue: row => row.conversionRate,
        cell: row => `${row.conversionRate}%`,
      },
      {
        id: "volume",
        header: "Volume",
        align: "right",
        card: "meta",
        sortValue: row => row.disbursedVolume,
        cell: row => formatINRShort(row.disbursedVolume),
      },
      {
        id: "incentive",
        header: "Incentive",
        align: "right",
        card: "trailing",
        sortValue: row => row.incentiveEarned,
        cell: row => formatINR(row.incentiveEarned),
      },
    ],
    []
  )

  const exportCsv = () => {
    const headers = [
      "Staff",
      "Role",
      "Assigned",
      "Converted",
      "Disbursed",
      "Conversion %",
      "Disbursed volume",
      "Incentive earned",
      "Awaiting approval",
    ]
    const lines = staffRows.map(row =>
      [
        row.name,
        row.role,
        row.assigned,
        row.converted,
        row.disbursed,
        row.conversionRate,
        Math.round(row.disbursedVolume),
        Math.round(row.incentiveEarned),
        row.pendingApproval,
      ]
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )

    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `techstar_team_report_${new Date(now).toISOString().split("T")[0]}.csv`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  if (!canView) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Managers and Admins only"
        description="Team performance reports are available to Managers and Administrators."
      />
    )
  }

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Revenue & reports"
        subtitle="Every figure below is computed from confirmed disbursals — nothing here is a sample."
        actions={
          <AdminButton size="sm" icon={Download} onClick={exportCsv} disabled={staffRows.length === 0}>
            Export team CSV
          </AdminButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Disbursed volume"
          value={formatINRShort(totals.volume)}
          hint={`${totals.files} files`}
          icon={Banknote}
          tone="success"
          spark={weekly.map(week => week.volume)}
          loading={loading}
        />
        <StatCard
          label="Average ticket"
          value={formatINRShort(totals.avgTicket)}
          hint="per disbursed file"
          icon={TrendingUp}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Incentive released"
          value={formatINRShort(totals.incentive)}
          hint="paid to staff"
          icon={Users}
          tone="violet"
          loading={loading}
        />
        <StatCard
          label="Conversion"
          value={`${totals.conversion}%`}
          hint={`${leads.length} leads total`}
          icon={Briefcase}
          tone="warn"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="lg:col-span-2 bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-4">
          <h2 className="text-admin-base font-semibold text-admin-text">Disbursed volume</h2>
          <p className="text-admin-xs text-admin-subtle mt-0.5 mb-3.5">Last {WEEKS} weeks</p>
          {totals.files === 0 ? (
            <EmptyState size="sm" title="No confirmed disbursals yet" />
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART.tick, fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART.tick, fontSize: 11 }}
                    tickFormatter={value => formatINRShort(Number(value))}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--admin-surface-2)" }}
                    formatter={(value: unknown) => formatINR(Number(value))}
                  />
                  <Bar dataKey="volume" name="Disbursed" fill={CHART.bar} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-4">
          <h2 className="text-admin-base font-semibold text-admin-text">Product mix</h2>
          <p className="text-admin-xs text-admin-subtle mt-0.5 mb-3.5">Share of disbursed volume</p>
          {productMix.length === 0 ? (
            <EmptyState size="sm" title="Nothing to plot yet" />
          ) : (
            <>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="85%"
                      stroke="var(--admin-surface)"
                      strokeWidth={2}
                    >
                      {productMix.map((slice, index) => (
                        <Cell key={slice.name} fill={CHART.slices[index % CHART.slices.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: unknown) => formatINR(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {productMix.map((slice, index) => (
                  <li key={slice.name} className="flex items-center gap-2 text-admin-xs">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: CHART.slices[index % CHART.slices.length] }}
                    />
                    <span className="text-admin-text flex-1 truncate">{slice.name}</span>
                    <span className="admin-num text-admin-muted">{formatINRShort(slice.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="space-y-2.5">
        <h2 className="text-admin-base font-semibold text-admin-text">Team performance</h2>
        <DataTable
          columns={staffColumns}
          rows={staffRows}
          getRowId={row => row.id}
          loading={loading}
          initialSort={{ columnId: "volume", direction: "desc" }}
          emptyTitle="No active staff"
          emptyDescription="Add team members to see performance here."
        />
      </section>
    </div>
  )
}
