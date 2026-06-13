"use client"
import React from "react"
import { Button } from "@/components/ui/Button"
import { TrendingUp, ShieldCheck, Award, Zap, CheckCircle2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function CIBILBanner() {
  return (
    <section className="py-5 position-relative overflow-hidden bg-slate-950">
      {/* Background glowing effects */}
      <div className="position-absolute start-0 w-[40rem] h-[40rem] bg-paytm-blue/15 rounded-circle blur-[128px] pointer-events-none" style={{ top: "-10%" }} />
      <div className="position-absolute end-0 w-[40rem] h-[40rem] bg-warning/5 rounded-circle blur-[128px] pointer-events-none" style={{ bottom: "-10%" }} />
      
      <div className="container py-4 relative z-10">
        <div className="card border-0 bg-gradient-to-br from-slate-900 via-slate-900 to-paytm-navy p-4 p-md-5 rounded-[3rem] shadow-xl overflow-hidden position-relative">
          
          <div className="row g-4 align-items-center relative z-10">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="col-lg-6 text-start space-y-4"
            >
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/20 text-warning rounded-pill text-xs font-black uppercase tracking-wider">
                <TrendingUp size={14} /> Free Credit Health Check
              </div>
              
              <h2 className="display-6 font-black leading-tight text-white m-0">
                Unlock Your Financial Power with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-warning to-amber-500">Free CIBIL Score</span>
              </h2>
              
              <p className="text-sm text-slate-400 max-w-lg leading-relaxed m-0">
                Checking your credit score is the first step towards getting your dream loan. It's completely free, secure, and won't impact your credit profile.
              </p>
              
              <div className="d-flex flex-wrap align-items-center gap-3 pt-3">
                <button className="btn btn-warning py-3 px-5 font-black rounded-pill text-xs uppercase tracking-wider text-slate-950 shadow-lg d-flex align-items-center gap-2 hover-lift">
                  Check Free Score <ArrowRight size={16} />
                </button>
                
                <div className="text-[10px] font-bold text-slate-500 d-flex flex-column gap-1 ms-lg-2 mt-3 mt-lg-0">
                  <div className="d-flex align-items-center gap-1.5"><CheckCircle2 size={12} className="text-success"/> No impact on score</div>
                  <div className="d-flex align-items-center gap-1.5"><ShieldCheck size={12} className="text-primary"/> 100% Secure & Encrypted</div>
                </div>
              </div>
            </motion.div>
            
            {/* Right Content - Visual Gauge Representation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="col-lg-6 d-flex justify-content-center mt-5 mt-lg-0"
            >
              <div className="position-relative w-100 max-w-sm">
                {/* Floating Badge 1 */}
                <motion.div 
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="position-absolute bg-slate-800/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-[1.5rem] shadow-xl d-flex align-items-center gap-3"
                  style={{ top: "-10px", right: "-10px", zIndex: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 d-flex align-items-center justify-content-center text-success">
                    <Award size={18} />
                  </div>
                  <div className="text-start leading-none">
                    <div className="text-xs font-black text-white mb-0.5">Pre-approved</div>
                    <div className="text-[10px] text-slate-400">Offers Available</div>
                  </div>
                </motion.div>

                {/* Floating Badge 2 */}
                <motion.div 
                  animate={{ y: [8, -8, 8] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="position-absolute bg-slate-800/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-[1.5rem] shadow-xl d-flex align-items-center gap-3"
                  style={{ bottom: "-10px", left: "-10px", zIndex: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-paytm-blue/20 d-flex align-items-center justify-content-center text-paytm-blue">
                    <Zap size={18} />
                  </div>
                  <div className="text-start leading-none">
                    <div className="text-xs font-black text-white mb-0.5">Instant check</div>
                    <div className="text-[10px] text-slate-400">In 2 Minutes</div>
                  </div>
                </motion.div>

                {/* Main Score Card */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-[2.5rem] p-5 shadow-2xl text-center">
                  <div className="mb-3">
                    <h4 className="fs-6 font-black text-slate-350 m-0">Credit Score Checker</h4>
                    <p className="text-[10px] text-muted m-0">Real-time CIBIL Health</p>
                  </div>
                  
                  {/* Gauge visual */}
                  <div className="position-relative w-40 h-40 mx-auto d-flex align-items-center justify-content-center mb-3">
                    <svg className="w-100 h-100 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="6" strokeDasharray="276" strokeDashoffset="0" />
                      <motion.circle 
                        initial={{ strokeDashoffset: 276 }}
                        whileInView={{ strokeDashoffset: 276 - (276 * 0.85) }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" strokeWidth="6" strokeLinecap="round" strokeDasharray="276" 
                      />
                    </svg>
                    <div className="position-absolute d-flex flex-column align-items-center justify-content-center mt-2 leading-none">
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="text-4xl font-black text-white m-0"
                      >
                        785
                      </motion.span>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="text-success text-[10px] font-black uppercase tracking-wider mt-1.5"
                      >
                        Excellent
                      </motion.span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-top border-slate-700/50 d-flex justify-content-between px-3">
                    <div>
                      <div className="text-[9px] text-uppercase font-black text-slate-500">Next Update</div>
                      <div className="text-xs font-black text-slate-300 mt-0.5">30 Days</div>
                    </div>
                    <div className="vr bg-slate-750"></div>
                    <div>
                      <div className="text-[9px] text-uppercase font-black text-slate-500">Credit History</div>
                      <div className="text-xs font-black text-slate-300 mt-0.5">4 Years</div>
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
