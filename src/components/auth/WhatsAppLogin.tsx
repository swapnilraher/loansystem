"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { X, MessageSquare, Phone, ArrowRight, ShieldCheck, Loader2, Mail, MapPin, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface WhatsAppLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppLogin({ isOpen, onClose }: WhatsAppLoginProps) {
  const [step, setStep] = useState<"login" | "otp" | "completion">("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { user, profile, updateProfile, loginWithGoogle } = useAuth();

  // Form fields for profile completion
  const [formData, setFormData] = useState({
    panName: "",
    email: "",
    city: "",
    mobile: ""
  });

  useEffect(() => {
    if (step === "completion" && profile) {
      setFormData({
        panName: profile.panName || "",
        email: profile.email || "",
        city: profile.city || "",
        mobile: profile.mobile || phoneNumber || ""
      });
    }
  }, [step, profile, phoneNumber]);

  useEffect(() => {
    if (user && profile) {
      const isComplete = profile.panName && profile.city && (profile.email || profile.mobile);
      if (isComplete) {
        onClose();
        router.push("/dashboard");
      } else {
        setStep("completion");
      }
    }
  }, [user, profile, router, onClose]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      setError("Please enter a valid mobile number");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      setError("Please enter the 4-digit OTP");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });
      const data = await res.json();
      if (data.success && data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      } else {
        setError(data.error || "Invalid OTP.");
      }
    } catch (err) {
      setError("Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!formData.panName || !formData.city || (!formData.email && !formData.mobile)) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        ...formData,
        mobile: formData.mobile || phoneNumber
      });
      onClose();
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save info.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "login":
        return (
          <div className="space-y-6">
            {/* WhatsApp Form Block */}
            <div className="bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-3xl border border-slate-100 dark:border-slate-800/50">
              <div className="p-2 pb-0">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">WhatsApp Number</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-slate-400 group-focus-within:text-[#25D366] transition-colors">
                    <span className="font-black text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 pr-3">+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="00000 00000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full h-14 pl-[4.5rem] pr-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-[#25D366] rounded-2xl outline-none transition-all font-black text-lg tracking-widest text-slate-800 dark:text-white shadow-sm"
                  />
                </div>
              </div>

              <div className="p-2 mt-2">
                <button
                  onClick={handleSendOTP}
                  disabled={loading || phoneNumber.length < 10}
                  className="w-full h-14 rounded-2xl text-white font-black text-lg flex justify-center items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 border-0"
                  style={{ backgroundColor: '#25D366' }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Get OTP via WhatsApp <ArrowRight size={20} /></>}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2 px-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-4 text-[10px] text-slate-400 font-black tracking-widest uppercase rounded-full">Or connect with</span></div>
            </div>

            {/* Google Login Section */}
            <div className="px-2 pb-2">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 flex justify-center items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                Continue with Google
              </button>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-4">One-tap secure access to your profile</p>
            </div>
          </div>
        );

      case "otp":
        return (
          <div className="space-y-6 text-center">
            <div>
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} />
              </div>
              <p className="text-sm font-medium text-slate-500">OTP sent to <span className="font-bold text-slate-900 dark:text-white">+91 {phoneNumber}</span></p>
              <button onClick={() => setStep("login")} className="text-green-500 text-xs font-black uppercase tracking-widest hover:underline mt-1">Change Number</button>
            </div>

            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  id={`otp-${i}`}
                  className="w-14 h-14 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 rounded-2xl text-center text-xl font-black outline-none transition-all shadow-sm"
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const val = (e.target as HTMLInputElement).value;
                    if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
                    const newOtp = otp.split("");
                    newOtp[i] = val;
                    setOtp(newOtp.join(""));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                  }}
                />
              ))}
            </div>

            <Button onClick={handleVerifyOTP} disabled={loading || otp.length < 4} className="w-full h-16 rounded-full bg-green-500 hover:bg-green-600 text-white font-black text-lg">
              {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
            </Button>
          </div>
        );

      case "completion":
        return (
          <div className="space-y-4">
            <p className="text-center text-sm font-bold text-slate-500 mb-2">Almost there! Complete your profile.</p>

            {[
              { label: "Name (as per PAN Card)", icon: User, value: formData.panName, key: "panName", placeholder: "Full Name" },
              { label: "Email Address", icon: Mail, value: formData.email, key: "email", placeholder: "email@example.com" },
              { label: "City", icon: MapPin, value: formData.city, key: "city", placeholder: "Your City" }
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                <div className="relative">
                  <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full h-12 pl-12 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border-2 border-transparent focus:border-primary font-bold transition-all"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                </div>
              </div>
            ))}

            <Button onClick={handleCompleteProfile} disabled={loading} className="w-full h-16 rounded-full bg-primary text-white font-black text-lg mt-4 shadow-lg shadow-blue-100 dark:shadow-none">
              {loading ? <Loader2 className="animate-spin" /> : "Save & Go to Dashboard"}
            </Button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            {/* Header Area */}
            <div className="pt-10 px-8 pb-4 relative text-center overflow-hidden">
              <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-48 h-48 bg-paytm-blue/10 dark:bg-paytm-blue/20 blur-[50px] rounded-full pointer-events-none" />
              <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"><X size={20} /></button>
              
              <div className="relative w-20 h-20 mx-auto mb-4 rounded-3xl shadow-xl overflow-hidden border-4 border-white dark:border-slate-800 bg-white flex items-center justify-center transform hover:-translate-y-1 transition-all z-10">
                <img src="/img/logo.jpeg" alt="Techstar Money Solution Logo" className="w-full h-full object-cover scale-110" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-2 relative z-10">
                Welcome to <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-paytm-navy to-paytm-blue">Techstar Money Solution</span>
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">Secure Login / Signup</p>
            </div>

            <div className="p-8 pt-4">
              {error && <p className="text-red-500 text-xs font-bold text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">{error}</p>}
              {renderStep()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
