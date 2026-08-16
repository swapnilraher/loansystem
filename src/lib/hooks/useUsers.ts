"use client"

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'admin_users'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersArray: AdminUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersArray.push({
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt ? data.joinedAt : Timestamp.now(),
        } as AdminUser);
      });
      setUsers(usersArray);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching admin users: ", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading, error };
}
