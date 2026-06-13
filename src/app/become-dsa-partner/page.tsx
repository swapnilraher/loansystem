"use client"

import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { PremiumCard } from "@/components/ui/PremiumCard"
import { 
  UserPlus, 
  UploadCloud, 
  Coins, 
  Star, 
  ShieldCheck, 
  DollarSign, 
  Zap, 
  ArrowRight,
  Users
} from "lucide-react"

export default function BecomeDSAPartnerPage() {
  const benefits = [
    { title: "Highest Payouts", desc: "Get industry-best commission rates on all successful disbursals with zero delays.", icon: DollarSign, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { title: "50+ Banking Partners", desc: "Access the entire credit catalog of top-tier private/public banks & NBFCs instantly.", icon: ShieldCheck, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { title: "Instant Portal Access", desc: "Get your official referral partner code and dashboard log in within 24 hours.", icon: Zap, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
    { title: "Dedicated RM Support", desc: "Direct support from experienced relationship managers for file processing.", icon: Users, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" },
  ]

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[5%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-955/20 text-primary rounded-full text-xs font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30 shadow-sm mx-auto">
            <Star size={14} fill="currentColor" /> B2B DSA Partner Program
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-secondary dark:text-white tracking-tight leading-[1.15]">
            Partner with Techstar Money Solution as a <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-650 drop-shadow-sm italic">Loan DSA Agent</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-650 dark:text-slate-400 font-bold max-w-xl mx-auto leading-relaxed">
            Become a certified connector or sub-agent. Submit customer leads, track payouts in real-time, and scale your financial agency.
          </p>
        </div>
      </section>

      {/* Flow Diagram (Register -> Submit Lead -> Earn Commission) */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800/60 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4">
            
            {/* Vertical connector line for mobile */}
            <div className="absolute top-10 bottom-10 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-blue-500 via-amber-500 to-emerald-500 border-dashed border-l md:hidden pointer-events-none" />

            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-4 relative z-10 group w-full">
              <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center shadow-lg border-2 border-blue-100 dark:border-blue-900/30 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <UserPlus size={36} />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-full">Step 1</span>
                <h3 className="font-black text-lg text-secondary dark:text-white tracking-tight">Register as DSA</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[220px]">
                Fill out the digital registration form. Complete instant Aadhaar & PAN verification.
              </p>
            </div>

            {/* Connector 1 (Desktop) */}
            <div className="hidden md:flex items-center justify-center text-slate-300 dark:text-slate-700 w-12 shrink-0 z-10">
              <svg className="w-8 h-8 animate-pulse text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-4 relative z-10 group w-full">
              <div className="w-20 h-20 rounded-[2rem] bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-450 flex items-center justify-center shadow-lg border-2 border-amber-100 dark:border-amber-900/30 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <UploadCloud size={36} />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-450 text-[9px] font-black uppercase tracking-widest rounded-full">Step 2</span>
                <h3 className="font-black text-lg text-secondary dark:text-white tracking-tight">Submit Leads</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[220px]">
                Log in to your partner portal dashboard and instantly submit new client leads.
              </p>
            </div>

            {/* Connector 2 (Desktop) */}
            <div className="hidden md:flex items-center justify-center text-slate-300 dark:text-slate-700 w-12 shrink-0 z-10">
              <svg className="w-8 h-8 animate-pulse text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-4 relative z-10 group w-full">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center shadow-lg border-2 border-emerald-100/50 dark:border-emerald-900/30 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Coins size={36} />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full">Step 3</span>
                <h3 className="font-black text-lg text-secondary dark:text-white tracking-tight">Earn Commission</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[220px]">
                Get high payouts transferred directly into your bank account on successful disbursal.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Program Benefits */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-xl md:text-2xl font-black text-secondary dark:text-white uppercase tracking-tight text-center mb-12">Program Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <PremiumCard 
                key={idx} 
                className="p-6 border-slate-150/40 dark:border-slate-800"
                glowColor="rgba(16, 185, 129, 0.05)"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center shrink-0`}>
                    <benefit.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-secondary dark:text-white mb-1">{benefit.title}</h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Verification Flow (Auth -> Aadhaar -> PAN -> Sign) */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800/60 relative">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-secondary dark:text-white uppercase tracking-tight">Onboarding Verification Flow</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">4 simple verification steps to activate your code</p>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-10 md:gap-4 pt-12">
            
            {/* Vertical connector line for mobile */}
            <div className="absolute top-16 bottom-16 left-1/2 -translate-x-1/2 w-0.5 bg-slate-200 dark:bg-slate-800 border-dashed border-l md:hidden pointer-events-none" />

            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-3 relative z-10 w-full group">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-primary/20 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div className="absolute top-6 left-[60%] hidden md:block w-[80%] h-0.5 bg-slate-200 dark:bg-slate-800 border-dashed border-t" />
              <div className="space-y-1">
                <h3 className="font-black text-sm text-secondary dark:text-white tracking-tight">Sign-In</h3>
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">Basic setup details</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[160px]">
                Authenticate with Google and configure your business profile type.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-3 relative z-10 w-full group">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-primary/20 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <div className="absolute top-6 left-[60%] hidden md:block w-[80%] h-0.5 bg-slate-200 dark:bg-slate-800 border-dashed border-t" />
              <div className="space-y-1">
                <h3 className="font-black text-sm text-secondary dark:text-white tracking-tight">Aadhaar eKYC</h3>
                <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest leading-none">Secure OTP validation</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[160px]">
                Verify your identity securely via OTP sent to Aadhaar-registered mobile.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-3 relative z-10 w-full group">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-primary/20 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <div className="absolute top-6 left-[60%] hidden md:block w-[80%] h-0.5 bg-slate-200 dark:bg-slate-800 border-dashed border-t" />
              <div className="space-y-1">
                <h3 className="font-black text-sm text-secondary dark:text-white tracking-tight">PAN Verification</h3>
                <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest leading-none">Instant identity check</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[160px]">
                Submit and instantly check your PAN registration details for matching.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex-1 flex flex-col items-center text-center space-y-3 relative z-10 w-full group">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-primary/20 group-hover:scale-110 transition-transform duration-300">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-secondary dark:text-white tracking-tight">DSA Agreement</h3>
                <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-widest leading-none">Digital eSign contract</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[160px]">
                Accept and sign the digital eSign partnership agreement to activate code.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call To Action Section (Button & Registration Link) */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center space-y-6 bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl font-black italic relative z-10">Start Your Professional Journey Today</h2>
            <p className="text-slate-400 font-medium text-xs sm:text-sm max-w-md mx-auto relative z-10">Complete the onboarding registration process below and get your official B2B DSA Referral Partner Code instantly.</p>
            
            {/* Registration Button */}
            <div className="pt-2 relative z-10">
              <a 
                href="/partner/register"
                className="w-full sm:w-auto px-10 h-14 bg-primary text-white rounded-full font-black text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20 inline-flex items-center justify-center gap-2 group"
              >
                Register as DSA Partner
                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
              </a>
            </div>

            {/* Registration Link directly under the button */}
            <div className="space-y-2 relative z-10">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">Registration Link</p>
              <a 
                href="/partner/register"
                className="text-primary hover:underline font-black text-sm block mx-auto"
              >
                https://techstarsolution.in/partner/register
              </a>
            </div>

            <div className="pt-6 border-t border-slate-800 text-center relative z-10">
              <p className="text-xs text-slate-400 font-bold">
                Already registered?{" "}
                <a href="/partner/login" className="text-primary hover:underline font-black">Login to Partner Dashboard</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
