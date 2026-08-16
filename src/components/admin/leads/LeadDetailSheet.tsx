"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  History,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Save,
  StickyNote,
  Trash2,
  User,
} from "lucide-react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import {
  AdminButton,
  EmptyState,
  Sheet,
  StatusBadge,
  useToast,
} from "@/components/admin/ui"
import { formatINR, toAmount } from "@/lib/hooks/useBanks"
import { useAuth } from "@/context/AuthContext"
import { STATUS_DISBURSED, STATUS_PENDING_APPROVAL } from "@/lib/disbursement"
import { formatDayShort, formatTime, timeAgo, toDate } from "@/lib/dates"
import type { Lead } from "@/lib/hooks/useLeads"
import { ownerIdOf, type AdminUser } from "@/lib/hooks/useUsers"
import { currentDistrictName } from "@/lib/locationMatch"
import { Field, FactRow, SectionCard, Select, TextArea, TextInput } from "./fields"
import { leadName, leadPhone, whatsAppNumber } from "./leadFilters"
import { BankerLookupCard } from "./BankerLookupCard"

const LOAN_TYPES = [
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "Gold Loan",
  "Vehicle Loan",
  "Education Loan",
  "Loan Against Property",
  "Credit Card",
]

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Call: Phone,
  WhatsApp: MessageSquare,
  Meeting: User,
  "Status Update": ArrowUpRight,
  Note: StickyNote,
  Edit: Edit3,
}

interface Activity {
  id: string
  type?: string
  note?: string
  userName?: string
  timestamp?: unknown
}

/**
 * A file that came through WhatsApp on this lead's thread.
 *
 * There is no separate uploads collection in this CRM — every document and photo
 * that exists for a lead arrived as a `whatsapp_messages` row carrying media. So
 * this tab is a view over that same collection rather than new storage.
 */
interface LeadFile {
  id: string
  mediaType: string
  mediaUrl: string
  filename: string
  caption: string
  sender: "customer" | "bot" | "staff"
  userName: string
  timestamp: unknown
  sortKey: number
}

/** `whatsapp_messages` is keyed on the bare 10-digit number. */
function localNumber(raw: string): string {
  const clean = (raw || "").replace(/\D/g, "")
  return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
}

interface LeadDetailSheetProps {
  lead: Lead | null
  now: number
  onClose: () => void
  onOpenStatusPicker: (lead: Lead) => void
  onCall: (lead: Lead) => void
  onChat: (lead: Lead) => void
  onExternalWhatsApp: (lead: Lead) => void
  telecallers: AdminUser[]
  canAssign: boolean
  canDelete: boolean
  // Mutations return their Firestore payload; the sheet only cares that they
  // settled, so the results are intentionally untyped here.
  onAssign: (leadId: string, agentId: string, agentName: string) => Promise<unknown>
  onFollowUpDate: (leadId: string, value: string) => Promise<unknown>
  onFollowUpReason: (leadId: string, value: string) => Promise<unknown>
  onSaveDetails: (lead: Lead, edits: { name: string; type: string; amount: string }) => Promise<unknown>
  onSaveNote: (lead: Lead, note: string) => Promise<unknown>
  onDelete: (leadId: string) => Promise<unknown>
  /** Admin only — puts a deleted lead back into its pipeline stage. */
  onRestore: (leadId: string) => Promise<unknown>
  /** Staff re-pointing the banker search — leaves the PIN code location alone. */
  onSaveBankerLocation: (leadId: string, state: string, district: string) => Promise<unknown>
}

type Tab = "details" | "timeline" | "documents"

export function LeadDetailSheet({
  lead,
  now,
  onClose,
  onOpenStatusPicker,
  onCall,
  onChat,
  onExternalWhatsApp,
  telecallers,
  canAssign,
  canDelete,
  onAssign,
  onFollowUpDate,
  onFollowUpReason,
  onSaveDetails,
  onSaveNote,
  onDelete,
  onRestore,
  onSaveBankerLocation,
}: LeadDetailSheetProps) {
  const { role } = useAuth()
  const isAdmin = role === "Admin"
  const toast = useToast()
  const [tab, setTab] = useState<Tab>("timeline")
  const [activities, setActivities] = useState<Activity[]>([])

  const visibleActivities = useMemo(() => {
    return activities.filter(act => {
      const note = act.note || ""
      const isAutomatedAction =
        note.includes("Redirected to external WhatsApp") ||
        note.includes("Opened direct WhatsApp") ||
        note.includes("Placed a quick call") ||
        note.startsWith("Partner initiated ")

      if (isAutomatedAction) {
        return isAdmin
      }
      return true
    })
  }, [activities, isAdmin])

  // Stamped with the number it was loaded for, so switching leads shows nothing
  // rather than the previous lead's files until the new snapshot lands.
  const [fileState, setFileState] = useState<{ phone: string; rows: LeadFile[] }>({
    phone: "",
    rows: [],
  })
  const [editing, setEditing] = useState(false)
  const [edits, setEdits] = useState({ name: "", type: "", amount: "" })
  const [savingEdits, setSavingEdits] = useState(false)
  const [note, setNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [seededFor, setSeededFor] = useState<string | null>(null)

  /**
   * The stored owner may be either id shape, so match the lead back to a staff
   * member first and render whichever value this dropdown is offering. Without
   * this, re-opening an already-assigned lead shows "Unassigned".
   */
  const assignedOption = useMemo(() => {
    const owner = (lead?.assignedTo || "").trim().toLowerCase()
    if (!owner) return ""
    const agent = telecallers.find(
      t => t.id.toLowerCase() === owner || (t.uid || "").toLowerCase() === owner
    )
    return agent ? ownerIdOf(agent) : ""
  }, [lead?.assignedTo, telecallers])

  // Reset per-lead UI state during render instead of in an effect, so the panel
  // never flashes the previous lead's draft note or edit mode.
  if (lead && seededFor !== lead.id) {
    setSeededFor(lead.id)
    setEditing(false)
    setNote("")
    setConfirmDelete(false)
  }

  const leadId = lead?.id

  useEffect(() => {
    if (!leadId) return
    const unsubscribe = onSnapshot(
      query(collection(db, "lead_activities"), where("leadId", "==", leadId)),
      snapshot => {
        const rows = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Activity)
        // Sorted client-side so Firestore needs no composite index.
        rows.sort((a, b) => (toDate(b.timestamp)?.getTime() ?? 0) - (toDate(a.timestamp)?.getTime() ?? 0))
        setActivities(rows)
      },
      err => console.error("Activities listener error:", err)
    )
    return () => unsubscribe()
  }, [leadId])

  const filePhone = localNumber(lead ? leadPhone(lead) : "")

  /**
   * Every photo and document on this lead's WhatsApp thread, newest first.
   *
   * Keyed on the phone number rather than `leadId` on purpose: the webhook only
   * stamps `leadId` onto a message once a lead record exists, so older media —
   * and anything that arrived while the lead was still being created — carries a
   * phone number and nothing else. Matching on the number is what makes those
   * files visible instead of silently missing.
   */
  useEffect(() => {
    if (!filePhone) return
    const unsubscribe = onSnapshot(
      query(collection(db, "whatsapp_messages"), where("phone", "==", filePhone)),
      snapshot => {
        const rows: LeadFile[] = []
        snapshot.docs.forEach(d => {
          const data = d.data()
          const mediaType = data.mediaType || ""
          // Text-only chatter is not a file; it belongs in the chat thread.
          if (mediaType !== "image" && mediaType !== "document") return
          rows.push({
            id: d.id,
            mediaType,
            mediaUrl: data.mediaUrl || "",
            filename: data.filename || "",
            caption: data.text || "",
            sender: data.sender || "customer",
            userName: data.userName || "",
            timestamp: data.timestamp,
            sortKey: toDate(data.timestamp)?.getTime() ?? 0,
          })
        })
        // Sorted client-side so Firestore needs no composite index.
        rows.sort((a, b) => b.sortKey - a.sortKey)
        setFileState({ phone: filePhone, rows })
      },
      err => console.error("Lead files listener error:", err)
    )
    return () => unsubscribe()
  }, [filePhone])

  /** Only trusted once it belongs to the lead currently on screen. */
  const files = fileState.phone === filePhone ? fileState.rows : []

  // Pulled out so the memo's dependencies are plain values — the React compiler
  // rejects optional-chained members in a dependency array.
  const statusHistory = lead?.statusHistory
  const statusDurations = lead?.statusDurations

  /** Stage-by-stage history, newest first, with how long each stage took. */
  const stageHistory = useMemo(() => {
    if (!statusHistory) return []
    return Object.entries(statusHistory)
      .map(([status, at]) => ({
        status,
        at: toDate(at),
        duration: Object.entries(statusDurations || {}).find(
          ([key]) => key.startsWith(`${status}To`) && !key.endsWith("_timeMs")
        )?.[1] as string | undefined,
      }))
      .filter(entry => entry.at !== null)
      .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))
  }, [statusHistory, statusDurations])

  if (!lead) return <Sheet open={false} onClose={onClose}>{null}</Sheet>

  const saveEdits = async () => {
    setSavingEdits(true)
    try {
      await onSaveDetails(lead, edits)
      setEditing(false)
    } catch (e) {
      console.error("Error saving edits:", e)
      toast.push({ tone: "danger", title: "माहिती अपडेट करताना त्रुटी आली" })
    }
    setSavingEdits(false)
  }

  const saveNote = async () => {
    if (!note.trim()) return
    setSavingNote(true)
    try {
      await onSaveNote(lead, note)
      setNote("")
      toast.push({ tone: "success", title: "नोट सेव्ह झाली" })
    } catch (e) {
      console.error("Error saving note:", e)
      toast.push({ tone: "danger", title: "नोट सेव्ह करताना त्रुटी आली" })
    }
    setSavingNote(false)
  }

  return (
    <Sheet open onClose={onClose} side="right" size="lg" padded={false}>
      <div className="shrink-0 border-b border-admin-border px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-admin bg-admin-accent-soft border border-admin-border text-admin-accent flex items-center justify-center text-admin-base font-semibold uppercase shrink-0">
            {leadName(lead)[0]}
          </span>

          <div className="min-w-0 flex-1">
            {editing ? (
              <TextInput
                value={edits.name}
                onChange={e => setEdits({ ...edits, name: e.target.value })}
                placeholder="नाव टाका…"
              />
            ) : (
              <h2 className="text-admin-lg font-semibold text-admin-text truncate">{leadName(lead)}</h2>
            )}

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <button
                onClick={() => onOpenStatusPicker(lead)}
                className="admin-focus rounded-admin-sm"
                title="Change status"
              >
                <StatusBadge status={lead.status} dot />
              </button>
              {editing ? (
                <Select
                  value={edits.type}
                  onChange={e => setEdits({ ...edits, type: e.target.value })}
                  className="h-7 w-auto text-admin-xs"
                >
                  <option value="">-- प्रकार निवडा --</option>
                  {LOAN_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              ) : (
                <span className="text-admin-xs text-admin-muted">{lead.type || "General"}</span>
              )}
              <span className="admin-num text-admin-xs text-admin-text">
                {formatINR(toAmount(lead.amount))}
              </span>
              <span className="admin-num text-admin-xs text-admin-muted">{leadPhone(lead) || "—"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <AdminButton size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </AdminButton>
                <AdminButton size="sm" variant="primary" icon={Check} loading={savingEdits} onClick={saveEdits}>
                  Save
                </AdminButton>
              </>
            ) : (
              <AdminButton
                size="sm"
                variant="ghost"
                icon={Edit3}
                onClick={() => {
                  setEdits({
                    name: leadName(lead),
                    type: lead.type || "",
                    amount: lead.amount || "",
                  })
                  setEditing(true)
                }}
              >
                Edit
              </AdminButton>
            )}
            <AdminButton size="sm" variant="ghost" onClick={onClose} aria-label="Close">
              ✕
            </AdminButton>
          </div>
        </div>

        {editing && (
          <div className="mt-2.5 max-w-[220px]">
            <Field label="रक्कम (Amount ₹)">
              <TextInput
                type="number"
                value={edits.amount}
                onChange={e => setEdits({ ...edits, amount: e.target.value })}
                placeholder="500000"
                className="admin-num"
              />
            </Field>
          </div>
        )}

        {/* Disbursal sign-off state */}
        {lead.status === STATUS_PENDING_APPROVAL && (
          <Banner tone="warn" icon={Clock}>
            मॅनेजर मंजुरीच्या प्रतीक्षेत — {formatINR(toAmount(lead.disbursedAmount))} claimed by{" "}
            {lead.disbursementRequestedByName || "staff"}.
          </Banner>
        )}
        {lead.approvalStatus === "Rejected" && lead.rejectionReason && (
          <Banner tone="danger" icon={AlertCircle}>
            डिस्बर्समेंट नाकारले — {lead.rejectionReason}
            {lead.rejectedByName ? ` (${lead.rejectedByName})` : ""}
          </Banner>
        )}
        {lead.status === STATUS_DISBURSED && lead.approvalStatus === "Approved" && (
          <Banner tone="success" icon={CheckCircle2}>
            Confirmed disbursed · {formatINR(toAmount(lead.disbursedAmount))}
            {lead.bankName ? ` via ${lead.bankName}` : ""}
            {lead.staffIncentiveAmount
              ? ` · incentive ${formatINR(Number(lead.staffIncentiveAmount))}`
              : ""}
          </Banner>
        )}

        {!editing && (
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <AdminButton size="sm" icon={Phone} onClick={() => onCall(lead)}>
              Call
            </AdminButton>
            <AdminButton size="sm" icon={MessageSquare} onClick={() => onChat(lead)}>
              CRM chat
            </AdminButton>
            <a
              href={`https://wa.me/${whatsAppNumber(lead)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onExternalWhatsApp(lead)}
              className="admin-focus inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-xs font-semibold text-admin-text hover:bg-admin-surface-2 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>

      <div className="shrink-0 flex gap-1 px-4 border-b border-admin-border">
        {(
          [
            ["timeline", "टाइमलाइन"],
            ["details", "माहिती"],
            ["documents", files.length > 0 ? `फाईल्स (${files.length})` : "फाईल्स"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "admin-focus px-2.5 h-9 text-admin-sm border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-admin-accent text-admin-text font-semibold"
                : "border-transparent text-admin-muted hover:text-admin-text"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-admin-bg p-3 space-y-3">
        {tab === "details" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Amount" value={formatINR(toAmount(lead.amount))} />
              <Metric label="CIBIL" value={lead.cibilScore || "—"} />
              <Metric label="Income" value={formatINR(toAmount(lead.monthlyIncome))} />
            </div>

            {lead.status === "Interested" && (
              <BankerLookupCard
                // Auto-selection is a mount-time concern, so a new lead gets a
                // new card rather than one still holding the old district.
                key={lead.id}
                lead={lead}
                onSaveBankerLocation={onSaveBankerLocation}
              />
            )}

            {(lead.status === STATUS_DISBURSED || lead.status === STATUS_PENDING_APPROVAL) && (
              <SectionCard title="🏦 Disbursal details (डिस्बर्समेंट तपशील)">
                <div className="divide-y divide-admin-border p-1">
                  <FactRow label="Bank / Lender Name" value={lead.bankName || "—"} />
                  <FactRow label="Confirmed Loan Type" value={lead.type || "—"} />
                  <FactRow label="Disbursed Amount" value={formatINR(toAmount(lead.disbursedAmount))} />
                  {lead.status === STATUS_DISBURSED && lead.staffIncentiveAmount && (
                    <FactRow label="Staff Incentive" value={formatINR(Number(lead.staffIncentiveAmount))} />
                  )}
                  {lead.status === STATUS_DISBURSED && lead.partnerId && lead.connectorCommissionAmount && (
                    <FactRow label="DSA Commission" value={formatINR(Number(lead.connectorCommissionAmount))} />
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Customer details">
              <div className="divide-y divide-admin-border">
                <FactRow label="Employer" value={lead.employer || "—"} />
                <FactRow label="Occupation" value={lead.occupation || "—"} />
                <FactRow label="City / State" value={`${lead.city || "—"}, ${lead.state || "—"}`} />
                <FactRow label="Pincode" value={lead.pincode || "—"} />
                <FactRow
                  label="Existing EMIs"
                  value={lead.existingEmis ? formatINR(toAmount(lead.existingEmis)) : "—"}
                />
              </div>
            </SectionCard>

            {/*
              What the PIN code resolved to, kept apart from the editable fields
              above. `city` and `state` can be overwritten by a later WhatsApp
              answer or a staff edit; these do not move, so the file always keeps
              the location the customer's own PIN code pointed at.
            */}
            {lead.pincode && (
              <SectionCard title="📍 PIN code location (मूळ स्थान · source data)">
                <div className="divide-y divide-admin-border">
                  <FactRow label="PIN code" value={lead.pincode} />
                  <FactRow label="State" value={lead.pinState || "—"} />
                  <FactRow
                    label="District"
                    value={lead.pinDistrict ? currentDistrictName(lead.pinDistrict) : "—"}
                  />
                  <FactRow label="City" value={lead.pinCity || "—"} />
                  <FactRow label="Taluka / Sub-district" value={lead.pinTaluka || "—"} />
                  {/*
                    India Post publishes no urban/rural marker, so this is blank
                    on every lead today. It is shown rather than hidden because a
                    visible gap is the honest answer — nothing here is inferred
                    from the post office's branch type.
                  */}
                  <FactRow
                    label="Urban / Rural"
                    value={
                      lead.pinUrbanRural || (
                        <span className="text-admin-subtle">API कडून मिळाले नाही</span>
                      )
                    }
                  />
                  <FactRow label="Post office" value={lead.pinPostOffice || "—"} />
                  <FactRow label="Address" value={lead.pinAddress || "—"} />
                  {(lead.bankerState || lead.bankerDistrict) && (
                    <FactRow
                      label="Banker search set to"
                      value={
                        [lead.bankerDistrict, lead.bankerState].filter(Boolean).join(", ") || "—"
                      }
                    />
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Lead management">
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Agent assigned">
                  {canAssign ? (
                    <Select
                      value={assignedOption}
                      onChange={e => {
                        const agent = telecallers.find(t => ownerIdOf(t) === e.target.value)
                        onAssign(lead.id, e.target.value, agent?.name || "").catch(err => {
                          console.error("Assignment failed:", err)
                          toast.push({ tone: "danger", title: "Failed to assign agent" })
                        })
                      }}
                    >
                      <option value="">-- Unassigned / claim lead --</option>
                      {telecallers.map(agent => (
                        <option key={agent.id} value={ownerIdOf(agent)}>
                          {agent.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <p className="h-9 px-3 flex items-center bg-admin-surface-2 border border-admin-border rounded-admin-sm text-admin-sm text-admin-muted truncate">
                      {lead.assignedToName || "Unassigned — claim by calling or starting a chat"}
                    </p>
                  )}
                </Field>

                <Field label="Next follow-up">
                  <TextInput
                    type="datetime-local"
                    defaultValue={typeof lead.followUpDate === "string" ? lead.followUpDate : ""}
                    onChange={e => {
                      onFollowUpDate(lead.id, e.target.value).catch(err =>
                        console.error("Failed to update follow-up date:", err)
                      )
                    }}
                  />
                </Field>

                <Field label="Follow-up कारण (reason)" className="sm:col-span-2">
                  <TextInput
                    defaultValue={lead.followUpReason || ""}
                    placeholder="उदा. कस्टमर पुढील आठवड्यात फाईल देणार आहे…"
                    onBlur={e => {
                      onFollowUpReason(lead.id, e.target.value).catch(err =>
                        console.error("Failed to update follow-up reason:", err)
                      )
                    }}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Attribution & source">
              <div className="divide-y divide-admin-border">
                <FactRow label="Lead source" value={lead.source || "Website"} />
                <FactRow label="Campaign" value={lead.campaign || "Organic"} />
                <FactRow label="UTM source" value={lead.utmSource || "direct"} />
                {lead.partnerName && <FactRow label="DSA partner" value={lead.partnerName} />}
              </div>
            </SectionCard>

            <SectionCard title="नोट · Quick note">
              <div className="p-3 space-y-2">
                <TextArea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="उदा. कस्टमर पुढील आठवड्यात फाईल देणार आहे…"
                />
                <AdminButton
                  variant="primary"
                  icon={Save}
                  className="w-full"
                  loading={savingNote}
                  disabled={!note.trim()}
                  onClick={saveNote}
                >
                  Save note
                </AdminButton>
              </div>
            </SectionCard>

            {/*
              Restore is the Admin's counterpart to Delete and only appears on a
              lead that has been deleted — which is a lead no other role can
              open at all.
            */}
            {isAdmin && lead.deleted && (
              <div className="rounded-admin border border-admin-border bg-admin-surface-2 p-3 space-y-2">
                <p className="text-admin-xs text-admin-muted">
                  ही लीड काढून टाकली आहे{lead.deletedByName ? ` — ${lead.deletedByName}` : ""}. फक्त
                  Admin ला ती दिसते.
                </p>
                <AdminButton
                  variant="secondary"
                  icon={RotateCcw}
                  className="w-full"
                  onClick={async () => {
                    try {
                      await onRestore(lead.id)
                      toast.push({ tone: "success", title: "Lead restored" })
                      onClose()
                    } catch (e) {
                      console.error(e)
                      toast.push({ tone: "danger", title: "लीड परत आणताना त्रुटी आली" })
                    }
                  }}
                >
                  Restore lead
                </AdminButton>
              </div>
            )}

            {canDelete &&
              !lead.deleted &&
              (confirmDelete ? (
                <div className="flex items-center gap-2 bg-tone-danger border border-tone-danger-bd rounded-admin p-3">
                  <p className="text-admin-xs text-tone-danger-fg flex-1">
                    ही लीड काढून टाकायची? Delete this lead?
                  </p>
                  <AdminButton size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      try {
                        await onDelete(lead.id)
                        toast.push({ tone: "success", title: "Lead deleted successfully" })
                        onClose()
                      } catch (e) {
                        console.error(e)
                        toast.push({ tone: "danger", title: "लीड काढताना त्रुटी आली" })
                      }
                    }}
                  >
                    Delete
                  </AdminButton>
                </div>
              ) : (
                <AdminButton
                  variant="ghost"
                  icon={Trash2}
                  className="w-full text-tone-danger-fg"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete lead
                </AdminButton>
              ))}
          </>
        )}

        {tab === "timeline" && (
          <>
            {/*
              Status lives here as well as on the header pill. The timeline is
              the tab staff land on, and the whole point of reading it is to
              decide where the file goes next — making them scroll back up to a
              small pill to act on that reading was the wrong way round.
            */}
            <SectionCard title="सद्य स्टेटस · Current status">
              <div className="p-3 flex items-center gap-2.5 flex-wrap">
                <StatusBadge status={lead.status} dot size="md" />
                <span className="text-admin-xs text-admin-subtle flex-1 min-w-0 truncate">
                  {lead.updatedAt
                    ? `Updated ${timeAgo(lead.updatedAt, now)}`
                    : "Not moved since it arrived"}
                </span>
                <AdminButton
                  size="sm"
                  variant="primary"
                  icon={ArrowUpRight}
                  onClick={() => onOpenStatusPicker(lead)}
                >
                  स्टेटस बदला
                </AdminButton>
              </div>
            </SectionCard>

            {lead.status === "Interested" && (
              <BankerLookupCard
                // Auto-selection is a mount-time concern, so a new lead gets a
                // new card rather than one still holding the old district.
                key={lead.id}
                lead={lead}
                onSaveBankerLocation={onSaveBankerLocation}
              />
            )}

            {(lead.status === STATUS_DISBURSED || lead.status === STATUS_PENDING_APPROVAL) && (
              <SectionCard title="🏦 Disbursal details (डिस्बर्समेंट तपशील)">
                <div className="divide-y divide-admin-border p-1">
                  <FactRow label="Bank / Lender Name" value={lead.bankName || "—"} />
                  <FactRow label="Confirmed Loan Type" value={lead.type || "—"} />
                  <FactRow label="Disbursed Amount" value={formatINR(toAmount(lead.disbursedAmount))} />
                  {lead.status === STATUS_DISBURSED && lead.staffIncentiveAmount && (
                    <FactRow label="Staff Incentive" value={formatINR(Number(lead.staffIncentiveAmount))} />
                  )}
                  {lead.status === STATUS_DISBURSED && lead.partnerId && lead.connectorCommissionAmount && (
                    <FactRow label="DSA Commission" value={formatINR(Number(lead.connectorCommissionAmount))} />
                  )}
                </div>
              </SectionCard>
            )}

            {stageHistory.length > 0 && (
              <SectionCard title="Stage history">
                <ul className="divide-y divide-admin-border">
                  {stageHistory.map(entry => (
                    <li key={entry.status} className="flex items-center gap-2.5 px-3.5 py-2">
                      <StatusBadge status={entry.status} dot />
                      <span className="text-admin-2xs text-admin-subtle flex-1 truncate">
                        {entry.at ? `${formatDayShort(entry.at)} ${formatTime(entry.at)}` : ""}
                      </span>
                      {entry.duration && (
                        <span className="admin-num text-admin-2xs text-admin-muted shrink-0">
                          took {entry.duration}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            <SectionCard title="Activity">
              {visibleActivities.length === 0 ? (
                <EmptyState size="sm" icon={History} title="No activities logged yet" />
              ) : (
                <ul className="divide-y divide-admin-border">
                  {visibleActivities.map(activity => {
                    const Icon = ACTIVITY_ICONS[activity.type || ""] || Clock
                    return (
                      <li key={activity.id} className="flex gap-2.5 px-3.5 py-2.5">
                        <span className="w-7 h-7 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-muted flex items-center justify-center shrink-0">
                          <Icon size={13} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-admin-xs font-semibold text-admin-text">
                              {activity.type}
                            </span>
                            <span className="text-admin-2xs text-admin-subtle shrink-0">
                              {timeAgo(activity.timestamp, now)}
                            </span>
                          </div>
                          <p className="text-admin-sm text-admin-text mt-0.5 break-words">
                            {activity.note}
                          </p>
                          <p className="text-admin-2xs text-admin-subtle mt-0.5">{activity.userName}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Origin">
              <div className="flex gap-2.5 px-3.5 py-2.5">
                <span className="w-7 h-7 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-muted flex items-center justify-center shrink-0">
                  <Plus size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-admin-xs font-semibold text-admin-text">Lead captured</span>
                    <span className="text-admin-2xs text-admin-subtle shrink-0">
                      {formatDayShort(lead.createdAt)} {formatTime(lead.createdAt)}
                    </span>
                  </div>
                  <p className="text-admin-sm text-admin-muted mt-0.5">
                    via {lead.source || "Digital channel"}
                    {lead.category === "Partner" && lead.partnerName
                      ? ` · Partner: ${lead.partnerName}`
                      : ""}
                  </p>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {tab === "documents" && (
          files.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="अजून कोणतीही फाईल नाही"
              description="कस्टमरने WhatsApp वर पाठवलेले फोटो आणि कागदपत्रे इथे आपोआप दिसतील."
            />
          ) : (
            <SectionCard title={`फाईल्स (${files.length})`}>
              <div className="divide-y divide-admin-border">
                {files.map(file => (
                  <LeadFileRow
                    key={file.id}
                    file={file}
                    customerName={leadName(lead)}
                  />
                ))}
              </div>
            </SectionCard>
          )
        )}
      </div>
    </Sheet>
  )
}

/**
 * One file on the lead's thread.
 *
 * A row with an empty `mediaUrl` is shown rather than hidden: it means the
 * webhook logged the message but `handleIncomingMedia` could not save the file,
 * and staff need to know a document arrived that they cannot open — silently
 * dropping it looks identical to the customer never having sent anything.
 */
function LeadFileRow({
  file,
  customerName,
}: {
  file: LeadFile
  customerName: string
}) {
  const from =
    file.sender === "customer"
      ? customerName
      : file.sender === "bot"
        ? "TechStar bot"
        : file.userName || "Staff"

  const isImage = file.mediaType === "image"
  // The caption doubles as the text body, so for a document it is usually just
  // "📄 <filename>" — the real filename is the better label when there is one.
  const title = file.filename || file.caption || (isImage ? "फोटो" : "कागदपत्र")

  const preview = (
    <span className="w-12 h-12 shrink-0 rounded-admin-sm border border-admin-border bg-admin-surface-2 overflow-hidden inline-flex items-center justify-center">
      {isImage && file.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.mediaUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : file.mediaUrl ? (
        <FileText size={18} className="text-admin-muted" />
      ) : (
        <AlertCircle size={18} className="text-tone-warn-fg" />
      )}
    </span>
  )

  const body = (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-admin-sm font-medium text-admin-text">
        {title}
      </span>
      <span className="block truncate text-admin-2xs text-admin-subtle mt-0.5">
        {from} · {formatDayShort(file.timestamp)} {formatTime(file.timestamp)}
      </span>
      {/* Only worth repeating when it says something the title does not. */}
      {file.caption && file.caption !== title && (
        <span className="block truncate text-admin-xs text-admin-muted mt-0.5">
          {file.caption}
        </span>
      )}
    </span>
  )

  if (!file.mediaUrl) {
    return (
      <div className="flex items-center gap-3 p-3">
        {preview}
        {body}
        <span className="shrink-0 text-admin-2xs text-tone-warn-fg text-right max-w-28">
          फाईल सेव्ह होऊ शकली नाही
        </span>
      </div>
    )
  }

  return (
    <a
      href={file.mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="admin-focus flex items-center gap-3 p-3 hover:bg-admin-surface-2 transition-colors"
    >
      {preview}
      {body}
      <Download size={16} className="shrink-0 text-admin-muted" />
    </a>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-admin-surface border border-admin-border rounded-admin p-3 min-w-0">
      <p className="text-admin-2xs uppercase tracking-wide text-admin-subtle">{label}</p>
      <p className="admin-num text-admin-base font-semibold text-admin-text mt-0.5 truncate">{value}</p>
    </div>
  )
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "warn" | "danger" | "success"
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  const classes = {
    warn: "bg-tone-warn border-tone-warn-bd text-tone-warn-fg",
    danger: "bg-tone-danger border-tone-danger-bd text-tone-danger-fg",
    success: "bg-tone-success border-tone-success-bd text-tone-success-fg",
  }[tone]

  return (
    <div className={cn("mt-3 flex items-start gap-2 rounded-admin-sm border px-3 py-2", classes)}>
      <Icon size={14} className="shrink-0 mt-0.5" />
      <p className="text-admin-xs leading-relaxed">{children}</p>
    </div>
  )
}
