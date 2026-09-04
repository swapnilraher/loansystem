"use client"

import React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Send,
  Sheet,
  Users,
  X,
} from "lucide-react"
import { authedFetch, authedJson } from "@/lib/authedFetch"
import MessageComposer from "@/components/admin/campaigns/MessageComposer"
import { CountRow, StatusPill } from "@/components/admin/campaigns/CampaignBits"
import {
  displayPhone,
  emptyMessage,
  normalizePhone,
  previewMessage,
  validateMessage,
  type CampaignMessage,
  type CampaignRecipient,
  type CampaignSummary,
  type InvalidRecipient,
  type WaTemplate,
} from "@/lib/waCampaignShared"

/**
 * WhatsApp Bulk Messaging.
 *
 * This replaces the static "AI & Automation Engine" mock that used to live at
 * this route — every number and toggle on that page was hard-coded and nothing
 * it showed was real, so there was nothing to preserve.
 *
 * The flow is deliberately linear: upload a sheet, say which column is the
 * phone number and which is the name, compose one or two messages, look at a
 * preview built by the same code that will do the sending, then send. Sending
 * itself happens on the server — this page only starts it and then watches the
 * progress counters.
 */

const CARD = "rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
const FIELD =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"

interface SheetState {
  fileName: string
  columns: string[]
  rows: Record<string, unknown>[]
}

/** Best guess at which columns hold the number and the name. */
function guessColumn(columns: string[], kind: "mobile" | "name"): string {
  const patterns =
    kind === "mobile"
      ? ["mobile", "phone", "whatsapp", "contact", "number", "cell"]
      : ["name", "customer", "client", "first"]
  for (const pattern of patterns) {
    const hit = columns.find(c => c.toLowerCase().replace(/[^a-z]/g, "").includes(pattern))
    if (hit) return hit
  }
  return ""
}

export default function WhatsAppCampaignsPage() {
  const [sheet, setSheet] = React.useState<SheetState | null>(null)
  const [parsing, setParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState("")
  const [mobileColumn, setMobileColumn] = React.useState("")
  const [nameColumn, setNameColumn] = React.useState("")

  const [campaignName, setCampaignName] = React.useState("")
  const [message1, setMessage1] = React.useState<CampaignMessage>(() => emptyMessage(true))
  const [message2, setMessage2] = React.useState<CampaignMessage>(() => emptyMessage(false))

  const [templates, setTemplates] = React.useState<WaTemplate[]>([])
  const [templateError, setTemplateError] = React.useState("")
  const [loadingTemplates, setLoadingTemplates] = React.useState(true)

  const [showPreview, setShowPreview] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [sendError, setSendError] = React.useState("")
  const [liveId, setLiveId] = React.useState("")
  const [live, setLive] = React.useState<CampaignSummary | null>(null)

  const [history, setHistory] = React.useState<CampaignSummary[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(true)

  const loadTemplates = React.useCallback(async () => {
    setLoadingTemplates(true)
    setTemplateError("")
    try {
      const response = await authedFetch("/api/admin/wa-campaigns/templates")
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Could not load templates.")
      setTemplates(result.templates || [])
    } catch (error) {
      setTemplateError(error instanceof Error ? error.message : "Could not load templates.")
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  const loadHistory = React.useCallback(async () => {
    setLoadingHistory(true)
    try {
      const response = await authedFetch("/api/admin/wa-campaigns")
      const result = await response.json()
      if (result.success) setHistory(result.campaigns || [])
    } catch {
      // The builder still works without the history list.
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  React.useEffect(() => {
    void loadTemplates()
    void loadHistory()
  }, [loadTemplates, loadHistory])

  // ─── Sheet parsing ──────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    setParsing(true)
    setParseError("")
    setSendError("")
    try {
      // `xlsx` is a large dependency and only this screen needs it, so it is
      // pulled in on demand rather than shipped with the admin bundle.
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error("That file has no sheets.")

      // `raw: false` hands back the cell's displayed text, which keeps a long
      // mobile number from arriving as 9.19877e+11.
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
        raw: false,
      })
      if (rows.length === 0) throw new Error("That sheet has no rows.")

      const columns = Object.keys(rows[0])
      setSheet({ fileName: file.name, columns, rows })
      setMobileColumn(guessColumn(columns, "mobile"))
      setNameColumn(guessColumn(columns, "name"))
      if (!campaignName) setCampaignName(file.name.replace(/\.[^.]+$/, ""))
    } catch (error) {
      setSheet(null)
      setParseError(error instanceof Error ? error.message : "Could not read that file.")
    } finally {
      setParsing(false)
    }
  }

  /** Rows split into what will be sent and what will not, recomputed on mapping. */
  const { valid, invalid } = React.useMemo(() => {
    const valid: CampaignRecipient[] = []
    const invalid: InvalidRecipient[] = []
    if (!sheet || !mobileColumn) return { valid, invalid }

    const seen = new Set<string>()
    sheet.rows.forEach((row, index) => {
      const raw = row[mobileColumn]
      const name = String(nameColumn ? row[nameColumn] ?? "" : "").trim()
      const { phone, reason } = normalizePhone(raw)
      if (!phone) {
        invalid.push({ row: index + 2, raw: String(raw ?? ""), name, reason })
        return
      }
      if (seen.has(phone)) {
        invalid.push({ row: index + 2, raw: String(raw ?? ""), name, reason: "Duplicate number" })
        return
      }
      seen.add(phone)
      valid.push({ phone, name, row: index + 2 })
    })

    return { valid, invalid }
  }, [sheet, mobileColumn, nameColumn])

  // ─── Validation ─────────────────────────────────────────────────────────────

  const template1 =
    templates.find(t => t.name === message1.templateName && t.language === message1.templateLanguage) ||
    templates.find(t => t.name === message1.templateName)
  const template2 =
    templates.find(t => t.name === message2.templateName && t.language === message2.templateLanguage) ||
    templates.find(t => t.name === message2.templateName)

  const blocker = React.useMemo(() => {
    if (!sheet) return "Upload an Excel or CSV file."
    if (!mobileColumn) return "Choose the Mobile Number column."
    if (valid.length === 0) return "No valid mobile numbers in this file."
    if (!message1.enabled && !message2.enabled) return "Turn on Message 1, Message 2, or both."
    return (
      validateMessage(message1, "Message 1", template1) ||
      validateMessage(message2, "Message 2", template2)
    )
  }, [sheet, mobileColumn, valid.length, message1, message2, template1, template2])

  const sample = valid[0] || { phone: "919999999999", name: "Rahul" }
  const preview1 = previewMessage(message1, sample, template1)
  const preview2 = previewMessage(message2, sample, template2)

  // ─── Sending ────────────────────────────────────────────────────────────────

  const send = async () => {
    if (blocker) return
    setSending(true)
    setSendError("")
    try {
      const response = await authedJson("/api/admin/wa-campaigns", "POST", {
        name: campaignName.trim(),
        mobileColumn,
        nameColumn,
        message1,
        message2,
        recipients: valid,
        invalidCount: invalid.length,
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Could not start the campaign.")

      setShowPreview(false)
      setLiveId(result.campaignId)
      void loadHistory()
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Could not start the campaign.")
    } finally {
      setSending(false)
    }
  }

  /**
   * Progress polling, and the one place on this screen that fetches on a timer.
   * It runs only while a campaign this page started is still sending, and it
   * reads a single stored document — the report page never polls at all.
   */
  React.useEffect(() => {
    if (!liveId) return
    let cancelled = false

    const tick = async () => {
      try {
        const response = await authedFetch(`/api/admin/wa-campaigns/${liveId}?view=progress`)
        const result = await response.json()
        if (cancelled || !result.success) return
        setLive(result.campaign)
        if (result.campaign.status === "completed" || result.campaign.status === "cancelled") {
          void loadHistory()
          return
        }
      } catch {
        // A missed poll is harmless; the next one catches up.
      }
      if (!cancelled) timer = setTimeout(tick, 3000)
    }

    let timer = setTimeout(tick, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [liveId, loadHistory])

  const cancelLive = async () => {
    if (!liveId) return
    await authedJson(`/api/admin/wa-campaigns/${liveId}`, "PATCH", { action: "cancel" })
  }

  const perRecipient = (message1.enabled ? 1 : 0) + (message2.enabled ? 1 : 0)

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-secondary sm:text-3xl">
            WhatsApp Bulk Messaging
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Upload a list, compose one or two messages, and send through the official WhatsApp API.
          </p>
        </div>
        <button
          onClick={loadTemplates}
          className="flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 hover:border-primary hover:text-primary"
        >
          <RefreshCw size={14} className={loadingTemplates ? "animate-spin" : ""} />
          Reload templates
        </button>
      </div>

      {/* Live progress ------------------------------------------------------- */}
      {live && (
        <div className={CARD}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {live.status === "completed" ? "Finished" : "Sending now"}
              </p>
              <h3 className="truncate text-lg font-black text-secondary">{live.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/automation/campaigns/${live.id}`}
                className="rounded-2xl bg-secondary px-4 py-2.5 text-xs font-black text-white"
              >
                View report
              </Link>
              {(live.status === "running" || live.status === "queued") && (
                <button
                  onClick={cancelLive}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black text-rose-600 hover:border-rose-300"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
              <span>
                {live.processed} / {live.totalRecipients} Processed
              </span>
              <span>
                {live.totalRecipients > 0
                  ? Math.round((live.processed / live.totalRecipients) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                style={{
                  width: `${
                    live.totalRecipients > 0
                      ? Math.min(100, (live.processed / live.totalRecipients) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <CountRow counts={live.counts} total={live.totalMessages} />
        </div>
      )}

      {/* 1. Upload ----------------------------------------------------------- */}
      <section className={CARD}>
        <StepHeading step={1} title="Upload your list" icon={FileSpreadsheet} />

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 px-4 py-8 text-center hover:border-primary">
          {parsing ? (
            <Loader2 size={22} className="animate-spin text-primary" />
          ) : (
            <Sheet size={22} className="text-slate-400" />
          )}
          <span className="text-sm font-black text-secondary">
            {sheet ? sheet.fileName : "Choose an Excel or CSV file"}
          </span>
          <span className="text-xs font-medium text-slate-400">.xlsx, .xls or .csv</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,text/csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ""
            }}
          />
        </label>

        {parseError && (
          <p className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-600">
            <AlertTriangle size={14} /> {parseError}
          </p>
        )}

        {sheet && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Mobile number column
                </p>
                <select
                  className={FIELD}
                  value={mobileColumn}
                  onChange={e => setMobileColumn(e.target.value)}
                >
                  <option value="">Select a column…</option>
                  {sheet.columns.map(column => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Name column (for {"{{Name}}"})
                </p>
                <select
                  className={FIELD}
                  value={nameColumn}
                  onChange={e => setNameColumn(e.target.value)}
                >
                  <option value="">Not used</option>
                  {sheet.columns.map(column => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {mobileColumn && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Rows in file" value={sheet.rows.length} tone="slate" />
                <Stat label="Will be sent" value={valid.length} tone="emerald" />
                <Stat label="Skipped" value={invalid.length} tone="rose" />
              </div>
            )}

            {valid.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full min-w-[380px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Number sent to</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {valid.slice(0, 5).map(recipient => (
                      <tr key={recipient.phone}>
                        <td className="px-4 py-2.5 font-bold text-secondary">
                          {recipient.name || "—"}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                          {displayPhone(recipient.phone)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {valid.length > 5 && (
                  <p className="bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-400">
                    + {valid.length - 5} more
                  </p>
                )}
              </div>
            )}

            {invalid.length > 0 && (
              <details className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                <summary className="cursor-pointer text-xs font-black text-rose-700">
                  {invalid.length} row{invalid.length === 1 ? "" : "s"} will be skipped
                </summary>
                <ul className="mt-3 space-y-1.5">
                  {invalid.slice(0, 20).map(row => (
                    <li key={`${row.row}-${row.raw}`} className="text-[11px] font-medium text-rose-700">
                      Row {row.row}: &ldquo;{row.raw || "(empty)"}&rdquo; — {row.reason}
                    </li>
                  ))}
                </ul>
                {invalid.length > 20 && (
                  <p className="mt-2 text-[11px] font-bold text-rose-400">
                    + {invalid.length - 20} more
                  </p>
                )}
              </details>
            )}
          </>
        )}
      </section>

      {/* 2. Compose ---------------------------------------------------------- */}
      <section className={CARD}>
        <StepHeading step={2} title="Compose" icon={Send} />

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
            Campaign name
          </p>
          <input
            className={FIELD}
            value={campaignName}
            placeholder="Diwali offer — Pune list"
            onChange={e => setCampaignName(e.target.value)}
          />
        </div>

        {templateError && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
            <AlertTriangle size={14} /> {templateError}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MessageComposer
            label="Message 1"
            message={message1}
            templates={templates}
            allowImage
            nameColumn={nameColumn}
            onChange={setMessage1}
          />
          <MessageComposer
            label="Message 2"
            message={message2}
            templates={templates}
            allowImage={false}
            nameColumn={nameColumn}
            onChange={setMessage2}
          />
        </div>

        {message1.enabled && message2.enabled && (
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Both are on: each recipient gets Message 1 first, then Message 2 as a separate
            WhatsApp message.
          </p>
        )}
      </section>

      {/* 3. Preview & send --------------------------------------------------- */}
      <section className={CARD}>
        <StepHeading step={3} title="Preview and send" icon={Eye} />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-500">
            {blocker ? (
              <span className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={15} /> {blocker}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={15} /> {valid.length} recipients · {valid.length * perRecipient}{" "}
                messages
              </span>
            )}
          </p>
          <button
            disabled={!!blocker}
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <Eye size={16} /> Preview &amp; send
          </button>
        </div>

        {sendError && (
          <p className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-600">
            <AlertTriangle size={14} /> {sendError}
          </p>
        )}
      </section>

      {/* Campaign history ---------------------------------------------------- */}
      <section className={CARD}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-secondary">
            <Users size={18} className="text-primary" /> Campaign history
          </h2>
          <button
            onClick={loadHistory}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-500 hover:border-primary hover:text-primary"
          >
            <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
          </button>
        </div>

        {history.length === 0 ? (
          <p className="mt-6 text-center text-sm font-medium text-slate-400">
            {loadingHistory ? "Loading…" : "No campaigns yet."}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="py-3 pr-4">Campaign</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">Recipients</th>
                  <th className="py-3 pr-4">Sent</th>
                  <th className="py-3 pr-4">Delivered</th>
                  <th className="py-3 pr-4">Read</th>
                  <th className="py-3 pr-4">Failed</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(campaign => (
                  <tr key={campaign.id}>
                    <td className="py-3 pr-4 font-black text-secondary">{campaign.name}</td>
                    <td className="py-3 pr-4 text-xs font-medium text-slate-500">
                      {campaign.createdAt
                        ? new Date(campaign.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 font-bold text-slate-600">{campaign.totalRecipients}</td>
                    <td className="py-3 pr-4 font-bold text-slate-600">{campaign.counts.sent}</td>
                    <td className="py-3 pr-4 font-bold text-slate-600">{campaign.counts.delivered}</td>
                    <td className="py-3 pr-4 font-bold text-slate-600">{campaign.counts.read}</td>
                    <td className="py-3 pr-4 font-bold text-rose-600">{campaign.counts.failed}</td>
                    <td className="py-3 pr-4">
                      <StatusPill status={campaign.status} />
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/admin/automation/campaigns/${campaign.id}`}
                        className="whitespace-nowrap rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-black text-secondary hover:bg-slate-200"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Preview modal ------------------------------------------------------- */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-secondary">Preview</h3>
                <p className="text-xs font-medium text-slate-500">
                  As {sample.name || "this recipient"} ({displayPhone(sample.phone)}) will see it.
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 rounded-3xl bg-[#e5ddd5] p-4">
              {message1.enabled && <Bubble label="Message 1" {...preview1} />}
              {message2.enabled && <Bubble label="Message 2" {...preview2} />}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-600">
              {valid.length} recipients · {valid.length * perRecipient} messages
              {invalid.length > 0 && ` · ${invalid.length} skipped`}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
              >
                Back
              </button>
              <button
                onClick={send}
                disabled={sending}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? "Starting…" : `Send to ${valid.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function StepHeading({
  step,
  title,
  icon: Icon,
}: {
  step: number
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
        {step}
      </span>
      <h2 className="flex items-center gap-2 text-lg font-black text-secondary">
        <Icon size={17} className="text-slate-400" /> {title}
      </h2>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "slate" | "emerald" | "rose" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }
  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  )
}

function Bubble({ label, image, text }: { label: string; image: string; text: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-2.5 shadow-sm">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="mb-2 w-full rounded-xl object-cover" />
        )}
        <p className="whitespace-pre-wrap text-sm text-slate-800">{text || "(no text)"}</p>
      </div>
    </div>
  )
}
