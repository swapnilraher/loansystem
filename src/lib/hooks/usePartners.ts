"use client"

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';

export interface Partner {
  id: string;
  role: string;
  dsaCode: string;
  dsaStatus: string;
  mobileNumber: string;
  businessType: string;
  kycVerified: boolean;
  panVerified: boolean;
  kycData?: {
    name?: string;
    dob?: string;
    gender?: string;
    address?: any;
    photoBase64?: string;
  };
  panData?: {
    panNumber?: string;
    name?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    nameAtBank?: string;
    verifiedAt?: string;
  };
  agreementData?: {
    signedAt?: string;
    ipConsent?: string;
    version?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We filter by role == "partner". We can't strictly orderBy if we haven't indexed, 
    // so we'll just fetch where role == partner and sort locally to avoid requiring manual Firebase Indexes.
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'partner')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partnersArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      
      // Sort locally by creation date descending
      partnersArray.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setPartners(partnersArray);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Failed to fetch partners. Check permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { partners, loading, error };
}
