"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Download, Loader2, RefreshCw, Search } from "lucide-react"
import { authedFetch } from "@/lib/authedFetch"
import { CountRow, StatusPill } from "@/components/admin/campaigns/CampaignBits"
import { displayPhone, type CampaignCounts } from "@/lib/waCampaignShared"

/**
 * One campaign's report.
 *
 * The page reads what is already stored and stops there. Nothing recalculates
 * and no WhatsApp API call is made just because the report was opened — that is
 * what the Refresh button is for, and it is the only thing on this screen that
 * goes back to the server for fresh numbers. There is no polling here at all.
 */

interface Slot {
  status: string
  messageId: string
  error: string
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  failedAt: string | null
}

interface Recipient {
  id: string
  index: number
  row: number
  phone: string
  name: string
  done: boolean
  m1: Slot
  m2: Slot
}

interface Campaign {
  id: string
  name: string
  status: string
  createdAt: string | null
  finishedAt: string | null
  createdByName: string
  totalRecipients: number
  totalMessages: number
  processed: number
  invalidCount: number
  counts: CampaignCounts
  refreshedAt: string | null
  lastError: string
  message1: { enabled: boolean; templateName: string; mode: string }
  message2: { enabled: boolean; templateName: string; mode: string }
}

const CARD = "rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"

export default function CampaignReportPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id || ""

  const [campaign, setCampaign] = React.useState<Campaign | null>(null)
  const [recipients, setRecipients] = React.useState<Recipient[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState("all")

  /** Reads stored data only — this is what the page loads with. */
  const load = React.useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const response = await authedFetch(`/api/admin/wa-campaigns/${id}?limit=1000`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Could not load the report.")
      setCampaign(result.campaign)
      setRecipients(result.recipients || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the report.")
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void load()
  }, [load])

  /** The only path that recalculates anything. Explicit, on click, never automatic. */
  const refresh = async () => {
    setRefreshing(true)
    try {
      await authedFetch(`/api/admin/wa-campaigns/${id}/refresh`, { method: "POST" })
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const rows = React.useMemo(() => {
    const text = query.trim().toLowerCase()
    return recipients.filter(recipient => {
      if (text) {
        const haystack = `${recipient.name} ${recipient.phone}`.toLowerCase()
        if (!haystack.includes(text)) return false
      }
      if (filter === "all") return true
      return recipient.m1.status === filter || recipient.m2.status === filter
    })
  }, [recipients, query, filter])

  const exportCsv = () => {
    const header = [
      "Row",
      "Name",
      "Mobile",
      "M1 Status",
      "M1 Message ID",
      "M1 Sent",
      "M1 Delivered",
      "M1 Read",
      "M1 Failed",
      "M1 Error",
      "M2 Status",
      "M2 Message ID",
      "M2 Sent",
      "M2 Delivered",
      "M2 Read",
      "M2 Failed",
      "M2 Error",
    ]
    const escape = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`
    const lines = [header.join(",")]
    rows.forEach(r => {
      lines.push(
        [
          r.row,
          r.name,
          r.phone,
          r.m1.status,
          r.m1.messageId,
          r.m1.sentAt || "",
          r.m1.deliveredAt || "",
          r.m1.readAt || "",
          r.m1.failedAt || "",
          r.m1.error,
          r.m2.status,
          r.m2.messageId,
          r.m2.sentAt || "",
          r.m2.deliveredAt || "",
          r.m2.readAt || "",
          r.m2.failedAt || "",
          r.m2.error,
        ]
          .map(v => escape(String(v)))
          .join(",")
      )
    })

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${campaign?.name || "campaign"}-report.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !campaign) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={26} />
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className={CARD}>
        <p className="text-sm font-bold text-rose-600">{error}</p>
        <Link href="/admin/automation" className="mt-4 inline-block text-sm font-black text-primary">
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/automation"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-primary"
          >
            <ArrowLeft size={14} /> Campaigns
          </Link>
          <h1 className="truncate text-2xl font-black tracking-tight text-secondary sm:text-3xl">
            {campaign?.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <StatusPill status={campaign?.status || "queued"} />
            <span>Created {when(campaign?.createdAt || null)}</span>
            {campaign?.createdByName && <span>by {campaign.createdByName}</span>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 hover:border-primary hover:text-primary"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/20 disabled:bg-slate-300 disabled:shadow-none"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Summary</h2>
          <p className="text-[11px] font-medium text-slate-400">
            {campaign?.refreshedAt
              ? `Last refreshed ${when(campaign.refreshedAt)}`
              : "Showing stored figures — press Refresh for the latest."}
          </p>
        </div>

        <CountRow
          counts={campaign?.counts || { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 }}
          total={campaign?.totalMessages || 0}
        />

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-medium text-slate-500 sm:grid-cols-4">
          <p>
            Recipients: <span className="font-black text-secondary">{campaign?.totalRecipients}</span>
          </p>
          <p>
            Processed: <span className="font-black text-secondary">{campaign?.processed}</span>
          </p>
          <p>
            Skipped rows:{" "}
            <span className="font-black text-secondary">{campaign?.invalidCount || 0}</span>
          </p>
          <p>
            Finished: <span className="font-black text-secondary">{when(campaign?.finishedAt || null)}</span>
          </p>
        </div>

        {campaign?.lastError && (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {campaign.lastError}
          </p>
        )}
      </section>

      <section className={CARD}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Recipient log
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:border-primary sm:w-56"
                placeholder="Name or number"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 outline-none focus:border-primary"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Mobile</th>
                <th className="py-3 pr-4">Message 1</th>
                <th className="py-3 pr-4">Sent / Delivered / Read</th>
                <th className="py-3 pr-4">Message 2</th>
                <th className="py-3 pr-4">Sent / Delivered / Read</th>
                <th className="py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(recipient => (
                <tr key={recipient.id} className="align-top">
                  <td className="py-3 pr-4 font-black text-secondary">{recipient.name || "—"}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                    {displayPhone(recipient.phone)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill status={recipient.m1.status} />
                  </td>
                  <td className="py-3 pr-4 text-[11px] font-medium text-slate-500">
                    {when(recipient.m1.sentAt)} / {when(recipient.m1.deliveredAt)} /{" "}
                    {when(recipient.m1.readAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill status={recipient.m2.status} />
                  </td>
                  <td className="py-3 pr-4 text-[11px] font-medium text-slate-500">
                    {when(recipient.m2.sentAt)} / {when(recipient.m2.deliveredAt)} /{" "}
                    {when(recipient.m2.readAt)}
                  </td>
                  <td className="py-3 text-[11px] font-medium text-rose-600">
                    {recipient.m1.error || recipient.m2.error || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-slate-400">
            No recipients match that filter.
          </p>
        )}

        {recipients.length >= 1000 && (
          <p className="mt-3 text-[11px] font-bold text-slate-400">
            Showing the first 1,000 recipients. Export the CSV for the full list.
          </p>
        )}
      </section>
    </div>
  )
}
