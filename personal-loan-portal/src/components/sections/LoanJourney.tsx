"use client"
import React from "react"
import { motion } from "framer-motion"
import { ClipboardEdit, HeartHandshake, CheckSquare, Coins } from "lucide-react"
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
    title: "Compare Offers",
    desc: "Instantly view and compare offers from India's top lending partners.",
    icon: HeartHandshake,
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "03",
    title: "Upload Documents",
    desc: "Complete your paperless verification with quick digital uploads.",
    icon: CheckSquare,
    color: "from-emerald-500 to-teal-500",
  },
  {
    step: "04",
    title: "Instant Disbursal",
    desc: "Get your approved loan amount directly credited into your account.",
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">Get your funding in 4 simple and completely transparent steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Animated Connecting Gradient line for Desktop */}
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 -translate-y-14 hidden lg:block opacity-25" />

          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative"
              >
                <PremiumCard className="p-8 h-full flex flex-col items-center text-center hover-lift min-h-[300px]" glowColor="rgba(59, 130, 246, 0.06)">
                  {/* Step bubble */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/10`}>
                    <Icon size={26} />
                  </div>

                  <span className="absolute top-4 right-6 text-5xl font-black text-slate-200/50 dark:text-slate-800/20 select-none">
                    {item.step}
                  </span>

                  <h3 className="text-lg font-black text-secondary dark:text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
                </PremiumCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
