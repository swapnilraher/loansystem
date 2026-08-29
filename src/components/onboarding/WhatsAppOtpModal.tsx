"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

interface WhatsAppOtpModalProps {
  isOpen: boolean;
  phoneNumber: string;
  onClose: () => void;
  onVerified: (verificationToken: string) => void;
  onChangeNumber: () => void;
}

export default function WhatsAppOtpModal({
  isOpen,
  phoneNumber,
  onClose,
  onVerified,
  onChangeNumber,
}: WhatsAppOtpModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(54);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP sent on WhatsApp.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP code");
      }

      onVerified(data.verificationToken);
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");

      setCountdown(54);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP via WhatsApp.");
    } finally {
      setResending(false);
    }
  };

  const formattedTimer = `00:${countdown < 10 ? `0${countdown}` : countdown}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold">Mobile Verification</h3>
          <p className="text-emerald-100 text-sm mt-1">We sent a 6-digit OTP code to your mobile number</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-slate-600 text-sm font-medium">OTP sent to mobile number:</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-slate-900 font-bold text-lg">+91 {phoneNumber}</span>
              <button
                type="button"
                onClick={onChangeNumber}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold underline"
              >
                Change Number
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* OTP Box Inputs */}
          <form onSubmit={handleVerify}>
            <div className="flex justify-between gap-2 mb-6">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verifying OTP...
                </>
              ) : (
                <>
                  Verify OTP Code
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Timer and Resend */}
          <div className="mt-6 text-center text-sm">
            {!canResend ? (
              <p className="text-slate-500">
                Didn't receive OTP? Resend in{" "}
                <span className="font-semibold text-slate-800">{formattedTimer}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1.5"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  "Resend Verification OTP"
                )}
              </button>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted 256-bit Mobile Verification Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
