"use client"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ScanFace, FileCheck, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react"

export function AIDocVerification() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'verified'>('idle')

  useEffect(() => {
    if (status === 'scanning') {
      const timer = setTimeout(() => {
        setStatus('verified')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const startScan = () => setStatus('scanning')
  const reset = () => setStatus('idle')

  return (
    <div className="w-full max-w-md mx-auto glass-card p-6 rounded-[2rem] relative overflow-hidden">
      {/* Background Pulse */}
      <div className={`absolute inset-0 transition-colors duration-700 ${
        status === 'scanning' ? 'bg-primary/5' : status === 'verified' ? 'bg-emerald-500/5' : 'bg-transparent'
      }`} />

      <div className="relative z-10 text-center space-y-6">
        <div className="flex justify-center items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <ScanFace size={16} className={status === 'verified' ? 'text-emerald-500' : 'text-primary'} />
          AI Document Verification
        </div>

        <div className="relative h-48 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
          {/* Simulated Document */}
          <div className="w-3/4 h-3/4 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm p-4 flex flex-col gap-3 relative">
            <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-5/6 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded mt-auto flex items-center px-2">
              <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Scanning Laser */}
            {status === 'scanning' && (
              <motion.div
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: ["0%", "100%", "0%"], opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(37,99,235,1)] z-20"
              />
            )}
            
            {/* Verified Overlay */}
            <AnimatePresence>
              {status === 'verified' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center z-30"
                >
                  <div className="bg-emerald-500 text-white rounded-full p-3 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={32} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 flex items-center justify-center">
            {status === 'idle' && <p className="text-sm font-medium text-slate-500">Upload Aadhaar/PAN for instant AI verification.</p>}
            {status === 'scanning' && (
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Extracting Data using OCR...
              </p>
            )}
            {status === 'verified' && <p className="text-sm font-bold text-emerald-500">Identity Verified Successfully.</p>}
          </div>

          {status === 'idle' ? (
            <button 
              onClick={startScan}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl hover-lift shadow-premium"
            >
              Simulate Upload
            </button>
          ) : status === 'verified' ? (
             <button 
              onClick={reset}
              className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-premium"
            >
              Continue Application
            </button>
          ) : (
             <button 
              disabled
              className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold py-3 rounded-xl cursor-not-allowed"
            >
              Analyzing...
            </button>
          )}
        </div>

        {/* Mini Badges */}
        <div className="flex justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
            <ShieldCheck size={12} /> Fraud Detection
          </div>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
             <AlertCircle size={12} /> Liveness Check
          </div>
        </div>
      </div>
    </div>
  )
}
