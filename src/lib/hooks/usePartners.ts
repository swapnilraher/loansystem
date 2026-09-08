"use client"

import { useMemo } from 'react';
import { usePolledResource, POLL_NORMAL } from '@/lib/hooks/usePolledResource';
import { byNewest } from '@/lib/clientTime';

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
  // `/api/partners` returns the whole partner document — kycData, panData, bankDetails
  // and agreementData included — for every `users` row with role == "partner".
  const { data, loading, error } = usePolledResource<{ partners: Partner[] }>(
    '/api/partners',
    POLL_NORMAL
  );

  const partners = useMemo<Partner[]>(() => {
    // The route sorts by name; this screen has always shown most-recently-touched
    // first, so it is re-sorted here on updatedAt, falling back to createdAt.
    return [...(data?.partners || [])].sort(
      byNewest<Partner>(partner => partner.updatedAt || partner.createdAt)
    );
  }, [data]);

  return {
    partners,
    loading,
    error: error ? "Failed to fetch partners. Check permissions." : null,
  };
}
