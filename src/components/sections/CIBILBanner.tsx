"use client"
import React from "react"
import { Button } from "@/components/ui/Button"
import { TrendingUp, ShieldCheck, Award, Zap, CheckCircle2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function CIBILBanner() {
  return (
    <section className="py-10 md:py-14 relative overflow-hidden bg-slate-950">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-50 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[128px] opacity-50 mix-blend-screen pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-6 md:p-10 lg:p-12 overflow-hidden shadow-2xl">
          
          {/* Inner subtle glow */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-sm font-bold uppercase tracking-widest backdrop-blur-sm">
                  <TrendingUp size={16} /> Free Credit Health Check
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-black leading-[1.1] text-white">
                  Unlock Your Financial Power with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Great CIBIL Score</span>
                </h2>
                
                <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                  Checking your credit score is the first step towards your dream loan. It's completely free, secure, and won't impact your credit profile.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button size="lg" className="group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black h-14 px-8 text-lg rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-all duration-300">
                  Check Free Score <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
                
                <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500 sm:ml-4">
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> No impact on score</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-500"/> 100% Secure & Encrypted</div>
                </div>
              </div>
            </motion.div>
            
            {/* Right Content - Visual Representation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative lg:ml-auto w-full max-w-md mx-auto mt-8 lg:mt-0"
            >
              {/* Floating Badge 1 */}
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 lg:-right-12 z-20 bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Pre-approved</div>
                  <div className="text-xs text-slate-400">Loans available</div>
                </div>
              </motion.div>

              {/* Floating Badge 2 */}
              <motion.div 
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 z-20 bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Instant Results</div>
                  <div className="text-xs text-slate-400">Less than 2 mins</div>
                </div>
              </motion.div>

              {/* Main Score Card */}
              <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400" />
                
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-300">Your Credit Score</h3>
                    <p className="text-sm text-slate-500">Updated just now</p>
                  </div>
                  
                  {/* Gauge visual */}
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-700" strokeWidth="8" strokeDasharray="283" strokeDashoffset="0" />
                      <motion.circle 
                        initial={{ strokeDashoffset: 283 }}
                        whileInView={{ strokeDashoffset: 283 - (283 * 0.85) }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeWidth="8" strokeLinecap="round" strokeDasharray="283" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="text-5xl font-black text-white"
                      >
                        785
                      </motion.span>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="text-emerald-400 font-bold uppercase tracking-wider text-sm mt-1"
                      >
                        Excellent
                      </motion.span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center px-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Next Update</div>
                      <div className="text-sm font-semibold text-slate-300">30 Days</div>
                    </div>
                    <div className="w-px h-8 bg-slate-700/50"></div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Credit History</div>
                      <div className="text-sm font-semibold text-slate-300">4 Years</div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
