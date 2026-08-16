"use client"

import React, { useMemo, useState } from "react"
import { MapPin, MessageSquare, Phone, ShieldCheck, UserPlus } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useLeads, Lead } from "@/lib/hooks/useLeads"
import { useUsers } from "@/lib/hooks/useUsers"
import { useNow } from "@/lib/hooks/useNow"
import { useViewerIdentity } from "@/lib/hooks/useViewerIdentity"
import { can, canSeeLead } from "@/lib/permissions"
import { currentDistrictName } from "@/lib/locationMatch"
import { formatDayShort, formatTime, timeAgo, toMillis } from "@/lib/dates"
import { cn } from "@/lib/utils"
import {
  AdminButton,
  EmptyState,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  useToast,
} from "@/components/admin/ui"
import { useLeadMutations } from "@/components/admin/leads/useLeadMutations"
import { LeadDetailSheet } from "@/components/admin/leads/LeadDetailSheet"
import {
  STATUS_SYSTEM_QUALIFIED,
  leadName,
  leadPhone,
  whatsAppNumber,
} from "@/components/admin/leads/leadFilters"

type Scope = "unassigned" | "mine" | "all"

/**
 * The queue of leads the WhatsApp bot qualified on its own.
 *
 * These are leads that answered every question and passed, but that no staff
 * member has touched — the reason they get a screen of their own rather than
 * living inside the general Leads table, where they would sit among hundreds of
 * half-finished files.
 *
 * There is no "assign" button here on purpose. Acting on an unassigned lead —
 * calling it, opening its chat, moving its status — claims it through the CRM's
 * existing auto-claim rule (`shouldAutoClaimLead`), so ownership follows whoever
 * actually did the work, and a second staff member cannot take it afterwards.
 */
export default function SystemQualifiedLeadsPage() {
  const { role } = useAuth()
  const { leads, loading } = useLeads()
  const { users } = useUsers()
  const viewer = useViewerIdentity()
  const mutations = useLeadMutations()
  const toast = useToast()
  const now = useNow()

  const [scope, setScope] = useState<Scope>("unassigned")
  const [selected, setSelected] = useState<Lead | null>(null)

  // Anyone still on the team; a deactivated account must not be assignable.
  const telecallers = useMemo(() => users.filter(u => u.status !== "Inactive"), [users])
  const canAssign = can(role, "leads:assign")
  const canDelete = can(role, "leads:delete")

  /** Newest qualification first — the freshest lead is the one worth calling. */
  const qualified = useMemo(
    () =>
      leads
        .filter(l => l.status === STATUS_SYSTEM_QUALIFIED)
        .filter(l => canSeeLead(role, l, viewer))
        .sort(
          (a, b) =>
            (toMillis(b.qualifiedAt ?? b.updatedAt) ?? 0) -
            (toMillis(a.qualifiedAt ?? a.updatedAt) ?? 0)
        ),
    [leads, role, viewer]
  )

  const counts = useMemo(
    () => ({
      unassigned: qualified.filter(l => !l.assignedTo).length,
      mine: qualified.filter(l => l.assignedTo && viewer.tokens.includes(l.assignedTo.toLowerCase()))
        .length,
      all: qualified.length,
    }),
    [qualified, viewer]
  )

  const rows = useMemo(() => {
    if (scope === "unassigned") return qualified.filter(l => !l.assignedTo)
    if (scope === "mine") {
      return qualified.filter(
        l => l.assignedTo && viewer.tokens.includes(l.assignedTo.toLowerCase())
      )
    }
    return qualified
  }, [qualified, scope, viewer])

  // The lead currently on screen, re-read from the live list so a claim made
  // inside the sheet is reflected the moment Firestore confirms it.
  const selectedLive = useMemo(
    () => (selected ? leads.find(l => l.id === selected.id) || null : null),
    [selected, leads]
  )

  /** Placing a call claims the lead — see the note at the top of this file. */
  const handleCall = async (lead: Lead) => {
    const phone = leadPhone(lead)
    if (!phone) return
    try {
      await mutations.registerContact(lead, "Call", `Placed a quick call to ${leadName(lead)}`)
    } catch (err) {
      console.error("Failed to record the call:", err)
    }
    window.location.href = `tel:${phone}`
  }

  const handleWhatsApp = async (lead: Lead) => {
    try {
      await mutations.registerContact(
        lead,
        "WhatsApp",
        `Opened direct WhatsApp with ${leadName(lead)}`
      )
    } catch (err) {
      console.error("Failed to record the chat:", err)
    }
  }

  const columns: [string, string][] = [
    ["Customer", "ग्राहक"],
    ["Mobile", "मोबाईल"],
    ["Loan Type", "प्रकार"],
    ["Location", "स्थान"],
    ["Source", "स्रोत"],
    ["Qualification", "पात्रता"],
    ["Qualified at", "वेळ"],
    ["Staff", "स्टाफ"],
    ["Status", "स्टेटस"],
  ]

  return (
    <div className="p-3 sm:p-4">
      <PageHeader
        title="System Qualified Leads"
        subtitle="WhatsApp बॉटने सर्व प्रश्न पूर्ण करून पात्र ठरवलेल्या लीड्स. पहिला कॉल किंवा चॅट करणाऱ्या स्टाफकडे लीड आपोआप जाते."
        breadcrumbs={[{ label: "Work" }, { label: "System Qualified" }]}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              ["unassigned", `Unassigned (${counts.unassigned})`],
              ["mine", `My leads (${counts.mine})`],
              ["all", `All (${counts.all})`],
            ] as [Scope, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={cn(
                "admin-focus h-8 px-3 rounded-admin-sm border text-admin-xs font-semibold transition-colors",
                scope === id
                  ? "bg-admin-accent-soft border-admin-accent text-admin-text"
                  : "bg-admin-surface border-admin-border text-admin-muted hover:text-admin-text"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeader>

      {loading ? (
        <SkeletonRows rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="या यादीत सध्या लीड नाही"
          description={
            scope === "unassigned"
              ? "बॉटने पात्र ठरवलेली प्रत्येक लीड कोणत्या ना कोणत्या स्टाफकडे गेली आहे."
              : "WhatsApp बॉट सर्व प्रश्न पूर्ण करेल तेव्हा लीड इथे दिसेल."
          }
        />
      ) : (
        <>
          {/* Desktop: the full column set the qualification queue is reviewed on. */}
          <div className="hidden lg:block bg-admin-surface border border-admin-border rounded-admin overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-admin-sm">
                <thead className="bg-admin-surface-2 border-b border-admin-border">
                  <tr>
                    {columns.map(([en, mr]) => (
                      <th
                        key={en}
                        className="px-3 py-2 text-left text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted whitespace-nowrap"
                      >
                        {en} <span className="font-normal text-admin-subtle">{mr}</span>
                      </th>
                    ))}
                    <th className="px-3 py-2 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {rows.map(lead => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="cursor-pointer hover:bg-admin-surface-2 transition-colors"
                    >
                      <td className="px-3 py-2 font-semibold text-admin-text max-w-[180px] truncate">
                        {leadName(lead)}
                      </td>
                      <td className="px-3 py-2 admin-num whitespace-nowrap">{leadPhone(lead) || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{lead.type || "—"}</td>
                      <td className="px-3 py-2 max-w-[220px]">
                        <LocationCell lead={lead} />
                      </td>
                      <td className="px-3 py-2 text-admin-muted whitespace-nowrap">
                        {lead.source || "—"}
                      </td>
                      <td className="px-3 py-2 text-admin-xs text-admin-muted max-w-[260px] truncate">
                        {lead.qualificationDetails || "—"}
                      </td>
                      <td className="px-3 py-2 text-admin-xs text-admin-muted whitespace-nowrap">
                        {lead.qualifiedAt
                          ? `${formatDayShort(lead.qualifiedAt)} ${formatTime(lead.qualifiedAt)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {lead.assignedToName || (
                          <span className="inline-flex items-center gap-1 text-tone-warn-fg font-semibold text-admin-xs">
                            <UserPlus size={12} /> Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={lead.status} dot />
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <RowActions
                          lead={lead}
                          onCall={handleCall}
                          onWhatsApp={handleWhatsApp}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: one card per lead. Telecallers work this screen on a phone. */}
          <div className="lg:hidden space-y-2">
            {rows.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelected(lead)}
                className="bg-admin-surface border border-admin-border rounded-admin p-3 space-y-2 cursor-pointer active:bg-admin-surface-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-admin-text truncate">{leadName(lead)}</p>
                    <p className="admin-num text-admin-xs text-admin-muted">
                      {leadPhone(lead) || "—"}
                    </p>
                  </div>
                  <StatusBadge status={lead.status} dot />
                </div>

                <LocationCell lead={lead} />

                <div className="flex items-center gap-2 flex-wrap text-admin-xs text-admin-muted">
                  <span className="font-semibold text-admin-text">{lead.type || "—"}</span>
                  {lead.qualifiedAt && <span>· {timeAgo(lead.qualifiedAt, now)}</span>}
                  <span>· {lead.source || "—"}</span>
                </div>

                {lead.qualificationDetails && (
                  <p className="text-admin-xs text-admin-subtle line-clamp-2">
                    {lead.qualificationDetails}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-admin-border">
                  <span className="text-admin-xs">
                    {lead.assignedToName || (
                      <span className="inline-flex items-center gap-1 text-tone-warn-fg font-semibold">
                        <UserPlus size={12} /> Unassigned
                      </span>
                    )}
                  </span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActions lead={lead} onCall={handleCall} onWhatsApp={handleWhatsApp} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedLive && (
        <LeadDetailSheet
          lead={selectedLive}
          now={now}
          onClose={() => setSelected(null)}
          onOpenStatusPicker={() => {}}
          onCall={handleCall}
          onChat={handleWhatsApp}
          onExternalWhatsApp={handleWhatsApp}
          telecallers={telecallers}
          canAssign={canAssign}
          canDelete={canDelete}
          onAssign={mutations.assignAgent}
          onFollowUpDate={mutations.setFollowUpDate}
          onFollowUpReason={mutations.setFollowUpReason}
          onSaveDetails={mutations.saveDetails}
          onSaveNote={async (lead, note) => {
            const result = await mutations.saveNote(lead, note)
            toast.push({ tone: "success", title: "नोट सेव्ह झाली" })
            return result
          }}
          onDelete={mutations.deleteLead}
          onRestore={mutations.restoreLead}
          onSaveBankerLocation={mutations.saveBankerLocation}
        />
      )}
    </div>
  )
}

/** PIN code first, because it is what the district and city were derived from. */
function LocationCell({ lead }: { lead: Lead }) {
  const parts = [
    lead.pinCity || lead.city,
    lead.pinDistrict ? currentDistrictName(lead.pinDistrict) : "",
    lead.pinState || lead.state,
  ]
    .filter(Boolean)
    .filter((part, i, all) => all.indexOf(part) === i)

  if (!lead.pincode && parts.length === 0) {
    return <span className="text-admin-subtle">—</span>
  }

  return (
    <span className="flex items-center gap-1 text-admin-xs min-w-0">
      <MapPin size={11} className="text-admin-accent shrink-0" />
      {lead.pincode && <span className="admin-num font-semibold shrink-0">{lead.pincode}</span>}
      {parts.length > 0 && (
        <span className="text-admin-muted truncate">{parts.join(", ")}</span>
      )}
      {lead.pinUrbanRural && (
        <span className="text-admin-subtle shrink-0">· {lead.pinUrbanRural}</span>
      )}
    </span>
  )
}

/**
 * Call and WhatsApp, the two actions that claim an unassigned lead. Both are
 * plain links so the phone's dialer and WhatsApp open as they normally would;
 * the claim is recorded on the way out.
 */
function RowActions({
  lead,
  onCall,
  onWhatsApp,
}: {
  lead: Lead
  onCall: (lead: Lead) => void
  onWhatsApp: (lead: Lead) => void
}) {
  const phone = leadPhone(lead)
  if (!phone) return null

  return (
    <div className="flex items-center gap-1.5">
      <AdminButton
        size="sm"
        variant="ghost"
        icon={Phone}
        aria-label={`Call ${leadName(lead)}`}
        onClick={() => onCall(lead)}
      />
      <a
        href={`https://wa.me/${whatsAppNumber(lead)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onWhatsApp(lead)}
        aria-label={`WhatsApp ${leadName(lead)}`}
        className="admin-focus inline-flex items-center justify-center h-8 w-8 rounded-admin-sm bg-wa-header text-white hover:opacity-90 transition-opacity"
      >
        <MessageSquare size={14} />
      </a>
    </div>
  )
}
