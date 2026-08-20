"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, GripVertical, Phone } from "lucide-react"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useLeads, Lead, logLeadActivity } from "@/lib/hooks/useLeads"
import { useAuth } from "@/context/AuthContext"
import { useViewerIdentity } from "@/lib/hooks/useViewerIdentity"
import { useNow } from "@/lib/hooks/useNow"
import { canSeeLead } from "@/lib/permissions"
import { formatINRShort, toAmount } from "@/lib/hooks/useBanks"
import {
  buildStatusTransition,
  STATUS_DISBURSED,
  STATUS_PENDING_APPROVAL,
} from "@/lib/disbursement"
import { cn } from "@/lib/utils"
import {
  AdminButton,
  PageHeader,
  Skeleton,
  StatusBadge,
  Toolbar,
  useToast,
} from "@/components/admin/ui"
import { TONE_CLASSES, toneForStatus } from "@/components/admin/ui/status"
import {
  isOverdue,
  leadName,
  leadPhone,
  STATUS_SYSTEM_QUALIFIED,
} from "@/components/admin/leads/leadFilters"
import { timeAgo } from "@/lib/dates"

/**
 * Board columns are the real pipeline statuses.
 *
 * They used to be an invented set (`New`, `In Progress`, `Verified`, …) that no
 * lead ever had, so the board looked empty and every drag wrote a status the
 * rest of the CRM does not understand.
 */
const COLUMNS = [
  "New Lead",
  // A status the board does not list is a status the board hides: leads in it
  // fall into `other` below, which is never rendered.
  STATUS_SYSTEM_QUALIFIED,
  "Contacted",
  "Interested",
  "Login to Bank",
  "Sanctioned",
  STATUS_PENDING_APPROVAL,
  STATUS_DISBURSED,
]

/** Dropping here would book money, which only a Manager may do on Approvals. */
const LOCKED_COLUMNS = new Set([STATUS_PENDING_APPROVAL, STATUS_DISBURSED])

export default function KanbanPage() {
  const { user, profile, adminRole, role } = useAuth()
  const viewer = useViewerIdentity()
  /**
   * Deleted leads keep their stage, so an Admin who switches this on sees them
   * exactly where they were when somebody removed them — New, Interested,
   * wherever. Nobody else can turn it on: `useLeads` ignores the flag for any
   * role without `leads:viewDeleted`.
   */
  const [showDeleted, setShowDeleted] = useState(false)
  const { leads, loading, canSeeDeleted } = useLeads({ includeDeleted: showDeleted })
  const toast = useToast()
  const now = useNow()

  const [search, setSearch] = useState("")
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const staffLabel =
    user?.email === "swapnil.r.aher@gmail.com"
      ? "Swapnil Aher (Super Admin)"
      : `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || "Staff"})`

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return leads.filter(lead => {
      if (!canSeeLead(role, lead, viewer)) return false
      if (!term) return true
      return `${leadName(lead)} ${leadPhone(lead)}`.toLowerCase().includes(term)
    })
  }, [leads, role, viewer, search])

  const byColumn = useMemo(() => {
    const map: Record<string, Lead[]> = Object.fromEntries(COLUMNS.map(c => [c, []]))
    const other: Lead[] = []
    visible.forEach(lead => {
      if (map[lead.status]) map[lead.status].push(lead)
      else other.push(lead)
    })
    return { map, other }
  }, [visible])

  const move = async (leadId: string, newStatus: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    if (LOCKED_COLUMNS.has(newStatus)) {
      toast.push({
        tone: "warn",
        title: "Disbursals are signed off, not dragged",
        description: "Mark the file disbursed from the Leads screen so a Manager can confirm the amount.",
      })
      return
    }

    try {
      await updateDoc(doc(db, "leads", leadId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...buildStatusTransition(lead, newStatus),
      })
      await logLeadActivity(
        leadId,
        "Status Update",
        `Changed status to ${newStatus} via the pipeline board`,
        staffLabel
      )
    } catch (error) {
      console.error("Error updating lead status:", error)
      toast.push({ tone: "danger", title: "Could not move this lead" })
    }
  }

  // Height is the viewport minus the header, the page title block and the main
  // element's padding — re-measured after that padding was tightened, or the
  // board would stop short of the fold.
  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] lg:h-[calc(100dvh-8rem)] gap-3">
      <PageHeader
        title="Pipeline board"
        subtitle="Drag a file to move it through the stages. Disbursals still go through approval."
      />

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Quick find by name or phone…"
        actions={
          canSeeDeleted ? (
            <AdminButton
              size="sm"
              icon={showDeleted ? Eye : EyeOff}
              onClick={() => setShowDeleted(v => !v)}
              className={showDeleted ? "border-admin-accent text-admin-accent" : undefined}
            >
              <span className="hidden sm:inline">
                {showDeleted ? "Deleted shown" : "Show deleted"}
              </span>
            </AdminButton>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {COLUMNS.slice(0, 5).map(column => (
            <Skeleton key={column} className="h-64 w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex gap-3 h-full min-w-max">
            {COLUMNS.map(column => {
              const columnLeads = byColumn.map[column]
              const locked = LOCKED_COLUMNS.has(column)
              const tone = TONE_CLASSES[toneForStatus(column)]

              return (
                <section
                  key={column}
                  onDragOver={event => {
                    event.preventDefault()
                    setDropTarget(column)
                  }}
                  onDragLeave={() => setDropTarget(current => (current === column ? null : current))}
                  onDrop={event => {
                    event.preventDefault()
                    setDropTarget(null)
                    setDragging(null)
                    const leadId = event.dataTransfer.getData("leadId")
                    if (leadId) move(leadId, column)
                  }}
                  className={cn(
                    "w-72 shrink-0 flex flex-col rounded-admin border bg-admin-surface-2 transition-colors",
                    dropTarget === column && !locked
                      ? "border-admin-accent bg-admin-accent-soft"
                      : "border-admin-border",
                    locked && dropTarget === column && "border-tone-warn-bd bg-tone-warn"
                  )}
                >
                  <header className="flex items-center gap-2 px-3 h-10 border-b border-admin-border shrink-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tone.dot)} />
                    <h2 className="text-admin-xs font-semibold text-admin-text truncate flex-1">
                      {column}
                    </h2>
                    <span className="admin-num text-admin-2xs text-admin-subtle">
                      {columnLeads.length}
                    </span>
                  </header>

                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {columnLeads.length === 0 ? (
                      <p className="text-admin-2xs text-admin-subtle text-center py-6">
                        {locked ? "Signed off on Approvals" : "Nothing here"}
                      </p>
                    ) : (
                      columnLeads.map(lead => (
                        <article
                          key={lead.id}
                          draggable={!locked}
                          onDragStart={event => {
                            event.dataTransfer.setData("leadId", lead.id)
                            setDragging(lead.id)
                          }}
                          onDragEnd={() => setDragging(null)}
                          className={cn(
                            "bg-admin-surface border rounded-admin-sm p-2.5 shadow-admin-1 transition-all",
                            locked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                            dragging === lead.id ? "opacity-50" : "hover:border-admin-border-strong",
                            isOverdue(lead, now) ? "border-l-2 border-l-tone-danger-fg border-admin-border" : "border-admin-border"
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            {!locked && (
                              <GripVertical size={13} className="text-admin-subtle shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/admin/leads?q=${encodeURIComponent(leadPhone(lead) || leadName(lead))}`}
                                className="admin-focus block text-admin-sm font-medium text-admin-text truncate hover:text-admin-accent"
                              >
                                {leadName(lead)}
                              </Link>
                              <p className="admin-num text-admin-2xs text-admin-subtle truncate">
                                {lead.type || "Loan"} · {formatINRShort(toAmount(lead.amount))}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-admin-border">
                            <span className="text-admin-2xs text-admin-subtle truncate">
                              {lead.assignedToName || "Unassigned"}
                            </span>
                            {lead.followUpDate ? (
                              <span
                                className={cn(
                                  "text-admin-2xs shrink-0",
                                  isOverdue(lead, now) ? "text-tone-danger-fg font-medium" : "text-admin-subtle"
                                )}
                              >
                                {timeAgo(lead.followUpDate, now)}
                              </span>
                            ) : (
                              leadPhone(lead) && (
                                <a
                                  href={`tel:${leadPhone(lead)}`}
                                  className="admin-focus text-admin-subtle hover:text-admin-accent shrink-0"
                                  aria-label={`Call ${leadName(lead)}`}
                                >
                                  <Phone size={12} />
                                </a>
                              )
                            )}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              )
            })}

            {/* Statuses outside the main pipeline still have to be visible. */}
            {byColumn.other.length > 0 && (
              <section className="w-72 shrink-0 flex flex-col rounded-admin border border-admin-border bg-admin-surface-2">
                <header className="flex items-center gap-2 px-3 h-10 border-b border-admin-border shrink-0">
                  <h2 className="text-admin-xs font-semibold text-admin-text flex-1">Other statuses</h2>
                  <span className="admin-num text-admin-2xs text-admin-subtle">
                    {byColumn.other.length}
                  </span>
                </header>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {byColumn.other.map(lead => (
                    <article
                      key={lead.id}
                      className="bg-admin-surface border border-admin-border rounded-admin-sm p-2.5 shadow-admin-1"
                    >
                      <Link
                        href={`/admin/leads?q=${encodeURIComponent(leadPhone(lead) || leadName(lead))}`}
                        className="admin-focus block text-admin-sm font-medium text-admin-text truncate hover:text-admin-accent"
                      >
                        {leadName(lead)}
                      </Link>
                      <div className="mt-1.5">
                        <StatusBadge status={lead.status} dot />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
