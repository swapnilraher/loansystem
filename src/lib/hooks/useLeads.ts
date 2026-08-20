"use client"

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { can, canSeeLead } from '@/lib/permissions';
import { useViewerIdentity } from '@/lib/hooks/useViewerIdentity';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: string;
  amount: string;
  status: string;
  subStatus?: string;
  city?: string;
  state?: string;
  pincode?: string;
  /**
   * Where the PIN code actually is, as India Post reported it — see
   * `pincodeLeadFields` in `@/lib/pincode`.
   *
   * Write-once source data. `city` above is the general CRM field and a later
   * flow answer may overwrite it; these never move, so the lead always retains
   * the location the customer's PIN code resolved to.
   */
  pinState?: string;
  pinDistrict?: string;
  pinCity?: string;
  pinTaluka?: string;
  /** Blank on every current response — India Post publishes no urban/rural marker. */
  pinUrbanRural?: string;
  pinPostOffice?: string;
  pinAddress?: string;
  pinBranchType?: string;
  pinLookupAt?: string;
  /**
   * Which state/district the banker search is pointed at. Seeded from
   * `pinState` / `pinDistrict` and freely re-pointed by staff, which is the
   * whole reason the `pin*` fields are kept separate.
   */
  bankerState?: string;
  bankerDistrict?: string;
  /** "Job" or "Business" — asked by the WhatsApp qualification flow. */
  occupation?: string;
  employer?: string;
  monthlyIncome?: string;
  cibilScore?: string;
  existingEmis?: string;
  /**
   * WhatsApp qualification answers.
   *
   * `incomePaymentMode` is the one that decides eligibility: cash income moves
   * the customer to Loan Against Property or closes the lead, so a Personal Loan
   * that reached `System Qualified` always says "Bank Account".
   */
  incomePaymentMode?: 'Bank Account' | 'Cash Payment';
  existingLoanEmi?: 'Yes' | 'No';
  cibilScoreAvailable?: 'Yes' | 'No';
  /** ISO timestamp written when the bot finished qualifying the lead. */
  qualifiedAt?: string;
  /** One-line recap of the qualification answers, for the queue table. */
  qualificationDetails?: string;
  source?: string;
  campaign?: string;
  utmSource?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Hot';
  branch?: string;
  leadScore?: number;
  slaStatus?: 'Healthy' | 'Warning' | 'Overdue';
  assignedTo?: string;
  assignedToName?: string;
  followUpDate?: any;
  followUpReason?: string;
  createdAt: any;
  updatedAt?: any;
  statusUpdatedAt?: any;
  notes?: string;
  tags?: string[];
  category?: string;
  partnerName?: string;
  partnerId?: string;
  disbursedAmount?: string | number;
  dsaCode?: string;
  /** Disbursal sign-off — see `@/lib/disbursement`. */
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  /** Status the file sat in before the disbursal request, restored on rejection. */
  preApprovalStatus?: string;
  disbursementRequestedBy?: string;
  disbursementRequestedByName?: string;
  disbursementRequestedAt?: any;
  bankId?: string | null;
  bankName?: string | null;
  staffIncentiveAmount?: number;
  connectorCommissionAmount?: number;
  connectorCommissionRate?: number | null;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: any;
  approvalRemarks?: string | null;
  rejectionReason?: string | null;
  rejectedByName?: string;
  rejectedAt?: any;
  statusHistory?: Record<string, any>;
  statusDurations?: Record<string, any>;
  fullName?: string;
  mobile?: string;
  panName?: string;
  lastActivityNote?: string;
  lastActivityType?: string;
  /** Last hand-typed remark. System activity never touches this — see `logLeadActivity`. */
  lastNote?: string;
  lastNoteUser?: string;
  lastNoteTime?: unknown;
  /**
   * Deleted by a staff member — hidden everywhere, erased nowhere.
   *
   * A lead is never removed from Firestore: "delete" sets this flag, and the
   * file keeps its status, its history and its place in the pipeline. Only an
   * Admin can see it afterwards (`leads:viewDeleted`), and only an Admin can
   * clear the flag. Staff who delete a lead are told it is deleted and nothing
   * more — no queue, no counter, no way back to it.
   */
  deleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string;
  deletedByName?: string;
}

export interface UseLeadsOptions {
  /**
   * Include deleted leads in the result. Ignored for anyone without
   * `leads:viewDeleted`, so passing it cannot widen a telecaller's view.
   */
  includeDeleted?: boolean;
}

/**
 * Every lead this staff member is allowed to see.
 *
 * Deleted leads are filtered out here rather than at each screen: thirteen
 * components read this hook, and a deleted lead must not reach any of them by
 * default — not the dashboard counts, not the reports, not the Kanban board.
 * The leads screen opts back in when an Admin asks for them.
 */
export function useLeads(options: UseLeadsOptions = {}) {
  const { role } = useAuth();
  const viewer = useViewerIdentity();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSeeDeleted = can(role, 'leads:viewDeleted');
  const showDeleted = canSeeDeleted && options.includeDeleted === true;

  const visibleLeads = useMemo(
    () => (showDeleted ? leads : leads.filter(lead => lead.deleted !== true)),
    [leads, showDeleted]
  );

  useEffect(() => {
    // Real-time listener for the leads collection
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      const scopedLeads = can(role, 'leads:viewAll')
        ? leadsArray
        : leadsArray.filter(lead => canSeeLead(role, lead, viewer));

      setLeads(scopedLeads);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Failed to fetch leads. Check permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, viewer]);

  return { leads: visibleLeads, loading, error, canSeeDeleted };
}

// Helper to log activity
export const logLeadActivity = async (
  leadId: string,
  type: string,
  note: string,
  userName: string,
  /**
   * `true` only when a human typed this text into a note box. The timeline
   * records everything, but the "Last note" column must show what a colleague
   * wrote — not the CRM narrating its own status changes and panel openings.
   */
  options: { manual?: boolean } = {}
) => {
  try {
    await addDoc(collection(db, 'lead_activities'), {
      leadId,
      type,
      note,
      userName,
      manual: options.manual === true,
      timestamp: serverTimestamp()
    });

    // Sync last activity info to the lead document
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      lastActivityNote: note,
      lastActivityType: type,
      lastActivityUser: userName,
      lastActivityTime: serverTimestamp(),
      ...(options.manual
        ? { lastNote: note, lastNoteUser: userName, lastNoteTime: serverTimestamp() }
        : {}),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error("Error logging activity:", error);
    if (typeof window !== "undefined") {
      alert("Firestore Write Error: " + (error.message || error));
    }
  }
};
