"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Filter, Megaphone, Plus, Tags, Upload, UserPlus, X } from "lucide-react"
import * as XLSX from "xlsx"
import Papa, { type ParseResult } from "papaparse"

import { useAuth } from "@/context/AuthContext"
import { useViewerIdentity } from "@/lib/hooks/useViewerIdentity"
import { useWaNotificationsContext } from "@/context/WaNotificationsContext"
import { useLeads, Lead } from "@/lib/hooks/useLeads"
import { useUsers } from "@/lib/hooks/useUsers"
import { useNow } from "@/lib/hooks/useNow"
import { can, canSeeLead, normalizeRole } from "@/lib/permissions"
import { STATUS_DISBURSED, STATUS_PENDING_APPROVAL } from "@/lib/disbursement"
import { formatDayShort, formatTime } from "@/lib/dates"
import {
  AdminButton,
  Sheet,
  Toolbar,
  useToast,
} from "@/components/admin/ui"
import { Field, Select } from "@/components/admin/leads/fields"

import {
  ALL_PARTNERS,
  ALL_SOURCES,
  ALL_STATUSES,
  ALL_TIME,
  ALL_TYPES,
  ATTENTION_LABELS,
  type Attention,
  DEFAULT_FILTERS,
  DELETED_VIEW_LABELS,
  type DeletedView,
  EMPTY_FILTERS,
  LeadFilters,
  QUICK_STATUSES,
  STATUS_LABELS,
  STATUS_OPTIONS,
  applyFilters,
  countActiveFilters,
  dedupeLeads,
  facetsOf,
  filterByAttention,
  isOverdue,
  isUntouched,
  leadName,
  leadPhone,
  matchesStatus,
  sanitizeFilters,
  sortLeads,
} from "@/components/admin/leads/leadFilters"
import { readJsonCookie, writeJsonCookie } from "@/lib/cookies"
import { useLeadMutations } from "@/components/admin/leads/useLeadMutations"
import { LeadsTable } from "@/components/admin/leads/LeadsTable"
import { DateRangeFilter } from "@/components/admin/leads/DateRangeFilter"
import { AttentionFilter } from "@/components/admin/leads/AttentionFilter"
import { AddLeadSheet } from "@/components/admin/leads/AddLeadSheet"
import { LeadDetailSheet } from "@/components/admin/leads/LeadDetailSheet"
import { LeadFiltersSheet } from "@/components/admin/leads/LeadFiltersSheet"
import { StatusPickerSheet } from "@/components/admin/leads/StatusPickerSheet"
import { DisbursalRequestSheet } from "@/components/admin/leads/DisbursalRequestSheet"
import { WhatsAppChatSheet } from "@/components/admin/leads/WhatsAppChatSheet"
import { BroadcastSheet } from "@/components/admin/leads/BroadcastSheet"
import { FollowUpPromptSheet, FollowUpPrompt } from "@/components/admin/leads/FollowUpPromptSheet"
import {
  BulkUploadSheet,
  ParsedSpreadsheet,
} from "@/components/admin/leads/BulkUploadSheet"

/** Key used to remember a call/chat hand-off across the tab losing focus. */
const PENDING_KEY = "pendingFollowUp"
const PENDING_WINDOW_MS = 10 * 60 * 1000

/** Where the filter bar's state is remembered between visits. */
const FILTERS_COOKIE = "admin.leads.filters"

/**
 * `?q=` prefills the search box — that is how the ⌘K command palette hands a
 * lead over. `?chat=<leadId>` additionally opens that lead's WhatsApp sheet,
 * which is how a staff notification about an incoming message hands over to the
 * conversation. Suspense boundary because `useSearchParams` opts the subtree out
 * of static prerendering.
 */
export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsPageWithQuery />
    </Suspense>
  )
}

function LeadsPageWithQuery() {
  const params = useSearchParams()
  const q = params?.get("q") ?? ""
  const chat = params?.get("chat") ?? ""
  return <LeadsPageContent searchParam={q} chatParam={chat} />
}

function LeadsPageContent({
  searchParam,
  chatParam,
}: {
  searchParam: string
  chatParam: string
}) {
  const { role } = useAuth()
  const viewer = useViewerIdentity()
  const { markReadForLead } = useWaNotificationsContext()

  // Opens on today's New Leads, not All: the first question on this screen is
  // always "what came in today that nobody has called yet". `EMPTY_FILTERS`
  // stays wide open so that "Clear all" still means clear.
  const [filters, setFilters] = useState<LeadFilters>({
    ...DEFAULT_FILTERS,
    search: searchParam,
  })

  /**
   * Deleted leads are only fetched when an Admin has asked for them. Every other
   * role makes the same call with the flag off — and `useLeads` ignores it for
   * them regardless, so the request cannot be widened from here.
   */
  const {
    leads: allLeads,
    loading,
    error,
    canSeeDeleted,
  } = useLeads({ includeDeleted: filters.deleted !== "active" })
  const { users: staffUsers } = useUsers()
  const toast = useToast()
  const now = useNow()
  const mutations = useLeadMutations()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<"status" | "assign" | null>(null)
  const [bulkValue, setBulkValue] = useState("")
  const [bulkBusy, setBulkBusy] = useState(false)

  /**
   * Filters survive a refresh, so a staff member who narrowed the pipeline down
   * to their own city and a status does not have to rebuild it every time the
   * page reloads.
   *
   * Restored in an effect rather than seeded into `useState`: the cookie does
   * not exist during the server render, so reading it while rendering would
   * make the first client pass disagree with the markup React is hydrating.
   */
  const initialSearchRef = useRef(searchParam)
  useEffect(() => {
    const saved = sanitizeFilters(readJsonCookie(FILTERS_COOKIE))
    if (!saved) return
    // `?q=` is a hand-off from the ⌘K palette or a notification, so it outranks
    // whatever search term the cookie remembers.
    setFilters(
      initialSearchRef.current ? { ...saved, search: initialSearchRef.current } : saved
    )
  }, [])

  /** Skips the mount pass so the defaults never overwrite a saved selection. */
  const savedOnce = useRef(false)
  useEffect(() => {
    if (!savedOnce.current) {
      savedOnce.current = true
      return
    }
    writeJsonCookie(FILTERS_COOKIE, filters)
  }, [filters])

  /**
   * Seed the search box from `?q=` without remounting the page. The previous
   * `key={q}` remount threw away the user's filters, sort, column choices and
   * scroll position every time they picked a lead from the ⌘K palette.
   */
  const [seededParam, setSeededParam] = useState(searchParam)
  if (searchParam !== seededParam) {
    setSeededParam(searchParam)
    if (searchParam) setFilters(f => ({ ...f, search: searchParam }))
  }
  const [selected, setSelected] = useState<Lead | null>(null)
  const [statusTarget, setStatusTarget] = useState<Lead | null>(null)
  const [disburseTarget, setDisburseTarget] = useState<Lead | null>(null)
  const [chatTarget, setChatTarget] = useState<Lead | null>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [parsedFile, setParsedFile] = useState<ParsedSpreadsheet | null>(null)
  const [prompt, setPrompt] = useState<FollowUpPrompt | null>(null)

  const canExport = can(role, "leads:export")
  const canAssign = can(role, "leads:assign")
  const canDelete = can(role, "leads:delete")
  const canViewAll = can(role, "leads:viewAll")

  const telecallers = useMemo(
    () =>
      staffUsers.filter(
        u =>
          (normalizeRole(u.role) === "Telecaller" || normalizeRole(u.role) === "Manager") &&
          u.status === "Active"
      ),
    [staffUsers]
  )

  /** Leads this role may see at all. */
  const permittedLeads = useMemo(
    () => allLeads.filter(lead => canSeeLead(role, lead, viewer)),
    [allLeads, role, viewer]
  )

  /**
   * One row per customer — every count on this screen starts here, so the
   * chips, the stat line and the table all agree on how many people are in the
   * pipeline rather than how many documents Firestore holds.
   */
  const {
    rows: visibleLeads,
    merged: mergedDuplicates,
    copies: duplicateCounts,
  } = useMemo(() => dedupeLeads(permittedLeads), [permittedLeads])

  const facets = useMemo(() => facetsOf(visibleLeads), [visibleLeads])

  /**
   * Search, date and city applied — but not attention and not status, so both
   * of those controls can show live counts for the same selection.
   */
  /**
   * The filters as they actually apply.
   *
   * `deleted` is forced back to Active for anyone who cannot see deleted leads.
   * The filter set is saved in a cookie shared by everyone who uses this
   * browser, so an Admin who left the screen on "Deleted" would otherwise hand
   * the next telecaller to sign in an empty pipeline and no way to explain it.
   */
  const effectiveFilters = useMemo(
    () => (canSeeDeleted ? filters : { ...filters, deleted: "active" as const }),
    [filters, canSeeDeleted]
  )

  const preAttention = useMemo(
    () => applyFilters(visibleLeads, effectiveFilters, now),
    [visibleLeads, effectiveFilters, now]
  )

  const attentionCounts = useMemo(
    (): Record<Attention, number> => ({
      all: preAttention.length,
      overdue: preAttention.filter(lead => isOverdue(lead, now)).length,
      untouched: preAttention.filter(lead => isUntouched(lead)).length,
      unassigned: preAttention.filter(lead => !lead.assignedTo).length,
    }),
    [preAttention, now]
  )

  /** Everything except the status filter, so the chips can show live counts. */
  const preStatus = useMemo(
    () => filterByAttention(preAttention, filters.attention, now),
    [preAttention, filters.attention, now]
  )

  const rows = useMemo(
    () => sortLeads(preStatus.filter(lead => matchesStatus(lead, filters.status)), now),
    [preStatus, filters.status, now]
  )

  const chips = useMemo(
    () => [
      { id: ALL_STATUSES, label: STATUS_LABELS[ALL_STATUSES], count: preStatus.length },
      ...QUICK_STATUSES.map(status => ({
        id: status,
        label: STATUS_LABELS[status] || status,
        count: preStatus.filter(lead => matchesStatus(lead, status)).length,
      })),
    ],
    [preStatus]
  )

  // Keep the open detail panel in step with the live Firestore snapshot instead
  // of patching local copies after every write.
  const selectedLive = useMemo(
    () => (selected ? (allLeads.find(l => l.id === selected.id) ?? selected) : null),
    [allLeads, selected]
  )
  const chatLive = useMemo(
    () => (chatTarget ? (allLeads.find(l => l.id === chatTarget.id) ?? chatTarget) : null),
    [allLeads, chatTarget]
  )

  const rememberHandoff = useCallback((lead: Lead, type: "Call" | "WhatsApp") => {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ leadId: lead.id, time: Date.now(), type })
    )
  }, [])

  // When the tab comes back after a call or a WhatsApp hand-off, ask what
  // happened while it is still fresh.
  useEffect(() => {
    const onFocus = () => {
      const raw = localStorage.getItem(PENDING_KEY)
      if (!raw) return
      localStorage.removeItem(PENDING_KEY)
      try {
        const pending = JSON.parse(raw) as { leadId: string; time: number; type: string }
        if (Date.now() - pending.time > PENDING_WINDOW_MS) return
        const lead = allLeads.find(l => l.id === pending.leadId)
        if (lead) setPrompt({ lead, type: pending.type })
      } catch (e) {
        console.error("Error parsing pending follow-up:", e)
      }
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [allLeads])

  const handleCall = useCallback(
    async (lead: Lead) => {
      const phone = leadPhone(lead)
      if (!phone) {
        toast.push({ tone: "warn", title: "No phone number available" })
        return
      }
      try {
        await mutations.registerContact(lead, "Call", "Placed a quick call to customer")
      } catch (e) {
        console.error("Error logging call:", e)
      }
      rememberHandoff(lead, "Call")
      window.location.href = `tel:${phone}`
    },
    [mutations, rememberHandoff, toast]
  )

  const handleChat = useCallback(
    async (lead: Lead) => {
      if (!leadPhone(lead)) {
        toast.push({ tone: "warn", title: "No phone number available" })
        return
      }
      setChatTarget(lead)
      // Opening the conversation is what "reading" a WhatsApp notification
      // means, so clear this lead's unread ones here rather than only on the
      // bell — that covers arriving from the table as well as from a push.
      void markReadForLead(lead.id)
    },
    [markReadForLead, toast]
  )

  /**
   * `?chat=<leadId>` hand-off — how a WhatsApp notification opens the
   * conversation it is about.
   *
   * Opening the sheet is a state adjustment during render, the same pattern
   * `?q=` uses above; the lead it names simply is not there until the leads
   * listener has delivered a snapshot, so this re-checks on each render until
   * it is. Seeded once per parameter value, so closing the sheet cannot
   * immediately re-open it.
   */
  const [seededChat, setSeededChat] = useState("")
  if (chatParam && chatParam !== seededChat) {
    const target = allLeads.find(lead => lead.id === chatParam)
    if (target) {
      setSeededChat(chatParam)
      setChatTarget(target)
    }
  }

  /** The writes that go with that hand-off, once the sheet is actually open. */
  const loggedChatRef = useRef("")
  useEffect(() => {
    if (!seededChat || seededChat === loggedChatRef.current) return
    const target = allLeads.find(lead => lead.id === seededChat)
    if (!target) return
    loggedChatRef.current = seededChat
    void markReadForLead(target.id)
  }, [seededChat, allLeads, markReadForLead])

  const handleExternalWhatsApp = useCallback(
    async (lead: Lead) => {
      rememberHandoff(lead, "WhatsApp")
      try {
        await mutations.registerContact(
          lead,
          "WhatsApp",
          "Redirected to external WhatsApp wa.me link"
        )
      } catch (e) {
        console.error("Error logging WhatsApp activity:", e)
      }
    },
    [mutations, rememberHandoff]
  )

  const handleStatusPick = useCallback(
    async (lead: Lead, status: string) => {
      // A disbursal is never booked from the pipeline — it goes to a Manager for
      // sign-off, who confirms the bank, the amount and the payouts.
      if (status === STATUS_DISBURSED || status === STATUS_PENDING_APPROVAL) {
        setDisburseTarget(lead)
        return
      }
      try {
        await mutations.updateStatus(lead, status)
        toast.push({ tone: "success", title: `स्टेटस ${status} वर अपडेट झाला` })
      } catch (e) {
        console.error("Status update error:", e)
        toast.push({ tone: "danger", title: "Error updating status" })
      }
    },
    [mutations, toast]
  )

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()

    if (file.name.endsWith(".csv")) {
      reader.onload = evt => {
        Papa.parse(String(evt.target?.result ?? ""), {
          header: true,
          skipEmptyLines: true,
          complete: (results: ParseResult<Record<string, unknown>>) => {
            const rowsParsed = results.data
            if (rowsParsed.length === 0) return
            setParsedFile({ headers: Object.keys(rowsParsed[0]), rows: rowsParsed })
          },
        })
      }
      reader.readAsText(file)
    } else {
      reader.onload = evt => {
        const workbook = XLSX.read(evt.target?.result, { type: "binary" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const grid = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
        const headers = (grid[0] || []).map(String)
        const rowsParsed = grid.slice(1).map(row => {
          const obj: Record<string, unknown> = {}
          headers.forEach((header, i) => {
            obj[header] = row[i]
          })
          return obj
        })
        setParsedFile({ headers, rows: rowsParsed })
      }
      reader.readAsBinaryString(file)
    }
    event.target.value = ""
  }, [])

  const selectedLeads = useMemo(
    () => rows.filter(lead => selectedIds.includes(lead.id)),
    [rows, selectedIds]
  )

  const overdueCount = useMemo(
    () => rows.filter(lead => isOverdue(lead, now)).length,
    [rows, now]
  )

  const hasFilters =
    countActiveFilters(filters) > 0 ||
    filters.status !== ALL_STATUSES ||
    filters.attention !== "all" ||
    filters.search.trim().length > 0

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
  }, [])

  /** One removable chip per active filter, so nothing hides silently. */
  const activeFilterChips = useMemo(() => {
    const chipList: { key: string; label: string; value: string; clear: () => void }[] = []
    const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) =>
      setFilters(f => ({ ...f, [key]: value }))

    if (filters.search.trim()) {
      chipList.push({
        key: "search",
        label: "Search",
        value: filters.search.trim(),
        clear: () => set("search", ""),
      })
    }
    if (filters.attention !== "all") {
      chipList.push({
        key: "attention",
        label: "Needs",
        value: ATTENTION_LABELS[filters.attention],
        clear: () => set("attention", "all"),
      })
    }
    if (filters.type !== ALL_TYPES) {
      chipList.push({ key: "type", label: "Type", value: filters.type, clear: () => set("type", ALL_TYPES) })
    }
    if (filters.source !== ALL_SOURCES) {
      chipList.push({
        key: "source",
        label: "Source",
        value: filters.source,
        clear: () => set("source", ALL_SOURCES),
      })
    }
    if (filters.partner !== ALL_PARTNERS) {
      chipList.push({
        key: "partner",
        label: "Partner",
        value: filters.partner,
        clear: () => set("partner", ALL_PARTNERS),
      })
    }
    if (filters.datePreset !== ALL_TIME) {
      chipList.push({
        key: "date",
        label: "Date",
        value: filters.datePreset,
        clear: () => setFilters(f => ({ ...f, datePreset: ALL_TIME, dateRange: { start: "", end: "" } })),
      })
    }
    if (filters.cities.length > 0) {
      chipList.push({
        key: "cities",
        label: "City",
        value: filters.cities.join(", "),
        clear: () => set("cities", []),
      })
    }
    return chipList
  }, [filters])

  /** Leads the broadcast will actually reach: the selection, or everything visible. */
  const broadcastTargets = selectedLeads.length > 0 ? selectedLeads : rows

  const runBulk = useCallback(async () => {
    if (!bulkAction || !bulkValue || selectedLeads.length === 0) return
    setBulkBusy(true)
    let done = 0
    try {
      for (const lead of selectedLeads) {
        if (bulkAction === "status") {
          // Disbursal still has to go through Manager sign-off, so those two
          // statuses are deliberately absent from the bulk list.
          await mutations.updateStatus(lead, bulkValue)
        } else {
          const agent = telecallers.find(t => t.id === bulkValue)
          await mutations.assignAgent(lead.id, bulkValue, agent?.name || "")
        }
        done++
      }
      toast.push({
        tone: "success",
        title: bulkAction === "status" ? `${done} leads moved to ${bulkValue}` : `${done} leads assigned`,
      })
      setSelectedIds([])
    } catch (e) {
      console.error("Bulk action failed:", e)
      toast.push({
        tone: "danger",
        title: "Bulk action stopped part-way",
        description: `${done} of ${selectedLeads.length} updated. Re-run for the rest.`,
      })
    }
    setBulkAction(null)
    setBulkValue("")
    setBulkBusy(false)
  }, [bulkAction, bulkValue, selectedLeads, mutations, telecallers, toast])

  const exportCsv = useCallback(() => {
    if (!canExport) return
    const headers = ["Lead ID", "Name", "Phone", "Email", "Type", "Amount", "Status", "Source", "Date"]
    // Export what is selected; fall back to everything currently filtered in.
    const scope = selectedLeads.length > 0 ? selectedLeads : rows
    const lines = scope.map(lead =>
      [
        lead.id,
        leadName(lead),
        leadPhone(lead) || "NA",
        lead.email || "NA",
        lead.type,
        lead.amount,
        lead.status,
        lead.source || lead.category || "Direct",
        `${formatDayShort(lead.createdAt)} ${formatTime(lead.createdAt)}`.trim() || "NA",
      ]
        .map(value => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )

    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `techstar_leads_${new Date(now).toISOString().split("T")[0]}.csv`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }, [canExport, rows, selectedLeads, now])

  const activeFilterCount = countActiveFilters(filters)

  return (
    <div className="space-y-2.5">
      {/*
        No page title and no subtitle. The sidebar and the mobile tab bar both
        already say "Leads", and on a phone a heading plus two lines of prose
        plus its own action row cost roughly a third of the first screen before
        a single lead appeared. The controls are the header now: search and the
        page actions, then what-needs-me and the date window, then the six
        totals, then the status chips that refine them.
      */}
      <Toolbar
        search={filters.search}
        onSearchChange={value => setFilters(f => ({ ...f, search: value }))}
        searchPlaceholder="नाव, फोन किंवा लोन प्रकार शोधा…"
        chips={chips}
        activeChip={filters.status}
        onChipChange={status => setFilters(f => ({ ...f, status }))}
        actions={
          <>
            {/* Labels collapse to icons on a phone so all five page actions fit
                one 44px row instead of wrapping to two. */}
            <AdminButton
              size="sm"
              icon={Filter}
              onClick={() => setFiltersOpen(true)}
              title="फिल्टर्स"
              aria-label="फिल्टर्स"
              className={activeFilterCount ? "border-admin-accent text-admin-accent" : undefined}
            >
              <span className="hidden sm:inline">फिल्टर्स</span>
              {activeFilterCount > 0 && (
                <span className="admin-num sm:ml-1">{activeFilterCount}</span>
              )}
            </AdminButton>

            {canExport && (
              <AdminButton
                size="sm"
                icon={Download}
                onClick={exportCsv}
                title="एक्सपोर्ट"
                aria-label="एक्सपोर्ट"
              >
                <span className="hidden sm:inline">
                  एक्सपोर्ट{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                </span>
              </AdminButton>
            )}

            <label
              title="Excel / CSV अपलोड"
              className="admin-focus inline-flex items-center justify-center gap-1.5 h-11 sm:h-8 px-3 sm:px-2.5 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-xs font-semibold text-admin-text hover:bg-admin-surface-2 transition-colors cursor-pointer"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">अपलोड</span>
              <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleImportFile} />
            </label>

            {/*
              Not the primary action. This fires a real WhatsApp message at
              every targeted customer, so it should not be the biggest button
              on a screen people use all day.
            */}
            <AdminButton
              size="sm"
              icon={Megaphone}
              onClick={() => setBroadcastOpen(true)}
              title={`ब्रॉडकास्ट (${broadcastTargets.length})`}
              aria-label={`ब्रॉडकास्ट (${broadcastTargets.length})`}
            >
              <span className="hidden sm:inline">ब्रॉडकास्ट ({broadcastTargets.length})</span>
            </AdminButton>

            <AdminButton size="sm" variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
              नवीन लीड
            </AdminButton>
          </>
        }
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        bulkActions={
          <>
            {canAssign && telecallers.length > 0 && (
              <AdminButton size="sm" icon={UserPlus} onClick={() => setBulkAction("assign")}>
                Assign
              </AdminButton>
            )}
            <AdminButton size="sm" icon={Tags} onClick={() => setBulkAction("status")}>
              Set status
            </AdminButton>
            {canExport && (
              <AdminButton size="sm" icon={Download} onClick={exportCsv}>
                Export
              </AdminButton>
            )}
          </>
        }
      >
        {/*
          The window every other number on this page is measured inside. One
          scroll track rather than a wrapping row: `shrink-0` lets the segmented
          control keep its natural width so it never opens a second, nested
          scrollbar inside this one.
        */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5 -mb-0.5">
          <AttentionFilter
            value={filters.attention}
            counts={attentionCounts}
            onChange={attention => setFilters(f => ({ ...f, attention }))}
            className="shrink-0 overflow-visible"
          />
          <div className="grow" />

          {/*
            Deleted leads, for the one role that can see them. They stay in the
            pipeline they were deleted from — this switches which side of the
            flag the whole screen is looking at, rather than opening a separate
            "deleted" screen that would take them out of their stage.
          */}
          {canSeeDeleted && (
            <div className="shrink-0 flex items-center rounded-admin-sm border border-admin-border overflow-hidden">
              {(["active", "deleted", "all"] as DeletedView[]).map(view => (
                <button
                  key={view}
                  onClick={() => setFilters(f => ({ ...f, deleted: view }))}
                  className={`admin-focus h-9 px-2.5 text-admin-xs font-semibold transition-colors ${
                    filters.deleted === view
                      ? "bg-admin-accent text-admin-accent-fg"
                      : "text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {DELETED_VIEW_LABELS[view]}
                </button>
              ))}
            </div>
          )}

          <DateRangeFilter
            preset={filters.datePreset}
            range={filters.dateRange}
            onChange={patch => setFilters(f => ({ ...f, ...patch }))}
            className="shrink-0"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="admin-focus shrink-0 h-9 px-2 text-admin-xs font-semibold text-admin-accent hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </Toolbar>

      {/* Active filters, individually removable — a count badge on a button
          does not tell anyone which filter is hiding their leads. */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilterChips.map(chip => (
            <button
              key={chip.key}
              onClick={chip.clear}
              className="admin-focus inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-xs text-admin-text hover:border-admin-border-strong transition-colors"
            >
              <span className="text-admin-subtle">{chip.label}:</span>
              <span className="truncate max-w-[18ch]">{chip.value}</span>
              <X size={12} className="text-admin-subtle shrink-0" />
            </button>
          ))}
        </div>
      )}

      <LeadsTable
        toolbarLeft={
          <p className="admin-num text-admin-xs text-admin-subtle flex items-center gap-2 min-w-0">
            <span className="truncate">
              {loading
                ? "Loading…"
                : `${rows.length} of ${visibleLeads.length} leads${
                    overdueCount > 0 ? ` · ${overdueCount} overdue` : ""
                  }${
                    mergedDuplicates > 0
                      ? ` · ${mergedDuplicates} duplicate${
                          mergedDuplicates === 1 ? "" : "s"
                        } merged`
                      : ""
                  }`}
            </span>
            {!loading && !error && (
              <span className="hidden sm:inline-flex items-center gap-1 text-tone-success-fg shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-tone-success-fg" />
                Live data
              </span>
            )}
          </p>
        }
        leads={rows}
        loading={loading}
        error={error}
        now={now}
        showOwner={canViewAll}
        duplicateCounts={duplicateCounts}
        onOpen={setSelected}
        onStatusClick={setStatusTarget}
        onCall={handleCall}
        onChat={handleChat}
        onExternalWhatsApp={handleExternalWhatsApp}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      <LeadFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        facets={facets}
      />

      <StatusPickerSheet
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        current={statusTarget?.status}
        onPick={status => statusTarget && handleStatusPick(statusTarget, status)}
      />

      <DisbursalRequestSheet
        lead={disburseTarget}
        onClose={() => setDisburseTarget(null)}
        onSubmit={async (lead, amount, bankId, productType) => {
          await mutations.requestDisbursal(lead, amount, bankId, productType)
          toast.push({ tone: "success", title: "मॅनेजर मंजुरीसाठी पाठवले" })
        }}
      />

      {selectedLive && (
        <LeadDetailSheet
          lead={selectedLive}
          now={now}
          onClose={() => setSelected(null)}
          onOpenStatusPicker={setStatusTarget}
          onCall={handleCall}
          onChat={handleChat}
          onExternalWhatsApp={handleExternalWhatsApp}
          telecallers={telecallers}
          canAssign={canAssign}
          canDelete={canDelete}
          onAssign={mutations.assignAgent}
          onFollowUpDate={mutations.setFollowUpDate}
          onFollowUpReason={mutations.setFollowUpReason}
          onSaveDetails={mutations.saveDetails}
          onSaveNote={mutations.saveNote}
          onDelete={mutations.deleteLead}
          onRestore={mutations.restoreLead}
          onSaveBankerLocation={mutations.saveBankerLocation}
        />
      )}

      <WhatsAppChatSheet
        lead={chatLive}
        onClose={() => setChatTarget(null)}
        senderName={mutations.staffName}
        onMuteToggle={mutations.setBotMuted}
        onExternalHandoff={lead => rememberHandoff(lead, "WhatsApp")}
      />

      <BroadcastSheet
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        recipients={broadcastTargets}
        senderName={mutations.staffName}
      />

      <AddLeadSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        telecallers={telecallers}
        canAssign={canAssign}
        onCreate={mutations.createLead}
      />

      <Sheet
        open={!!bulkAction}
        onClose={() => setBulkAction(null)}
        side="center"
        size="sm"
        dismissOnBackdrop={!bulkBusy}
        title={bulkAction === "assign" ? "Assign selected leads" : "Set status on selected leads"}
        description={`${selectedLeads.length} lead${selectedLeads.length === 1 ? "" : "s"} selected`}
        footer={
          <>
            <AdminButton variant="ghost" disabled={bulkBusy} onClick={() => setBulkAction(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              loading={bulkBusy}
              disabled={!bulkValue}
              onClick={runBulk}
            >
              Apply to {selectedLeads.length}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-3">
          {bulkAction === "assign" ? (
            <Field label="Telecaller">
              <Select value={bulkValue} onChange={e => setBulkValue(e.target.value)}>
                <option value="">-- Select a telecaller --</option>
                {telecallers.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field
              label="New status"
              hint="Disbursal statuses are missing on purpose — those go through Manager sign-off one file at a time."
            >
              <Select value={bulkValue} onChange={e => setBulkValue(e.target.value)}>
                <option value="">-- Select a status --</option>
                {STATUS_OPTIONS.filter(
                  status => status !== STATUS_DISBURSED && status !== STATUS_PENDING_APPROVAL
                ).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <p className="text-admin-xs text-admin-muted bg-admin-surface-2 border border-admin-border rounded-admin-sm px-3 py-2.5">
            This writes to {selectedLeads.length} lead
            {selectedLeads.length === 1 ? "" : "s"} one at a time and logs an activity entry on each.
          </p>
        </div>
      </Sheet>

      <BulkUploadSheet
        parsed={parsedFile}
        onClose={() => setParsedFile(null)}
        onImport={mutations.importLeads}
      />

      <FollowUpPromptSheet
        prompt={prompt}
        onClose={() => setPrompt(null)}
        onSave={async (lead, input) => {
          await mutations.saveFollowUpRemark(lead, input)
          toast.push({ tone: "success", title: "माहिती सेव्ह झाली" })
        }}
      />
    </div>
  )
}
