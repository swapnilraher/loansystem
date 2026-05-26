"use client"

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  designation: string;
  status: 'Active' | 'Away' | 'Offline' | 'Inactive';
  permissions: string[];
  joinedAt: any;
  lastLogin?: any;
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
