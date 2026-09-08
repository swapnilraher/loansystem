"use client"

import { useMemo } from 'react';
import { usePolledResource, POLL_NORMAL } from '@/lib/hooks/usePolledResource';

export interface AdminUser {
  id: string;
  /**
   * Firebase Auth uid, stamped by `AuthContext` the first time this person signs
   * in. Absent until then — always fall back to `id`.
   */
  uid?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  designation: string;
  status: 'Active' | 'Away' | 'Offline' | 'Inactive';
  permissions: string[];
  joinedAt: any;
  lastLogin?: any;
  /** Official joining date (YYYY-MM-DD), captured when the account is created. */
  joiningDate?: string;
  /** Leave details. */
  annualLeaves?: number;
  leavesTaken?: number;
  leaveNotes?: string;
}

/**
 * The id to write into `leads.assignedTo` when handing a lead to this person.
 *
 * Prefers the Firebase Auth uid: that is what auto-claim writes, what the
 * telecaller's own session knows about itself, and the only shape a Firestore
 * security rule can check. Falls back to the document id until they sign in once
 * — ownership checks accept either (see `ViewerIdentity`).
 */
export function ownerIdOf(member: Pick<AdminUser, 'id' | 'uid'>): string {
  return (member.uid || '').trim() || member.id;
}

export function useUsers() {
  // The staff directory changes a few times a week, so the slow tier is plenty.
  // `/api/users` already returns it ordered by name ascending.
  const { data, loading, error } = usePolledResource<{ users: AdminUser[] }>(
    '/api/users',
    POLL_NORMAL
  );

  const users = useMemo<AdminUser[]>(() => {
    const rows = data?.users || [];
    return rows.map(user => ({
      ...user,
      // Same fallback as before, in the wire shape the routes speak: an ISO string.
      joinedAt: user.joinedAt ? user.joinedAt : new Date().toISOString(),
    }));
  }, [data]);

  // Callers type this as an `Error`, so the message comes back wrapped.
  const asError = useMemo(() => (error ? new Error(error) : null), [error]);

  return { users, loading, error: asError };
}
