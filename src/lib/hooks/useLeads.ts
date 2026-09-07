"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { can, canSeeLead } from '@/lib/permissions';
import { useViewerIdentity } from '@/lib/hooks/useViewerIdentity';
import { getBrowserCache, setBrowserCache, invalidateBrowserCache } from '@/lib/cache/browserCache';

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
  pinState?: string;
  pinDistrict?: string;
  pinCity?: string;
  pinTaluka?: string;
  pinUrbanRural?: string;
  pinPostOffice?: string;
  pinAddress?: string;
  pinBranchType?: string;
  pinLookupAt?: string;
  bankerState?: string;
  bankerDistrict?: string;
  occupation?: string;
  employer?: string;
  monthlyIncome?: string;
  cibilScore?: string;
  existingEmis?: string;
  incomePaymentMode?: 'Bank Account' | 'Cash Payment';
  existingLoanEmi?: 'Yes' | 'No';
  cibilScoreAvailable?: 'Yes' | 'No';
  qualifiedAt?: string;
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
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
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
  lastNote?: string;
  lastNoteUser?: string;
  lastNoteTime?: unknown;
  deleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string;
  deletedByName?: string;
}

export interface UseLeadsOptions {
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

const CACHE_KEY = "leads_list";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export function useLeads(options: UseLeadsOptions = {}) {
  const { role } = useAuth();
  const viewer = useViewerIdentity();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSeeDeleted = can(role, 'leads:viewDeleted');
  const showDeleted = canSeeDeleted && options.includeDeleted === true;

  const fetchLeads = useCallback(async (bypassCache = false) => {
    try {
      const cacheKey = `${CACHE_KEY}_${options.includeDeleted ? "all" : "active"}`;

      // 1. Instant Cache Check for 0ms page transitions
      if (!bypassCache) {
        const cached = getBrowserCache<{ leads: Lead[]; total: number }>(cacheKey);
        if (cached && Array.isArray(cached.leads) && cached.leads.length > 0) {
          const scoped = can(role, 'leads:viewAll')
            ? cached.leads
            : cached.leads.filter(lead => canSeeLead(role, lead, viewer));
          setLeads(scoped);
          setTotal(cached.total || scoped.length);
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      const params = new URLSearchParams();
      params.set("limit", String(options.limit || 200));
      if (options.page) params.set("page", String(options.page));
      if (options.status) params.set("status", options.status);
      if (options.search) params.set("search", options.search);
      if (options.includeDeleted) params.set("includeDeleted", "true");

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch leads: ${res.statusText}`);
      }

      const data = await res.json();
      const leadsArray = (data.leads || []) as Lead[];

      const scopedLeads = can(role, 'leads:viewAll')
        ? leadsArray
        : leadsArray.filter(lead => canSeeLead(role, lead, viewer));

      setLeads(scopedLeads);
      setTotal(data.total || scopedLeads.length);
      setBrowserCache(cacheKey, { leads: leadsArray, total: data.total || leadsArray.length }, CACHE_TTL);
      setError(null);
    } catch (err: any) {
      console.error("Leads fetch error:", err);
      setError("Failed to fetch leads.");
    } finally {
      setLoading(false);
    }
  }, [role, viewer, options.includeDeleted, options.limit, options.page, options.status, options.search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const visibleLeads = useMemo(
    () => (showDeleted ? leads : leads.filter(lead => lead.deleted !== true)),
    [leads, showDeleted]
  );

  const refresh = useCallback(() => fetchLeads(true), [fetchLeads]);

  return { leads: visibleLeads, total, loading, error, canSeeDeleted, refresh };
}

export function invalidateLeadsCache() {
  invalidateBrowserCache(CACHE_KEY);
}

// Helper to log activity
export const logLeadActivity = async (
  leadId: string,
  type: string,
  note: string,
  userName: string,
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

    invalidateLeadsCache();
  } catch (error: any) {
    console.error("Error logging activity:", error);
    if (typeof window !== "undefined") {
      alert("Activity Log Error: " + (error.message || error));
    }
  }
};
