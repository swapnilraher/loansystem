"use client"

import { db } from "@/lib/firebase"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"
import { Lead, logLeadActivity } from "@/lib/hooks/useLeads"
import { Bank, calcConnectorCommission, calcStaffIncentive, formatINR, toAmount } from "@/lib/hooks/useBanks"

/**
 * Disbursal sign-off.
 *
 * A telecaller never books a disbursal directly. Marking a file disbursed
 * parks it in `Disbursement Approval Pending`; a Manager or Admin then picks
 * the bank, confirms the amount and approves — which is the only moment
 * incentives and connector commission are written.
 */
export const STATUS_PENDING_APPROVAL = "Disbursement Approval Pending"
export const STATUS_DISBURSED = "Disbursed"

/** Statuses that mean "the file is closed one way or another". */
export const CLOSED_STATUSES = [STATUS_DISBURSED, "Rejected", "Not Interested"]

export type ApprovalState = "Pending" | "Approved" | "Rejected"

export interface StaffRef {
  uid?: string | null
  name: string
  email?: string | null
  /** Display label used in the activity timeline, e.g. "Asha (Manager)". */
  label: string
}

/**
 * Recomputes `statusHistory` / `statusDurations` for a status change.
 * Returns the fields to merge into the lead update payload.
 */
export function buildStatusTransition(
  lead: Pick<Lead, "status" | "createdAt"> & { statusHistory?: any; statusDurations?: any },
  newStatus: string
): { statusHistory: Record<string, any>; statusDurations: Record<string, any> } {
  const oldStatus = lead.status || "New Lead"
  const history = { ...(lead.statusHistory || {}) }
  const statusDurations = { ...(lead.statusDurations || {}) }

  const enteredAt = history[oldStatus] || lead.createdAt
  if (enteredAt) {
    const t1 = enteredAt.toDate ? enteredAt.toDate().getTime() : new Date(enteredAt).getTime()
    const diffMs = new Date().getTime() - t1

    if (!isNaN(diffMs) && diffMs >= 0) {
      const diffHrs = diffMs / (1000 * 60 * 60)
      let durationStr: string
      if (diffHrs < 1) {
        const mins = Math.round(diffMs / (1000 * 60))
        durationStr = `${mins} min${mins !== 1 ? "s" : ""}`
      } else if (diffHrs < 24) {
        const hrs = Math.round(diffHrs)
        durationStr = `${hrs} hour${hrs !== 1 ? "s" : ""}`
      } else {
        const days = Math.round(diffHrs / 24)
        durationStr = `${days} day${days !== 1 ? "s" : ""}`
      }
      statusDurations[`${oldStatus}To${newStatus}`] = durationStr
      statusDurations[`${oldStatus}_timeMs`] = diffMs
    }
  }

  return {
    statusHistory: { ...history, [newStatus]: new Date() },
    statusDurations,
  }
}

/**
 * Telecaller (or anyone) marks a file disbursed → parks it for sign-off.
 * Nothing is paid out here.
 */
export async function requestDisbursementApproval(
  lead: Lead,
  disbursedAmount: number,
  staff: StaffRef,
  extra: Record<string, any> = {}
) {
  const payload: any = {
    status: STATUS_PENDING_APPROVAL,
    approvalStatus: "Pending" as ApprovalState,
    disbursedAmount: String(Math.round(disbursedAmount)),
    // Remembered so a rejection can put the file back where it was. Re-raising
    // a request must not overwrite it with the pending status itself.
    preApprovalStatus:
      lead.status && lead.status !== STATUS_PENDING_APPROVAL
        ? lead.status
        : (lead as any).preApprovalStatus || "Bank Processing",
    disbursementRequestedBy: staff.uid || null,
    disbursementRequestedByName: staff.name,
    disbursementRequestedAt: serverTimestamp(),
    rejectionReason: null,
    followUpDate: null,
    followUpReason: null,
    updatedAt: serverTimestamp(),
    ...buildStatusTransition(lead, STATUS_PENDING_APPROVAL),
    ...extra,
  }

  await updateDoc(doc(db, "leads", lead.id), payload)
  await logLeadActivity(
    lead.id,
    "Disbursement Request",
    `Marked disbursed (${formatINR(disbursedAmount)}) — sent for manager approval.`,
    staff.label
  )
}

/** True when this lead has already been credited in the given ledger. */
async function alreadyCredited(collectionName: string, leadId: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, collectionName), where("leadId", "==", leadId)))
  return snap.docs.some(d => (d.data().status || "") !== "Reversed")
}

export interface ApprovalInput {
  lead: Lead
  bank: Bank | null
  disbursedAmount: number
  /** Manager may override the auto-calculated figures. */
  staffIncentive: number
  connectorCommission: number
  approver: StaffRef
  remarks?: string
  productType?: string
}

/**
 * Manager/Admin sign-off. Confirms the disbursal, credits the closing
 * telecaller's incentive and — when the lead came from a connector — pushes a
 * commission row into their ledger. Both writes are idempotent so a repeated
 * approval cannot double-pay.
 */
export async function approveDisbursement({
  lead,
  bank,
  disbursedAmount,
  staffIncentive,
  connectorCommission,
  approver,
  remarks,
  productType,
}: ApprovalInput) {
  const amount = Math.round(disbursedAmount)

  const leadPayload: any = {
    status: STATUS_DISBURSED,
    approvalStatus: "Approved" as ApprovalState,
    disbursedAmount: String(amount),
    bankId: bank?.id || null,
    bankName: bank?.name || null,
    staffIncentiveAmount: Math.round(staffIncentive),
    connectorCommissionAmount: Math.round(connectorCommission),
    connectorCommissionRate: bank?.connectorCommission ?? null,
    approvedBy: approver.uid || null,
    approvedByName: approver.name,
    approvedAt: serverTimestamp(),
    approvalRemarks: remarks || null,
    rejectionReason: null,
    updatedAt: serverTimestamp(),
    ...buildStatusTransition(lead, STATUS_DISBURSED),
  }

  if (productType) {
    leadPayload.type = productType
  }

  await updateDoc(doc(db, "leads", lead.id), leadPayload)

  // 1. Telecaller incentive — only for the staff member who owns the file.
  if (lead.assignedTo && staffIncentive > 0 && !(await alreadyCredited("staff_incentives", lead.id))) {
    await addDoc(collection(db, "staff_incentives"), {
      staffId: lead.assignedTo,
      staffName: lead.assignedToName || "Staff",
      leadId: lead.id,
      customerName: lead.name || lead.fullName || "Customer",
      productType: productType || lead.type || "Loan",
      bankId: bank?.id || null,
      bankName: bank?.name || "—",
      disbursedAmount: String(amount),
      incentiveAmount: Math.round(staffIncentive),
      status: "Earned",
      approvedBy: approver.uid || null,
      approvedByName: approver.name,
      createdAt: serverTimestamp(),
    })
  }

  // 2. Connector commission — only when the lead was sourced by a DSA partner.
  if (lead.partnerId && connectorCommission > 0 && !(await alreadyCredited("commission_ledger", lead.id))) {
    await addDoc(collection(db, "commission_ledger"), {
      partnerId: lead.partnerId,
      partnerName: lead.partnerName || "DSA Partner",
      dsaCode: lead.dsaCode || "Unknown",
      leadId: lead.id,
      customerName: lead.name || lead.fullName || "Customer",
      productType: productType || lead.type || "Loan",
      bankName: bank?.name || "—",
      disbursedAmount: String(amount),
      commissionAmount: String(Math.round(connectorCommission)),
      commissionPercentage: String(bank?.connectorCommission ?? ""),
      status: "Under Settlement",
      approvedBy: approver.uid || null,
      approvedByName: approver.name,
      createdAt: serverTimestamp(),
    })
  }

  const parts = [
    `Disbursal approved — ${formatINR(amount)}`,
    bank?.name ? `via ${bank.name}` : null,
    staffIncentive > 0 ? `staff incentive ${formatINR(staffIncentive)}` : null,
    lead.partnerId && connectorCommission > 0
      ? `connector commission ${formatINR(connectorCommission)}`
      : null,
  ].filter(Boolean)

  await logLeadActivity(lead.id, "Disbursement Approved", parts.join(" • "), approver.label)
}

/** Manager/Admin rejects the disbursal request and hands the file back. */
export async function rejectDisbursement(lead: Lead, reason: string, approver: StaffRef) {
  const revertTo = (lead as any).preApprovalStatus || "Bank Processing"

  await updateDoc(doc(db, "leads", lead.id), {
    status: revertTo,
    approvalStatus: "Rejected" as ApprovalState,
    rejectionReason: reason,
    rejectedBy: approver.uid || null,
    rejectedByName: approver.name,
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...buildStatusTransition(lead, revertTo),
  })

  await logLeadActivity(
    lead.id,
    "Disbursement Rejected",
    `Disbursal request rejected — ${reason}. File moved back to ${revertTo}.`,
    approver.label
  )
}

/** Amount the manager should see pre-filled on the approval form. */
export function suggestedDisbursedAmount(lead: Lead): number {
  return toAmount(lead.disbursedAmount) || toAmount(lead.amount)
}

/** Auto-calculated payouts for a bank + amount pair. */
export function calcPayouts(bank: Bank | null | undefined, disbursedAmount: number) {
  return {
    staffIncentive: calcStaffIncentive(bank),
    connectorCommission: calcConnectorCommission(bank, disbursedAmount),
  }
}
