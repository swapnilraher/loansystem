"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const { loginWithEmailAndPassword, signInWithGooglePopup, requestPasswordReset, resetPasswordWithOTP, user, adminRole } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  
  // OTP Flow States
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")

  // Redirect if already authenticated
  useEffect(() => {
    if (user && adminRole) {
      router.push("/admin")
    }
  }, [user, adminRole, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    setError(null)
    setResetMessage(null)
    try {
      await loginWithEmailAndPassword(email.trim(), password.trim())
      router.push("/admin")
    } catch (err: any) {
      console.error("Login Error:", err)
      if (
        err.code === "auth/invalid-credential" || 
        err.code === "auth/wrong-password" || 
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.")
      } else {
        setError(`Authentication failed: ${err.message || err.code || "Unknown error"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first to reset your password.")
      setResetMessage(null)
      return
    }
    setLoading(true)
    setError(null)
    setResetMessage(null)
    try {
      await requestPasswordReset(email)
      setResetMessage("OTP sent to your email! Please check your inbox.")
      setShowOtpForm(true)
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError("Failed to send reset email. Ensure the email is correct.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || !newPassword.trim()) {
      setError("Please enter OTP and new password.")
      return
    }
    setLoading(true)
    setError(null)
    setResetMessage(null)
    try {
      await resetPasswordWithOTP(email, otp, newPassword)
      setResetMessage("Password reset successful! You can now login.")
      setShowOtpForm(false)
      setOtp("")
      setNewPassword("")
      setPassword("") // Clear old password just in case
    } catch (err: any) {
      console.error("OTP verification failed:", err)
      setError("Failed to reset password. Invalid OTP or OTP expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden relative selection:bg-blue-500/30">
      {/* Dynamic Animated Background - Light Mode */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[100px] mix-blend-multiply" />
      
      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          {/* Logo container - Border removed, fully rounded */}
          <div className="mx-auto w-24 h-24 mb-6 relative group">
            <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
              <img src="/img/logo.jpeg" alt="Techstar Money Solution Logo" className="w-[85%] h-[85%] object-cover rounded-full" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Techstar Money Solution</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Staff Portal</p>
        </div>

        {/* Main Card - Extra rounded */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {resetMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck size={18} className="shrink-0" />
              <span className="font-medium">{resetMessage}</span>
            </div>
          )}

          {showOtpForm ? (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Enter OTP</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:opacity-50 tracking-[0.5em] text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_25px_-8px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowOtpForm(false)
                    setError(null)
                    setResetMessage(null)
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 font-bold transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="name@techstar.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-11 pr-12 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:opacity-50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_25px_-8px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await signInWithGooglePopup();
                  } catch (err) {
                    setError("Google sign in failed.");
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold tracking-wider uppercase">
              <ShieldCheck size={14} className="text-emerald-500" />
              Protected by Multi-Factor Auth
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
