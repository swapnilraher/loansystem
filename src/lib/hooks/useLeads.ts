"use client"

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  occupation?: string;
  employer?: string;
  monthlyIncome?: string;
  cibilScore?: string;
  existingEmis?: string;
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
  createdAt: any;
  updatedAt?: any;
  notes?: string;
  tags?: string[];
  category?: string;
  partnerName?: string;
  partnerId?: string;
  disbursedAmount?: string | number;
  dsaCode?: string;
  fullName?: string;
  mobile?: string;
  panName?: string;
  lastActivityNote?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener for the leads collection
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      setLeads(leadsArray);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Failed to fetch leads. Check permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { leads, loading, error };
}

// Helper to log activity
export const logLeadActivity = async (leadId: string, type: string, note: string, userName: string) => {
  try {
    await addDoc(collection(db, 'lead_activities'), {
      leadId,
      type,
      note,
      userName,
      timestamp: serverTimestamp()
    });

    // Sync last activity info to the lead document
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      lastActivityNote: note,
      lastActivityType: type,
      lastActivityUser: userName,
      lastActivityTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
