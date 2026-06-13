"use client"
import React from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Lock, Award, Star, CheckCircle, FileText } from "lucide-react"

export function TrustSignals() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <Lock size={14} /> 100% Safe & Secure
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-secondary dark:text-white leading-tight mb-6">
            Your Trust is Our <span className="text-primary italic">Highest Priority</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            We partner exclusively with RBI-registered banks and NBFCs to ensure your financial data is fully protected by bank-grade security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Security Badges */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
              <ShieldCheck size={32} />
            </div>
            <h3 className="font-bold text-lg text-secondary dark:text-white">RBI Registered</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">All lending partners are RBI compliant & regulated</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
              <Lock size={32} />
            </div>
            <h3 className="font-bold text-lg text-secondary dark:text-white">256-bit SSL</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bank-grade encryption for all your personal data</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
              <Award size={32} />
            </div>
            <h3 className="font-bold text-lg text-secondary dark:text-white">ISO Certified</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Adhering to global standards of data protection</p>
          </motion.div>

          {/* Google Reviews */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl flex flex-col items-center text-center space-y-4 border-primary/20 bg-primary/5 dark:bg-primary/10"
          >
            <div className="flex gap-1 text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={24} fill="currentColor" />
              ))}
            </div>
            <h3 className="font-black text-2xl text-secondary dark:text-white">4.9/5 Rating</h3>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-4 object-contain brightness-0 dark:invert" /> 
              Reviews
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Based on 10,000+ customer reviews</p>
          </motion.div>
        </div>

        {/* Media Mentions & Partners */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 md:p-14 shadow-xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/3 text-center lg:text-left space-y-4">
              <h3 className="text-2xl font-black text-secondary dark:text-white">As Featured In</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Recognized by leading financial media for transparency and trust.</p>
            </div>
            <div className="lg:w-2/3 flex flex-wrap justify-center lg:justify-between items-center gap-8 lg:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-800 dark:text-slate-200">The Economic Times</span>
              <span className="text-xl md:text-2xl font-serif italic font-bold text-slate-800 dark:text-slate-200">Forbes</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-200 tracking-widest">mint</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-200">CNBC</span>
            </div>
          </div>
        </div>

        {/* Privacy & Secure Process Footer */}
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 dark:text-slate-400 px-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span>Zero Spam Policy. We never sell your data to third parties.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2">
              <FileText size={16} /> Privacy Policy
            </a>
            <a href="/terms" className="hover:text-primary transition-colors flex items-center gap-2">
              <FileText size={16} /> Terms of Service
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}
