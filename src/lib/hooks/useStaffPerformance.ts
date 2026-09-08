"use client"

import { useMemo } from "react"
import { usePolledResource, POLL_NORMAL } from "@/lib/hooks/usePolledResource"
import { byNewest } from "@/lib/clientTime"
import { Lead } from "@/lib/hooks/useLeads"
import { toAmount } from "@/lib/hooks/useBanks"
import { STATUS_DISBURSED, STATUS_PENDING_APPROVAL } from "@/lib/disbursement"
import { ownsLead, viewerIdentity } from "@/lib/permissions"

/** One credited incentive row, written when a Manager approves a disbursal. */
export interface StaffIncentive {
  id: string
  staffId?: string
  staffName?: string
  leadId?: string
  customerName?: string
  bankName?: string
  productType?: string
  disbursedAmount?: string
  incentiveAmount?: number
  status?: string
  createdAt?: any
}

/** Stable empty result, so a scoped-to-nobody read does not re-render forever. */
const NO_INCENTIVES: StaffIncentive[] = []

/**
 * Credited incentives. Pass the viewer's ids to read only that person's rows —
 * a telecaller has no business loading the whole team's earnings. Omit them
 * entirely (`undefined`) to read the whole ledger.
 *
 * The route enforces that scoping rather than trusting it: a Telecaller is pinned
 * to their own rows whatever ids are sent. The ids still travel because an Admin
 * or Manager reading one person's card needs to say whose.
 *
 * It takes a *list* because `staffId` copies `leads.assignedTo`, which holds
 * either an `admin_users` document id or a Firebase Auth uid — see
 * `ViewerIdentity`. Matching on one shape alone loses a person's own earnings.
 */
export function useStaffIncentives(staffIds?: string[] | null) {
  // Keyed on the contents rather than the array's identity: the caller passes a
  // fresh array on every render.
  const idKey = staffIds ? staffIds.join("|") : ""
  /** Scoped to a person whose ids are not known yet — mid sign-in, not "all". */
  const scopedToNobody = !!staffIds && idKey === ""

  // A null url disables the poll: asking for nobody's rows must not fall through
  // to the unscoped read an Admin would get.
  const url = useMemo(() => {
    if (scopedToNobody) return null
    // A person never answers to more than a handful of ids.
    const ids = idKey ? idKey.split("|").slice(0, 30) : []
    // The ledger was read whole before, and the team totals add every row up, so
    // ask for the route's ceiling rather than its default page.
    const params = new URLSearchParams({ limit: "1000" })
    if (ids.length) params.set("staffIds", ids.join(","))
    return `/api/staff-incentives?${params.toString()}`
  }, [scopedToNobody, idKey])

  const { data, loading, refresh } = usePolledResource<{ incentives: StaffIncentive[] }>(
    url,
    POLL_NORMAL
  )

  const rows = useMemo(
    () => [...(data?.incentives || [])].sort(byNewest(i => i.createdAt)),
    [data]
  )

  return {
    incentives: scopedToNobody ? NO_INCENTIVES : rows,
    loading: scopedToNobody ? false : loading,
    /** Call after crediting an incentive so the totals do not wait for the next poll. */
    refresh,
  }
}

export interface StaffPerformance {
  assigned: number
  /** Files taken to Approved / Sanctioned or beyond. */
  converted: number
  disbursed: number
  pendingApproval: number
  disbursedVolume: number
  incentiveEarned: number
  conversionRate: number
}

/** Statuses that count as "this telecaller moved the file forward". */
const CONVERTED_STATUSES = ["Approved", "Sanctioned", STATUS_PENDING_APPROVAL, STATUS_DISBURSED]

const sameName = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Rolls a staff member's numbers up from the leads they own.
 *
 * `assignedTo` holds either an `admin_users` document id or a Firebase Auth uid
 * (see `ViewerIdentity`), so `ids` takes every id this person answers to. The
 * owner-name fallback stays for leads written before either id was recorded.
 */
export function computeStaffPerformance(
  leads: Lead[],
  incentives: StaffIncentive[],
  staff: { name: string; ids?: (string | null | undefined)[] }
): StaffPerformance {
  const identity = viewerIdentity(...(staff.ids ?? []))
  const owned = leads.filter(
    l => ownsLead(l, identity) || sameName(l.assignedToName, staff.name)
  )

  const disbursedLeads = owned.filter(l => l.status === STATUS_DISBURSED)
  const converted = owned.filter(l => CONVERTED_STATUSES.includes(l.status)).length

  // The team screens hand this the whole ledger and call it once per member, so
  // this filter picks whose card is being drawn — it is not the access check.
  const incentiveEarned = incentives
    .filter(
      i =>
        ownsLead({ assignedTo: i.staffId }, identity) || sameName(i.staffName, staff.name)
    )
    .reduce((sum, i) => sum + (Number(i.incentiveAmount) || 0), 0)

  return {
    assigned: owned.length,
    converted,
    disbursed: disbursedLeads.length,
    pendingApproval: owned.filter(l => l.status === STATUS_PENDING_APPROVAL).length,
    disbursedVolume: disbursedLeads.reduce((sum, l) => sum + toAmount(l.disbursedAmount), 0),
    incentiveEarned,
    conversionRate: owned.length ? Math.round((disbursedLeads.length / owned.length) * 100) : 0,
  }
}
