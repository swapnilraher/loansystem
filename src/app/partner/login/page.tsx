"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Smartphone,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
  IndianRupee,
} from "lucide-react";
import WhatsAppOtpModal from "@/components/onboarding/WhatsAppOtpModal";

// ── Benefit card data ────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Multiple Loan Products",
    desc: "Access a wide range of financial products across 50+ leading banks and NBFCs.",
  },
  {
    icon: Users,
    title: "Easy Lead Management",
    desc: "Submit, track and manage every customer application from a single dashboard.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Tracking",
    desc: "Monitor every file from submission to final disbursement in real time.",
  },
  {
    icon: IndianRupee,
    title: "Transparent Earnings",
    desc: "Track your commissions, payouts and monthly earnings with full transparency.",
  },
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber);

  // ── WhatsApp OTP ──────────────────────────────────────────────────────────
  const handleSendMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMobileValid) {
      setError("Please enter a valid 10-digit Indian mobile number.");
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
      setError(err.message || "We couldn't send the OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpVerified = async (token: string) => {
    setShowOtpModal(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/status?mobile=${mobileNumber}`);
      const data = await res.json();

      if (res.ok && data.application) {
        const status = data.application.status;
        if (status === "approved") {
          // Fully approved DSA partner → enter portal
          router.push("/partner");
        } else {
          // submitted / under_review / queried / rejected → show status tracker
          router.push(`/application-status?mobile=${mobileNumber}`);
        }
      } else {
        // No application at all → start fresh onboarding
        router.push("/onboarding");
      }
    } catch {
      // Network error → fallback to onboarding
      router.push("/onboarding");
    } finally {
      setLoading(false);
    }
  };

  // ── Email login ───────────────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await loginWithEmailAndPassword(email, password);
      // Check application status before routing
      const userEmail = cred?.user?.email || email;
      const res = await fetch(`/api/onboarding/status?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();

      if (res.ok && data.application) {
        const status = data.application.status;
        if (status === "approved") {
          router.push("/partner");
        } else {
          router.push(`/application-status?email=${encodeURIComponent(userEmail)}`);
        }
      } else {
        // No application → start onboarding
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGooglePopup();
      router.push("/partner");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F0F4FA] font-sans">

      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT BRANDING PANEL  –  hidden on mobile
      ═══════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between overflow-hidden bg-[#0B1F4B]">

        {/* Abstract geometric background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Large arc */}
          <svg className="absolute -top-24 -left-24 opacity-10" width="600" height="600" viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="280" stroke="white" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="210" stroke="white" strokeWidth="1" />
            <circle cx="300" cy="300" r="140" stroke="white" strokeWidth="0.5" />
          </svg>
          {/* Bottom right arc */}
          <svg className="absolute bottom-0 right-0 opacity-10 translate-x-1/3 translate-y-1/3" width="500" height="500" viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="230" stroke="white" strokeWidth="1" />
            <circle cx="250" cy="250" r="160" stroke="white" strokeWidth="0.7" />
          </svg>
          {/* Diagonal grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M48 0L0 48M0 0L48 48" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Glowing dots */}
          <div className="absolute top-1/3 right-12 w-2 h-2 bg-blue-400 rounded-full opacity-60 shadow-[0_0_20px_8px_rgba(96,165,250,0.3)]" />
          <div className="absolute bottom-1/3 left-16 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-40 shadow-[0_0_14px_6px_rgba(147,197,253,0.3)]" />
        </div>

        <div className="relative z-10 p-10 xl:p-14 flex flex-col h-full">

          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shadow-md">
                <Image
                  src="/img/logo.webp"
                  alt="Techstar Money"
                  width={44}
                  height={44}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-white font-black text-base leading-none tracking-tight">Techstar Money</p>
                <p className="text-blue-300 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Solution Pvt. Ltd.</p>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-3xl xl:text-4xl font-black text-white leading-snug tracking-tight">
              Grow Your Business<br />
              <span className="text-blue-300">with Techstar Money</span>
            </h1>
            <p className="text-blue-100/70 text-sm mt-4 leading-relaxed font-medium max-w-xs">
              Access multiple financial products, manage leads and track your partner earnings from one powerful portal.
            </p>
          </div>

          {/* Benefit cards */}
          <div className="space-y-3 flex-1">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <b.icon className="w-4.5 h-4.5 text-blue-300" size={18} />
                </div>
                <div>
                  <p className="text-white font-bold text-[13px] leading-snug">{b.title}</p>
                  <p className="text-blue-100/60 text-[11px] mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom trust badge */}
          <div className="mt-8 flex items-center gap-2 text-blue-200/50 text-[11px] font-medium">
            <Shield size={13} />
            <span>Techstar Money Partner Ecosystem — Trusted by 500+ DSA Partners</span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT LOGIN SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 min-h-screen">

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8 self-start">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0B1F4B] flex items-center justify-center shadow-sm">
            <Image src="/img/logo.webp" alt="Techstar Money" width={36} height={36} className="object-contain" priority />
          </div>
          <div>
            <p className="text-[#0B1F4B] font-black text-sm leading-none">Techstar Money</p>
            <p className="text-slate-400 text-[9px] font-semibold tracking-widest uppercase mt-0.5">DSA Partner Portal</p>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-[0_8px_40px_rgba(11,31,75,0.10)] border border-slate-200/80 px-7 sm:px-8 py-8 sm:py-10">

          {/* Card header */}
          <div className="mb-7">
            {/* Desktop inline logo + headings */}
            <div className="hidden lg:flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0B1F4B]/5 border border-[#0B1F4B]/10 flex items-center justify-center">
                <Image src="/img/logo.webp" alt="Techstar Money" width={36} height={36} className="object-contain" />
              </div>
              <div>
                <p className="text-[#0B1F4B] font-black text-sm leading-none">Techstar Money</p>
                <p className="text-slate-400 text-[9px] font-semibold tracking-widest uppercase mt-0.5">DSA Partner Portal</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-[26px] font-black text-[#0B1F4B] tracking-tight leading-snug">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Login to your Techstar Money DSA Partner Portal</p>

            {/* Security trust row */}
            <div className="flex items-center gap-1.5 mt-3">
              <Shield size={13} className="text-[#1A73E8] shrink-0" />
              <span className="text-[11px] text-slate-400 font-medium">Secure Partner Login — Your information is protected.</span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <span className="text-red-500 text-sm mt-0.5">⚠</span>
              <p className="text-red-700 text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Method switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/70">
            {(["whatsapp", "email"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => { setAuthMethod(method); setError(""); }}
                className={`flex-1 py-2.5 rounded-[10px] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  authMethod === method
                    ? "bg-white text-[#0B1F4B] shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {method === "whatsapp" ? (
                  <>
                    {/* WhatsApp icon */}
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.555 4.122 1.523 5.853L0 24l6.27-1.497A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.67-.51-5.192-1.4l-.372-.22-3.724.888.934-3.622-.242-.375A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    WhatsApp OTP
                  </>
                ) : (
                  <>
                    <Mail size={13} className="shrink-0" />
                    Email Login
                  </>
                )}
              </button>
            ))}
          </div>

          {/* ── WhatsApp OTP form ────────────────────────────────────────── */}
          {authMethod === "whatsapp" ? (
            <form onSubmit={handleSendMobileOtp} className="space-y-4" noValidate>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                <div className="relative flex items-stretch">
                  {/* Prefix */}
                  <div className="flex items-center px-3.5 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-[13px] font-bold select-none shrink-0 gap-1.5">
                    <Smartphone size={14} className="text-slate-400" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); setError(""); }}
                    className="flex-1 h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-r-xl text-[14px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10 transition-all"
                    autoComplete="tel"
                    autoFocus
                    required
                  />
                </div>
                {mobileNumber.length > 0 && !isMobileValid && (
                  <p className="text-red-500 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                    <span>⚠</span> Please enter a valid 10-digit Indian mobile number.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading || !isMobileValid}
                className="w-full h-[52px] bg-[#0B1F4B] hover:bg-[#0d2457] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-[14px] shadow-md shadow-[#0B1F4B]/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  <>
                    Send WhatsApp OTP
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

          ) : (
            /* ── Email + Password form ───────────────────────────────────── */
            <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full h-[52px] pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="w-full h-[52px] pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-[#0B1F4B] hover:bg-[#0d2457] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-[14px] shadow-md shadow-[#0B1F4B]/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Separator */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-[52px] flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] rounded-xl text-slate-700 font-bold text-[13.5px] shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* CTA links */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-center">
            <p className="text-[13px] text-slate-500 font-medium">
              New to Techstar Money?{" "}
              <Link
                href="/onboarding"
                className="text-[#1A73E8] hover:text-[#1557b0] font-bold underline-offset-2 hover:underline transition-colors"
              >
                Register as DSA Partner →
              </Link>
            </p>
            <Link
              href="/application-status"
              className="block text-[11.5px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              Track Submitted Application Status
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center space-y-2">
          <p className="text-[12px] font-semibold text-slate-500">Techstar Money Solution Pvt. Ltd.</p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <Link href="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms-conditions" className="hover:text-slate-600 transition-colors">Terms & Conditions</Link>
            <span>·</span>
            <a href="tel:9579005645" className="hover:text-slate-600 transition-colors">Contact Support</a>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Shield size={11} className="text-slate-400" />
            Secure &amp; Encrypted Partner Portal &nbsp;·&nbsp; © {new Date().getFullYear()} Techstar Money
          </p>
        </footer>
      </main>

      {/* WhatsApp OTP Modal — functionality unchanged */}
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
