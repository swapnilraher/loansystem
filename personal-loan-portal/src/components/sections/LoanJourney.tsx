"use client"
import React from "react"
import { motion } from "framer-motion"
import { ClipboardEdit, HeartHandshake, CheckSquare, Coins, ShieldCheck } from "lucide-react"
import { PremiumCard } from "../ui/PremiumCard"

const steps = [
  {
    step: "01",
    title: "Apply Online",
    desc: "Fill in your basic details and loan requirements in under 2 minutes.",
    icon: ClipboardEdit,
    color: "from-blue-500 to-indigo-500",
  },
  {
    step: "02",
    title: "Document Support",
    desc: "Our experts assist you in preparing and arranging required financial documents.",
    icon: HeartHandshake,
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "03",
    title: "Verification",
    desc: "Fast, 100% secure paperless validation of your application details.",
    icon: ShieldCheck,
    color: "from-blue-600 to-cyan-500",
  },
  {
    step: "04",
    title: "Bank Approval",
    desc: "Top banks approve your application with the best matched offers.",
    icon: CheckSquare,
    color: "from-emerald-500 to-teal-500",
  },
  {
    step: "05",
    title: "Instant Disbursal",
    desc: "Approved funds are directly credited to your bank account within 24 hours.",
    icon: Coins,
    color: "from-amber-500 to-orange-500",
  },
]

export function LoanJourney() {
  return (
    <section className="py-20 lg:py-24 bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">Process Flow</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight">Your Loan Approval Journey</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">Get your funding in 5 simple, transparent, and expert-assisted steps.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {/* Connecting gradient line (Desktop Only) */}
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 -translate-y-14 hidden lg:block opacity-25" />

          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="relative animate-float"
                style={{ animationDelay: `${idx * 0.5}s`, animationDuration: "5s" }}
              >
                <PremiumCard className="p-6 h-full flex flex-col items-center text-center hover-lift min-h-[280px]" glowColor="rgba(59, 130, 246, 0.06)">
                  {/* Step bubble */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/10`}>
                    <Icon size={22} />
                  </div>

                  <span className="absolute top-4 right-6 text-4xl font-black text-slate-200/50 dark:text-slate-800/20 select-none">
                    {item.step}
                  </span>

                  <h3 className="text-base font-black text-secondary dark:text-white mb-3 leading-tight">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
                </PremiumCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
