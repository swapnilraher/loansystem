"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react"

export default function PartnerLogin() {
  const { loginWithEmailAndPassword, signInWithGooglePopup } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await loginWithEmailAndPassword(email, password)
      router.push("/partner")
    } catch (err: any) {
      setError(err.message || "Invalid credentials")
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      await signInWithGooglePopup()
      router.push("/partner")
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-secondary/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 relative z-10 border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-white rounded-3xl mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/30 mb-4">
            TS
          </div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">DSA Partner Login</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Access your TechStar partner portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-700 font-bold transition-all mb-6 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-100 flex-1" />
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Or Email</span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
            <input 
              type="email" 
              placeholder="Partner Email" 
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl text-sm font-bold outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl text-sm font-bold outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <>Sign In to Portal <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm font-bold text-slate-500 mt-8">
          Not registered yet? <a href="/partner/register" className="text-primary hover:underline">Apply as DSA</a>
        </p>
      </div>
    </div>
  )
}
