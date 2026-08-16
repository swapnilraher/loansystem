"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, where } from "firebase/firestore"
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
 * It takes a *list* because `staffId` copies `leads.assignedTo`, which holds
 * either an `admin_users` document id or a Firebase Auth uid — see
 * `ViewerIdentity`. Matching on one shape alone loses a person's own earnings.
 */
export function useStaffIncentives(staffIds?: string[] | null) {
  const [rows, setRows] = useState<StaffIncentive[]>([])
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  // Re-subscribing on every render would thrash the listener: the caller passes
  // a fresh array each time, so key the effect on its contents rather than the
  // array's identity.
  const idKey = staffIds ? staffIds.join("|") : ""
  /** Scoped to a person whose ids are not known yet — mid sign-in, not "all". */
  const scopedToNobody = !!staffIds && idKey === ""

  useEffect(() => {
    // The nobody case is *derived* below rather than written from here: calling
    // setState in an effect body cascades renders, which this codebase's lint
    // rules reject outright.
    if (scopedToNobody) return

    const ids = idKey ? idKey.split("|") : null
    const ledger = collection(db, "staff_incentives")
    const unsubscribe = onSnapshot(
      // `in` caps at 30 values; a person never has more than a handful of ids.
      ids ? query(ledger, where("staffId", "in", ids.slice(0, 30))) : query(ledger),
      snapshot => {
        const next = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StaffIncentive[]
        next.sort((a, b) => {
          const t = (x: any) => (x?.toMillis ? x.toMillis() : 0)
          return t(b.createdAt) - t(a.createdAt)
        })
        setRows(next)
        setSnapshotLoading(false)
      },
      err => {
        console.error("Error fetching staff incentives:", err)
        setSnapshotLoading(false)
      }
    )
    return () => unsubscribe()
  }, [scopedToNobody, idKey])

  return {
    incentives: scopedToNobody ? NO_INCENTIVES : rows,
    loading: scopedToNobody ? false : snapshotLoading,
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
