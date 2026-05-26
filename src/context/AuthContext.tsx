"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithCredential,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: any;
  adminRole: string | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPasswordWithOTP: (email: string, token: string, newPassword: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: "user",
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }

        // Check Admin Role
        if (user.email === "swapnil.r.aher@gmail.com") {
          setAdminRole("Super Admin");
        } else {
          const adminQuery = query(collection(db, "admin_users"), where("email", "==", user.email));
          const adminSnapshot = await getDocs(adminQuery);
          if (!adminSnapshot.empty) {
            setAdminRole(adminSnapshot.docs[0].data().role);
          } else {
            setAdminRole(null);
          }
        }
      } else {
        setProfile(null);
        setAdminRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  };

  // Request OTP for password reset (calls API)
  const requestPasswordReset = async (email: string) => {
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Password reset request failed: ${err}`);
    }
  };

  // Reset password using OTP token (calls API)
  const resetPasswordWithOTP = async (email: string, token: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Password reset failed: ${err}`);
    }
  };




  const loginWithEmailAndPassword = async (email: string, password: string) => {
    try {
      // 1. Try to sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
    } catch (authError: any) {
      console.log("Firebase Auth failed, checking Firestore backup...", authError.code);
      
      // If user not found or invalid credential, check if they exist in Firestore admin_users with this password
      if (authError.code === "auth/user-not-found" || authError.code === "auth/invalid-credential" || authError.code === "auth/wrong-password") {
        const adminQuery = query(collection(db, "admin_users"), where("email", "==", email), where("password", "==", password));
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          // User exists in admin_users with matching password. Register them in Firebase Auth!
          console.log("Found matching admin_user in Firestore, registering in Firebase Auth...");
          await createUserWithEmailAndPassword(auth, email, password);
          return;
        }
      }
      throw authError;
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const updatedProfile = { ...profile, ...data, updatedAt: new Date().toISOString() };
    await setDoc(docRef, updatedProfile, { merge: true });
    setProfile(updatedProfile);
  };

  const router = useRouter();

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, profile, adminRole, loading, loginWithGoogle, requestPasswordReset, resetPasswordWithOTP, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
