"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { CrmRole, normalizeRole } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  profile: any;
  /** Raw role label as stored in Firestore (e.g. "Assistant Telecaller"). */
  adminRole: string | null;
  /** Raw label mapped onto one of the three CRM roles. Use this for access checks. */
  role: CrmRole | null;
  /** The `admin_users` document for the signed-in staff member. */
  staffProfile: any;
  /** True when a staff record exists but the account has been deactivated. */
  accountDisabled: boolean;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
  loginWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPasswordWithOTP: (email: string, token: string, newPassword: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Mirrors the staff member's CRM role from `admin_users` onto their Auth token.
 *
 * Firestore rules cannot query, so they cannot look somebody up in `admin_users`
 * by email — the claim is what makes role-based rules possible at all. The
 * server writes it; here we only ask for it and refresh the token if it changed.
 *
 * A failure must never block sign-in: the rules simply deny the CRM collections,
 * which is the correct outcome for a session whose role could not be proven.
 */
async function syncCrmClaims(user: User): Promise<void> {
  try {
    const response = await fetch("/api/auth/claims", {
      method: "POST",
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    if (!response.ok) return;
    const { refreshed } = await response.json();
    // Claims land in the token only after it is re-minted.
    if (refreshed) await user.getIdToken(true);
  } catch (error) {
    console.warn("Could not refresh CRM access claims:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Resolve CRM access before reading anything: Firestore rules gate every
        // staff collection on the `crm` custom claim, so the reads below fail
        // until this token carries it.
        await syncCrmClaims(user);

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
        setAccountDisabled(false);
        if (user.email) {
          if (user.email === "swapnil.r.aher@gmail.com") {
            setAdminRole("Super Admin");
            setStaffProfile(null);
          } else {
            const adminQuery = query(collection(db, "admin_users"), where("email", "==", user.email));
            const adminSnapshot = await getDocs(adminQuery);
            if (!adminSnapshot.empty) {
              const staffDoc = adminSnapshot.docs[0];
              const staffData: any = { id: staffDoc.id, ...staffDoc.data() };

              /**
               * `syncCrmClaims` has already linked this record to the Auth uid
               * server-side; reflect that locally so the very first render
               * matches leads by both id shapes (see `ViewerIdentity`) without
               * waiting for the snapshot to come back round.
               */
              staffData.uid = staffData.uid || user.uid;

              setStaffProfile(staffData);
              // Deactivated accounts keep their record but lose all CRM access.
              if (staffData.status === "Inactive") {
                setAdminRole(null);
                setAccountDisabled(true);
              } else {
                setAdminRole(staffData.role);
              }
            } else {
              setAdminRole(null);
              setStaffProfile(null);
            }
          }
        } else {
          setAdminRole(null);
          setStaffProfile(null);
        }
      } else {
        setProfile(null);
        setAdminRole(null);
        setStaffProfile(null);
        setAccountDisabled(false);
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




  /** Sign-in failures the CRM can try to repair from the `admin_users` record. */
  const RECOVERABLE_AUTH_ERRORS = [
    "auth/user-not-found",
    "auth/invalid-credential",
    "auth/wrong-password",
  ];

  const loginWithEmailAndPassword = async (email: string, password: string) => {
    try {
      // 1. Try to sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
    } catch (authError: any) {
      if (!RECOVERABLE_AUTH_ERRORS.includes(authError.code)) throw authError;

      // 2. Staff passwords are set in Team Management and by the OTP reset,
      // both of which only write to `admin_users`. Ask the server to copy that
      // password into Firebase Auth — this covers a staff member who has no
      // Auth account yet *and* one whose Auth password has drifted out of sync
      // (which used to fail with `auth/email-already-in-use`).
      console.log("Firebase Auth failed, attempting credential sync...", authError.code);
      const response = await fetch("/api/auth/sync-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Surface the account-deactivated case; otherwise keep the original
        // "invalid credentials" error so the login form reads naturally.
        if (response.status === 403) {
          throw new Error("This staff account has been deactivated. Contact an administrator.");
        }
        throw authError;
      }

      // 3. Retry now that Auth and the CRM agree on the password.
      await signInWithEmailAndPassword(auth, email, password);
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const updatedProfile = { ...profile, ...data, updatedAt: new Date().toISOString() };
    await setDoc(docRef, updatedProfile, { merge: true });
    setProfile(updatedProfile);
  };

  const signInWithGooglePopup = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const router = useRouter();

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, profile, adminRole, role: normalizeRole(adminRole), staffProfile, accountDisabled, loading, loginWithGoogle, signInWithGooglePopup, loginWithEmailAndPassword, requestPasswordReset, resetPasswordWithOTP, updateProfile, logout }}>
      {children}
      {user && staffProfile && staffProfile.mustChangePassword && (
        <MustChangePasswordModal
          onUpdated={() => {
            setStaffProfile((prev: any) => ({ ...prev, mustChangePassword: false }))
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

function MustChangePasswordModal({ onUpdated }: { onUpdated: () => void }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSaving(true)
    try {
      const authObj = auth.currentUser
      const token = authObj ? await authObj.getIdToken() : ""

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not update password.")
      }
      onUpdated()
    } catch (err: any) {
      setError(err.message || "Failed to update password.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="text-center space-y-2 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Password Change Required
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            पहिल्या लॉगीनवर नवीन पासवर्ड सेट करणे अनिवार्य आहे. (You must set a new password on your first login).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-500 mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? "Updating Password..." : "Update Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
