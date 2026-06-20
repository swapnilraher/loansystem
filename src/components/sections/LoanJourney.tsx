"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { UserCheck, SlidersHorizontal, MousePointerClick, Landmark } from "lucide-react"

const steps = [
  {
    num: "01",
    title: "Eligibility",
    desc: "Tell us your requirement. 2 minutes fill details.",
    icon: UserCheck,
    // Desktop Coordinates (800x600 viewBox)
    dx: 200,
    dy: 100,
    align: "left"
  },
  {
    num: "02",
    title: "Compare",
    desc: "AI matches best banks 90+ criteria 90% success.",
    icon: SlidersHorizontal,
    dx: 700,
    dy: 200,
    align: "right"
  },
  {
    num: "03",
    title: "Apply",
    desc: "Digital bank application complete digitally.",
    icon: MousePointerClick,
    dx: 100,
    dy: 400,
    align: "left"
  },
  {
    num: "04",
    title: "Disbursement",
    desc: "Get quick sanction minutes not weeks.",
    icon: Landmark,
    dx: 600,
    dy: 500,
    align: "right"
  }
]

export function LoanJourney() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll for the path animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

  // Prevent reaching exactly 1 or 0 too early
  const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1])

  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      
      {/* Background Huge Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.02]">
        <img src="/img/logo.webp" alt="Watermark" width={800} height={800} className="w-[80vw] md:w-[60vw] max-w-[800px] object-contain grayscale" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        <div className="text-center mb-16 md:mb-24">
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-bold tracking-wider mb-2">The simple & Quick steps to your loan.</p>
          <h2 className="text-3xl md:text-5xl font-black text-paytm-navy dark:text-white tracking-tight">Your Loan Approval Journey</h2>
        </div>

        {/* --- DESKTOP S-CURVE TIMELINE --- */}
        <div className="hidden md:block relative max-w-[900px] mx-auto h-[600px]">
          
          {/* The SVG Path */}
          <svg viewBox="0 0 800 600" className="absolute inset-0 w-full h-full overflow-visible">
            {/* Background faint path */}
            <path 
              d="M 200 100 L 600 100 A 100 100 0 0 1 600 300 L 200 300 A 100 100 0 0 0 200 500 L 600 500" 
              fill="none" 
              stroke="currentColor" 
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Animated filled path */}
            <motion.path 
              d="M 200 100 L 600 100 A 100 100 0 0 1 600 300 L 200 300 A 100 100 0 0 0 200 500 L 600 500" 
              fill="none" 
              stroke="url(#gradientStroke)" 
              strokeWidth="6" 
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength }}
            />
            <defs>
              <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
                <stop offset="50%" stopColor="#0f766e" /> {/* teal-700 */}
                <stop offset="100%" stopColor="#1e293b" /> {/* slate-800 */}
              </linearGradient>
            </defs>
          </svg>

          {/* The Nodes and Text */}
          {steps.map((item, i) => (
            <motion.div 
              key={item.num}
              className="absolute flex items-center justify-center"
              style={{ 
                left: `${(item.dx / 800) * 100}%`, 
                top: `${(item.dy / 600) * 100}%`,
                transform: "translate(-50%, -50%)" 
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
            >
              {/* Icon Circle */}
              <div className="relative z-20 w-16 h-16 rounded-full bg-slate-900 border-4 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <item.icon size={28} strokeWidth={2.5} />
              </div>

              {/* Text Content (Positioned based on align) */}
              <div className={`absolute top-1/2 -translate-y-1/2 w-[220px] ${item.align === 'left' ? 'right-[calc(100%+24px)] text-right' : 'left-[calc(100%+24px)] text-left'}`}>
                <div className="absolute top-1/2 -translate-y-1/2 opacity-10 text-[80px] font-black font-mono leading-none -z-10 text-emerald-500 dark:text-emerald-300" style={{ [item.align === 'left' ? 'right' : 'left']: '10px' }}>
                  {item.num}
                </div>
                <h3 className="text-4xl font-black text-paytm-navy dark:text-white mb-2 leading-none flex items-center gap-3 justify-end flex-row-reverse" style={{ flexDirection: item.align === 'left' ? 'row' : 'row-reverse' }}>
                  {item.title} <span className="text-2xl text-paytm-navy/80 dark:text-white/80">{item.num}</span>
                </h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- MOBILE VERTICAL TIMELINE --- */}
        <div className="md:hidden relative px-4">
          
          {/* Vertical SVG Line */}
          <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <motion.div 
            className="absolute left-[39px] top-0 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-slate-800 origin-top"
            style={{ scaleY: pathLength }}
          />

          <div className="space-y-16 relative z-10 py-10">
            {steps.map((item, i) => (
              <motion.div 
                key={item.num}
                className="flex items-start gap-6"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {/* Icon */}
                <div className="relative z-20 w-12 h-12 shrink-0 rounded-full bg-slate-900 border-[3px] border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <item.icon size={20} strokeWidth={2.5} />
                </div>

                {/* Content */}
                <div className="pt-1 relative">
                  <div className="absolute -top-6 -left-2 opacity-[0.08] text-6xl font-black font-mono leading-none z-0 text-emerald-600 dark:text-emerald-400">
                    {item.num}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-paytm-navy dark:text-white mb-2 flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500">{item.num}</span> {item.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

        <div className="text-center mt-20">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all border border-slate-800 dark:border-slate-200"
          >
            Get Started &gt;
          </motion.button>
        </div>

      </div>
    </section>
  )
}
