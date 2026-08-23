"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight, Smartphone, MessageSquare, ShieldCheck, CheckCircle2 } from "lucide-react";
import WhatsAppOtpModal from "@/components/onboarding/WhatsAppOtpModal";

export default function PartnerLogin() {
  const { loginWithEmailAndPassword, signInWithGooglePopup } = useAuth();
  const router = useRouter();

  const [authMethod, setAuthMethod] = useState<"whatsapp" | "email">("whatsapp");
  
  // WhatsApp OTP state
  const [mobileNumber, setMobileNumber] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Email / Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP");

      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to send WhatsApp OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpVerified = async (token: string) => {
    setShowOtpModal(false);
    setLoading(true);
    try {
      // Fetch application / user profile for this mobile
      const res = await fetch(`/api/onboarding/status?mobile=${mobileNumber}`);
      const data = await res.json();

      if (res.ok && data.application?.status === "approved") {
        router.push("/partner");
      } else if (res.ok && data.application) {
        router.push(`/application-status?mobile=${mobileNumber}`);
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError("Login verified, redirecting...");
      router.push("/partner");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginWithEmailAndPassword(email, password);
      router.push("/partner");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGooglePopup();
      router.push("/partner");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-slate-900/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 relative z-10 border border-slate-200 animate-fadeIn">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-600/30 mb-3">
            T
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Techstar Money DSA Login</h2>
          <p className="text-slate-500 font-semibold text-xs mt-1">Access your Partner Portal & Leads</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold animate-fadeIn">
            {error}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => { setAuthMethod("whatsapp"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              authMethod === "whatsapp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp OTP
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod("email"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              authMethod === "email" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-slate-600" /> Email Login
          </button>
        </div>

        {authMethod === "whatsapp" ? (
          <form onSubmit={handleSendMobileOtp} className="space-y-4">
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors w-5 h-5" />
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="w-full h-13 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || mobileNumber.length !== 10}
              className="w-full h-13 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 text-sm"
            >
              {otpLoading ? <Loader2 className="animate-spin w-4 h-4" /> : (
                <>Send WhatsApp OTP <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors w-5 h-5" />
              <input
                type="email"
                placeholder="Partner Email"
                className="w-full h-13 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                className="w-full h-13 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 text-sm"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (
                <>Sign In with Password <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )}

        <div className="flex items-center gap-4 my-5">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Or</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs transition-all disabled:opacity-50 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center text-xs font-bold text-slate-500 mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
          <p>
            New to Techstar Money?{" "}
            <Link href="/onboarding" className="text-emerald-600 hover:text-emerald-700 underline font-black">
              Register as DSA Partner &rarr;
            </Link>
          </p>
          <p>
            <Link href="/application-status" className="text-slate-400 hover:text-slate-600 text-[11px]">
              Track Submitted Application Status
            </Link>
          </p>
        </div>
      </div>

      {/* WhatsApp OTP Modal */}
      <WhatsAppOtpModal
        isOpen={showOtpModal}
        phoneNumber={mobileNumber}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
        onChangeNumber={() => setShowOtpModal(false)}
      />
    </div>
  );
}

