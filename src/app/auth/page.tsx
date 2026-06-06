"use client"

import React, { useState } from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { ShieldCheck, Mail, Lock, Phone, ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center p-4 pt-32 pb-20">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          
          {/* Left Side: Branding/Info */}
          <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10">
              <a href="/" className="flex items-center gap-3 mb-16">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white overflow-hidden">
                  <img src="/img/logo.jpeg" alt="Techstar Money Solution Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-3xl font-black italic tracking-tighter">Techstar Money Solution</span>
              </a>
              
              <div className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black leading-tight">Welcome to <br/><span className="text-primary">Your Financial Future.</span></h2>
                  <p className="text-slate-400 text-lg">Manage your loans, track your credit score, and unlock exclusive financial rewards.</p>
                </div>
                
                <div className="space-y-6">
                  {[
                    "One-click Google Login",
                    "WhatsApp OTP Verification",
                    "Real-time Application Tracking",
                    "256-bit Bank Grade Security"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 font-bold text-slate-300">
                      <div className="w-2 h-2 bg-primary rounded-full" /> {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-10 border-t border-slate-800 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User" />
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium">Joined by 10,000+ users this month</p>
            </div>
          </div>

          {/* Right Side: Auth Form */}
          <div className="p-10 md:p-16 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full space-y-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-secondary tracking-tight">
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </h3>
                <p className="text-muted-foreground font-medium">
                  {mode === "login" ? "Log in to access your dashboard" : "Join Techstar Money Solution for a smarter financial journey"}
                </p>
              </div>

              {/* Social Login */}
              <div className="space-y-4">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 flex items-center justify-center gap-3 font-bold group">
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                  Continue with Google
                </Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 flex items-center justify-center gap-3 font-bold text-green-600 group">
                  <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                  OTP via WhatsApp
                </Button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative bg-white px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Or continue with</span>
              </div>

              <form className="space-y-4">
                {mode === "register" && (
                  <Input label="Full Name" placeholder="John Doe" />
                )}
                <Input label="Email Address" placeholder="name@company.com" type="email" />
                <Input label="Password" placeholder="••••••••" type="password" />
                
                <Button className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-wider shadow-xl shadow-primary/20">
                  {mode === "login" ? "Sign In" : "Get Started"}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button 
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-primary font-black hover:underline"
                  >
                    {mode === "login" ? "Sign Up" : "Log In"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
