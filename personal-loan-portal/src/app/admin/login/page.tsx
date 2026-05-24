"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -ml-64 -mb-64" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-primary rounded-2xl items-center justify-center shadow-2xl shadow-primary/40 mb-6">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Admin Control</h1>
          <p className="text-slate-500 font-medium italic">Secure access for TechStar employees</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Employee Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="email" 
                  placeholder="name@techstar.com" 
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Forgot?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="block w-full pl-12 pr-12 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/admin">
                <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                  Authenticate Access <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-3 py-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security Verified</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="text-center">
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                Protected by multi-factor authentication. <br/>
                Unauthorized access attempts are logged and reported.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
