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
import { auth } from "@/lib/firebase";
import { authedFetch, authedJson } from "@/lib/authedFetch";
import { useRouter } from "next/navigation";
import { CrmRole, normalizeRole } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  profile: any;
  /** Raw role label as stored on the staff record (e.g. "Assistant Telecaller"). */
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
 * The claim is what every API route trusts (`@/lib/apiAuth`) when it decides
 * what a request may see — including `/api/profile` below, which cannot find a
 * staff record for a token that does not carry it. The server writes it; here we
 * only ask for it and refresh the token if it changed.
 *
 * A failure must never block sign-in: the routes simply refuse the CRM data,
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

/** What `GET /api/profile` answers with for the caller behind the ID token. */
interface OwnRecord {
  kind: "staff" | "partner";
  /** Already normalised to one of the three CRM roles. Staff only. */
  role?: CrmRole | null;
  profile: any;
}

/**
 * The signed-in person's own record — staff or partner — chosen by their token.
 *
 * There is no id to pass: the route reads the caller out of the token, which is
 * what replaced the `users` / `admin_users` lookups this context used to do by
 * hand. `null` means the session owns no record the server will hand over (a
 * portal customer, or a deactivated staff account), which lands in the same
 * "no CRM role" state the empty `admin_users` query used to produce.
 *
 * Retried once, because this runs on every page load before anything renders:
 * a single dropped request would otherwise show a real Admin the access-denied
 * screen until they thought to reload.
 */
async function fetchOwnRecord(): Promise<OwnRecord | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await authedFetch("/api/profile");
      // A refusal is an answer, not a failure — do not spend the retry on it.
      if (response.status === 401 || response.status === 403) return null;
      const data = await response.json();
      if (response.ok && data.success) return data as OwnRecord;
    } catch (error) {
      console.warn("Could not load your profile:", error);
    }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 600));
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Only the newest sign-in state may write to the context.
     *
     * Resolving a role is a network round trip now, so a sign-out — or a second
     * auth event — arriving mid-flight could otherwise drop a stale answer on
     * top of a newer one, which is how a signed-out screen ends up still
     * holding an Admin role. Bumping it in the cleanup covers unmount too.
     */
    let currentRun = 0;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const run = ++currentRun;
      setUser(user);

      if (!user) {
        setProfile(null);
        setAdminRole(null);
        setStaffProfile(null);
        setAccountDisabled(false);
        setLoading(false);
        return;
      }

      try {
        // Resolve CRM access before asking for anything: `/api/profile` picks the
        // caller out of the `crm` claim, so it cannot see a staff record until
        // this token carries it.
        await syncCrmClaims(user);

        const own = await fetchOwnRecord();
        // A newer auth event owns the context; this answer is already stale.
        if (run !== currentRun) return;

        const record: any = own?.profile || null;

        if (record) {
          // Every screen reads a display name off the profile, and the records
          // spell it half a dozen ways. Settle it once, here.
          const resolvedName = record.name || record.fullName || record.contactPersonName || record.businessName || user.displayName || "";
          setProfile(
            resolvedName
              ? { ...record, name: resolvedName, fullName: record.fullName || resolvedName }
              : record
          );
        } else {
          /**
           * Nothing on the server belongs to this session yet — a first Google
           * or WhatsApp sign-in. This used to be written to `users/{uid}`; the
           * profile route writes no new documents, so it stays local and the
           * screens that ask a signed-in visitor to complete their details
           * still see a profile to fill in.
           */
          setProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: "user",
            createdAt: new Date().toISOString(),
          });
        }

        // Check Admin Role
        setAccountDisabled(false);
        if (user.email === "swapnil.r.aher@gmail.com") {
          // The founding account predates the staff table and has no record in it.
          setAdminRole("Super Admin");
          setStaffProfile(null);
        } else if (own?.kind === "staff") {
          /**
           * `syncCrmClaims` has already linked this record to the Auth uid
           * server-side; reflect that locally so the very first render matches
           * leads by both id shapes (see `ViewerIdentity`).
           */
          const staffData: any = record ? { ...record, uid: record.uid || user.uid } : null;

          setStaffProfile(staffData);
          // Deactivated accounts keep their record but lose all CRM access.
          if (staffData?.status === "Inactive") {
            setAdminRole(null);
            setAccountDisabled(true);
          } else {
            // The raw stored label, as before — `role` normalises it for access checks.
            setAdminRole(staffData?.role || own.role || null);
          }
        } else {
          setAdminRole(null);
          setStaffProfile(null);
        }
      } finally {
        // Route guards wait on this, so it has to fall even when the lookup
        // failed: an unresolved role is "no access", never a permanent splash.
        if (run === currentRun) setLoading(false);
      }
    });

    return () => {
      currentRun++;
      unsubscribe();
    };
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

  /**
   * Saves changes onto the caller's own record.
   *
   * The route decides which fields may move — role, status, dsaCode and the KYC
   * blocks are not among them — so a rejected field is dropped server-side
   * rather than written. A failed save throws, as the direct write did, so the
   * forms that call this keep showing their own error.
   */
  const updateProfile = async (data: any) => {
    if (!user) return;
    const response = await authedJson("/api/profile", "PATCH", { profile: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Could not save your profile.");
    }
    setProfile((prev: any) => ({ ...(prev || {}), ...data, updatedAt: new Date().toISOString() }));
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
