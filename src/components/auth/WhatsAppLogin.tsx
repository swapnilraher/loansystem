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
            {/* WhatsApp Phone Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Login with WhatsApp OTP</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 rounded-2xl outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading || phoneNumber.length < 10}
                className="w-full h-16 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-xl shadow-green-100 flex gap-3 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Send WhatsApp OTP <ArrowRight size={20} /></>}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-black tracking-widest">OR</span></div>
            </div>

            {/* Google Login Section */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                disabled={loading}
                className="w-full h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-lg flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                Continue with Google
              </Button>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">One-tap secure access to your profile</p>
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

            <Button onClick={handleVerifyOTP} disabled={loading || otp.length < 4} className="w-full h-16 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-lg">
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

            <Button onClick={handleCompleteProfile} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg mt-4 shadow-lg shadow-blue-100 dark:shadow-none">
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
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-blue-700 p-8 text-white relative">
              <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors z-10"><X size={20} /></button>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tight leading-none">Login / Signup</h2>
                  <p className="text-white/80 text-sm mt-1">Get instant access to your portal</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {error && <p className="text-red-500 text-xs font-bold text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">{error}</p>}
              {renderStep()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
