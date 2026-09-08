"use client"

import { useCallback, useMemo } from "react"
import { authedFetch, authedJson } from "@/lib/authedFetch"
import { useAuth } from "@/context/AuthContext"
import { Lead, invalidateLeadsCache, logLeadActivity } from "@/lib/hooks/useLeads"
import { leadPhone, PRE_CONTACT_STATUSES } from "@/components/admin/leads/leadFilters"
import { shouldAutoClaimLead } from "@/lib/permissions"
import { buildStatusTransition, requestDisbursementApproval } from "@/lib/disbursement"

/**
 * Every write the leads screen performs, in one place.
 *
 * Two rules are baked into each mutation and must not be bypassed:
 *  1. A telecaller's first real contact with an unassigned lead claims it
 *     (`shouldAutoClaimLead`), so the incentive follows whoever worked the file.
 *  2. Marking a file disbursed never books the disbursal — it raises a request
 *     for a Manager to sign off.
 *
 * Every write here goes through an API route.
 */

/**
 * One lead update, through `PATCH /api/leads/{id}`.
 *
 * The route stamps `updatedAt` and the actor from the verified token, so a caller
 * sends only the fields it is actually changing. It answers `{ success: false,
 * error }` rather than throwing, so the failure is re-thrown here and every call
 * site keeps the single try/catch it already had around the Firestore write.
 */
async function patchLead(leadId: string, lead: Record<string, unknown>): Promise<void> {
  const response = await authedJson(`/api/leads/${encodeURIComponent(leadId)}`, "PATCH", { lead })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Could not update this lead.")
  }
}

export function useLeadMutations() {
  const { user, profile, adminRole, role } = useAuth()

  const staffName = profile?.name || user?.displayName || user?.email || "Unknown"

  /** Label written into the activity timeline. */
  const staffLabel = useMemo(
    () =>
      user?.email === "swapnil.r.aher@gmail.com"
        ? "Swapnil Aher (Super Admin)"
        : `${staffName} (${adminRole || "Staff"})`,
    [user?.email, staffName, adminRole]
  )

  /** Ownership fields to merge when this touch should claim the lead. */
  const claimFor = useCallback(
    (lead: Lead) =>
      shouldAutoClaimLead(role, lead)
        ? { assignedTo: user?.uid || null, assignedToName: staffName }
        : {},
    [role, user?.uid, staffName]
  )

  const updateStatus = useCallback(
    async (lead: Lead, newStatus: string) => {
      const nowIso = new Date().toISOString()
      await patchLead(lead.id, {
        status: newStatus,
        followUpDate: null,
        followUpReason: null,
        statusUpdatedAt: nowIso,
        lastActivityNote: `Changed status to ${newStatus}`,
        lastActivityType: "Status Update",
        lastActivityUser: staffName,
        lastActivityTime: nowIso,
        ...claimFor(lead),
        ...buildStatusTransition(lead, newStatus),
      })
      await logLeadActivity(lead.id, "Status Update", `Changed status to ${newStatus}`, staffLabel)
    },
    [claimFor, staffName, staffLabel]
  )

  /**
   * Shared by the call and chat buttons: clears the follow-up, claims the lead
   * and moves a brand-new file to Contacted.
   */
  const registerContact = useCallback(
    async (lead: Lead, kind: "Call" | "WhatsApp", note: string) => {
      const payload: Record<string, unknown> = {
        followUpDate: null,
        followUpReason: null,
        ...claimFor(lead),
      }
      if (PRE_CONTACT_STATUSES.includes(lead.status)) {
        payload.status = "Contacted"
        payload.statusUpdatedAt = new Date().toISOString()
      }

      await patchLead(lead.id, payload)
      await logLeadActivity(lead.id, kind, note, staffLabel)
      return payload
    },
    [claimFor, staffLabel]
  )

  const assignAgent = useCallback(
    async (leadId: string, agentId: string, agentName: string) => {
      await patchLead(leadId, {
        assignedTo: agentId || null,
        assignedToName: agentName || null,
      })
      await logLeadActivity(
        leadId,
        "Status Update",
        agentId ? `Re-assigned lead to staff: ${agentName}` : "Unassigned lead",
        staffLabel
      )
    },
    [staffLabel]
  )

  const setFollowUpDate = useCallback(
    async (leadId: string, dateString: string) => {
      // A `datetime-local` value, stored as the local-time string the picker
      // hands back — the same string the picker is later re-populated from.
      await patchLead(leadId, { followUpDate: dateString || null })
      if (dateString) {
        await logLeadActivity(
          leadId,
          "Status Update",
          `Set next follow-up date to: ${new Date(dateString).toLocaleString("en-IN")}`,
          staffLabel
        )
      }
    },
    [staffLabel]
  )

  const setFollowUpReason = useCallback(async (leadId: string, reason: string) => {
    await patchLead(leadId, { followUpReason: reason || null })
  }, [])

  const saveDetails = useCallback(
    async (lead: Lead, edits: { name: string; type: string; amount: string }) => {
      /**
       * `updatedAt` is sent here even though the route stamps its own: pressing
       * Save with nothing edited and nothing to claim would otherwise send an
       * empty object, which the route rejects as "Nothing to update" — and a
       * no-op save has always been a silent success that bumps the lead.
       */
      const payload: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
        ...claimFor(lead),
      }
      const changes: string[] = []

      const currentName = lead.panName || lead.fullName || lead.name
      let renamedTo = ""
      if (edits.name.trim() && edits.name !== currentName) {
        const next = edits.name.trim()
        payload.name = next
        payload.fullName = next
        payload.panName = next
        renamedTo = next
        changes.push(`Name → ${next}`)
      }
      if (edits.type.trim() && edits.type !== lead.type) {
        payload.type = edits.type.trim()
        changes.push(`Loan Type → ${edits.type.trim()}`)
      }
      if (edits.amount.trim() && edits.amount !== lead.amount) {
        payload.amount = edits.amount.trim()
        changes.push(`Amount → ₹${Number(edits.amount).toLocaleString("en-IN")}`)
      }
      if (payload.assignedTo) changes.push(`Assigned to ${payload.assignedToName} (Claimed)`)

      await patchLead(lead.id, payload)

      /**
       * The WhatsApp side keeps its own copy of the customer's name: the bot
       * session it greets them by, and the `userName` stamped on every message
       * it has already stored. Renaming a lead here has to reach the session,
       * or the inbox and the bot keep addressing the customer by the name the
       * CRM no longer uses. (The inbox reads the CRM name for display; this is
       * what the *bot* says.)
       *
       * Keeps the bot's copy of the name in step with the lead's.
       */
      if (renamedTo) {
        const phone = leadPhone(lead).replace(/\D/g, "")
        const local = phone.length === 12 && phone.startsWith("91") ? phone.slice(2) : phone
        if (local) {
          // The session only exists while a bot conversation is in flight, so a
          // missing one is the normal case rather than an error worth surfacing.
          await authedJson("/api/wa-sessions", "PATCH", {
            phone: local,
            session: { name: renamedTo },
          }).catch(error => console.debug("No live WhatsApp session to rename:", error))
        }
      }

      if (changes.length > 0) {
        await logLeadActivity(lead.id, "Edit", `Updated: ${changes.join(", ")}`, staffLabel)
      }
      return payload
    },
    [claimFor, staffLabel]
  )

  const saveNote = useCallback(
    async (lead: Lead, note: string) => {
      const payload: Record<string, unknown> = {
        followUpDate: null,
        followUpReason: null,
        ...claimFor(lead),
      }
      await patchLead(lead.id, payload)
      await logLeadActivity(lead.id, "Note", note.trim(), staffLabel, { manual: true })
      return payload
    },
    [claimFor, staffLabel]
  )

  /**
   * Deletes a lead from everyone's point of view without deleting anything.
   *
   * The document stays exactly where it was, keeping its status, its owner and
   * its timeline; `deleted` hides it from every screen (`useLeads`). That is
   * what makes it safe to let a telecaller do this: a wrong number cleared at
   * 9pm is still recoverable, and an Admin is the only person who can see it or
   * put it back.
   *
   * No reason is asked for and none is stored — the staff member is told the
   * lead is deleted and nothing else. `deletedBy` is for the Admin restoring it,
   * not for the person who pressed the button.
   */
  const deleteLead = useCallback(
    async (leadId: string) => {
      /**
       * `updatedAt` is not sent — it used to be deliberately left untouched so a
       * deleted lead would not jump to the top of the Admin's list. `PATCH
       * /api/leads/{id}` now stamps it on every write, so that no longer holds:
       * keeping it out of the payload is as close as this can get without a
       * route that accepts an update opting out of the stamp.
       */
      await patchLead(leadId, {
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user?.uid || null,
        deletedByName: staffName,
      })
    },
    [user?.uid, staffName]
  )

  /**
   * Admin only, by the UI: the Restore button appears on a deleted lead, and a
   * deleted lead is one no other role can open. `PATCH /api/leads/{id}` accepts
   * any signed-in staff member, so this is no longer enforced by the datastore
   * the way `firestore.rules` used to enforce it.
   */
  const restoreLead = useCallback(
    async (leadId: string) => {
      await patchLead(leadId, {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedByName: null,
      })
      await logLeadActivity(leadId, "Status Update", "Restored a deleted lead", staffLabel)
    },
    [staffLabel]
  )

  const requestDisbursal = useCallback(
    async (lead: Lead, amount: number, bankId: string, productType: string) => {
      let bankName = ""
      if (bankId) {
        try {
          const response = await authedFetch("/api/banks")
          const payload = await response.json().catch(() => null)
          if (response.ok && payload?.success) {
            const banks = (payload.banks || []) as { id: string; name?: string }[]
            bankName = banks.find(bank => bank.id === bankId)?.name || ""
          }
        } catch (err) {
          console.error("Failed to fetch bank name during request:", err)
        }
      }

      await requestDisbursementApproval(
        lead,
        amount,
        { uid: user?.uid, name: staffName, email: user?.email, label: staffLabel },
        {
          ...claimFor(lead),
          bankId: bankId || null,
          bankName: bankName || null,
          type: productType || lead.type || "Personal Loan",
        }
      )
    },
    [user?.uid, user?.email, staffName, staffLabel, claimFor]
  )

  /** Saves the remark captured after a call or chat, plus the next follow-up and status. */
  const saveFollowUpRemark = useCallback(
    async (
      lead: Lead,
      input: { type: string; remark: string; followUpDate: string; followUpReason: string; status?: string }
    ) => {
      // Typed by hand into the post-call prompt, so it counts as a real note.
      await logLeadActivity(lead.id, input.type, input.remark, staffLabel, { manual: true })

      const nowIso = new Date().toISOString()
      const payload: Record<string, unknown> = {
        lastActivityNote: input.remark.trim(),
        lastActivityType: input.type,
        lastActivityUser: staffName,
        lastActivityTime: nowIso,
      }

      if (input.status && input.status !== lead.status) {
        payload.status = input.status
        payload.statusUpdatedAt = nowIso
        await logLeadActivity(lead.id, "Status Update", `Changed status to ${input.status}`, staffLabel)
      } else if (PRE_CONTACT_STATUSES.includes(lead.status)) {
        payload.status = "Contacted"
        payload.statusUpdatedAt = nowIso
      }

      if (input.followUpDate) {
        payload.followUpDate = input.followUpDate
        await logLeadActivity(
          lead.id,
          "Status Update",
          `Set next follow-up date to: ${new Date(input.followUpDate).toLocaleString("en-IN")}`,
          staffLabel
        )
      }
      if (input.followUpReason) payload.followUpReason = input.followUpReason

      await patchLead(lead.id, payload)
      return payload
    },
    [staffLabel, staffName]
  )

  const setBotMuted = useCallback(async (leadId: string, muted: boolean) => {
    await patchLead(leadId, { botMuted: muted })
  }, [])

  /**
   * Re-points a lead's banker search at a different state or district.
   *
   * Writes only `bankerState` / `bankerDistrict`. The `pin*` fields — what the
   * customer's PIN code actually resolved to — are never touched here, which is
   * the whole reason the two are stored separately: staff can search bankers
   * wherever the file needs to go without rewriting the customer's location.
   *
   * `updatedAt` is not sent, for the same reason it never was: re-pointing a
   * search should not bump the lead up the work queue. The route stamps it
   * anyway, so that intent now survives only in what this asks for.
   */
  const saveBankerLocation = useCallback(
    async (leadId: string, state: string, district: string) => {
      await patchLead(leadId, {
        bankerState: state || null,
        bankerDistrict: district || null,
      })
    },
    []
  )

  /**
   * A lead typed in by hand — walk-ins and phone enquiries that never touched
   * the landing page.
   *
   * The duplicate check that used to run here has moved into `POST /api/leads`,
   * which matches an existing lead on either phone field and updates it in place
   * rather than creating a second file. The route answers with `id` for a new
   * lead and `leadId` for one it updated, which is how the two are told apart.
   *
   * The route writes a fixed field set and has no owner field, so `assignedTo` /
   * `assignedToName` are accepted from the form but not yet stored: a manually
   * entered lead lands unassigned until the route carries them.
   */
  const createLead = useCallback(
    async (input: {
      name: string
      phone: string
      email?: string
      city?: string
      type: string
      amount?: string
      assignedTo?: string
      assignedToName?: string
    }) => {
      const response = await authedJson("/api/leads", "POST", {
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || "",
        city: input.city?.trim() || "",
        type: input.type,
        amount: String(input.amount ?? "0").trim() || "0",
        status: "New Lead",
        category: "Portal",
        source: "Manual Entry",
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Could not save this lead.")
      }

      const createdId = String(payload.id || "")
      const updatedId = String(payload.leadId || "")

      if (createdId) {
        await logLeadActivity(createdId, "Note", `Lead created manually by ${staffName}`, staffLabel)
      } else if (updatedId) {
        await logLeadActivity(
          updatedId,
          "Note",
          `Lead details updated manually by ${staffName}`,
          staffLabel,
          { manual: true }
        )
      }

      // Empty only when the route swallowed a repeat submission of the same
      // number inside its 15-second window; the caller ignores the id.
      return createdId || updatedId
    },
    [staffName, staffLabel]
  )

  const importLeads = useCallback(
    async (
      rows: Record<string, unknown>[],
      mapping: { name: string; phone: string; email: string; type: string; amount: string }
    ) => {
      let count = 0
      for (const row of rows) {
        const response = await authedJson("/api/leads", "POST", {
          name: row[mapping.name] || "Unknown",
          phone: String(row[mapping.phone] ?? ""),
          email: mapping.email ? row[mapping.email] || "" : "",
          type: (mapping.type && row[mapping.type]) || "Personal Loan",
          amount: String((mapping.amount && row[mapping.amount]) ?? "0"),
          status: "New Lead",
          category: "Bulk",
          source: "Excel Upload",
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Could not import this file.")
        }
        count++
      }
      invalidateLeadsCache()
      return count
    },
    []
  )

  return {
    staffName,
    staffLabel,
    updateStatus,
    registerContact,
    assignAgent,
    setFollowUpDate,
    setFollowUpReason,
    saveDetails,
    saveNote,
    deleteLead,
    restoreLead,
    requestDisbursal,
    saveFollowUpRemark,
    setBotMuted,
    saveBankerLocation,
    createLead,
    importLeads,
  }
}
