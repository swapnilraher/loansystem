"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { PremiumCard } from "../ui/PremiumCard"
import { Award, DollarSign, ShieldCheck, Zap, ArrowRight, UserPlus } from "lucide-react"

export function BecomePartner() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: "", mobile: "", city: "Pune" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const benefits = [
    { title: "Highest Payouts", desc: "Get industry-best commission rates on all successful disbursals.", icon: DollarSign, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { title: "50+ Banking Partners", desc: "Access the entire credit catalog of top-tier private/public banks & NBFCs.", icon: ShieldCheck, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { title: "Instant Code Generation", desc: "Sign up digitally and get your official referral partner code in 24 hours.", icon: Zap, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
  ]

  return (
    <section id="dsa-partner" className="py-12 md:py-16 bg-slate-50/50 dark:bg-slate-900/10 relative overflow-hidden transition-colors duration-300">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
            B2B DSA Partner Program
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
            Partner with Techstar Money Solution as a <span className="text-primary italic">Loan DSA Agent</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Become a certified connector or sub-agent. Submit customer leads, track payouts in real-time, and scale your financial agency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left: Interactive Details */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <h3 className="text-xl font-black text-secondary dark:text-white mb-2 uppercase tracking-tight">Why Choose Techstar Money Solution DSA Program?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => (
                <PremiumCard 
                  key={idx} 
                  className="p-5 border-slate-150/40 dark:border-slate-800"
                  glowColor="rgba(16, 185, 129, 0.05)"
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl ${benefit.color} flex items-center justify-center shrink-0`}>
                      <benefit.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-secondary dark:text-white mb-1">{benefit.title}</h4>
                      <p className="text-[11px] font-semibold text-slate-550 dark:text-slate-400 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                </PremiumCard>
              ))}
              
              <PremiumCard 
                className="p-5 border-primary/20 bg-primary/5 dark:bg-primary/10"
                glowColor="rgba(16, 185, 129, 0.1)"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-secondary dark:text-white mb-1">Zero Investment</h4>
                    <p className="text-[11px] font-semibold text-slate-550 dark:text-slate-400 leading-relaxed">Start your loan business at absolute zero setup or franchise cost.</p>
                  </div>
                </div>
              </PremiumCard>
            </div>
          </div>

          {/* Right: Quick Registration Card */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-150/50 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
              
              {submitted ? (
                <div className="text-center space-y-6 py-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-900/30">
                    <ShieldCheck size={36} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-secondary dark:text-white text-lg">Application Received!</h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      Thank you, <span className="text-secondary dark:text-white font-bold">{formData.name}</span>. Our partnership desk will reach out to you on <span className="text-secondary dark:text-white font-bold">{formData.mobile}</span> within 2 hours.
                    </p>
                  </div>
                  <Button 
                    className="w-full h-11 text-xs font-black uppercase tracking-wider"
                    onClick={() => { setSubmitted(false); setFormData({ name: "", mobile: "", city: "Pune" }) }}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-primary flex items-center justify-center shrink-0">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-secondary dark:text-white text-base leading-tight">Start Earning Today</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Apply for DSA License</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5">Full Name</label>
                      <input 
                        type="text" required placeholder="As per PAN Card" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5">Mobile Number</label>
                      <input 
                        type="tel" required placeholder="10-digit mobile number" 
                        maxLength={10}
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5">Select City</label>
                      <select 
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white outline-none font-bold"
                      >
                        <option>Pune</option>
                        <option>Nashik</option>
                        <option>Mumbai</option>
                        <option>Chhatrapati Sambhajianagar</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <Button type="submit" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white mt-2">
                      Become a Partner <ArrowRight className="ml-2" size={14} />
                    </Button>

                    <p className="text-[9px] text-center text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                      ⚡ Real-Time Tracking App Included
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
