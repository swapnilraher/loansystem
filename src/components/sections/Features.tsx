"use client"
import React from "react"
import { motion } from "framer-motion"
import { Zap, Clock, ShieldCheck, FileCheck, Layers, Globe, ArrowUpCircle, Repeat } from "lucide-react"
import { PremiumCard } from "@/components/ui/PremiumCard"

const features = [
  { icon: ShieldCheck, title: "No Collateral", desc: "No need to pledge any security or assets to get the loan." },
  { icon: Zap, title: "Quick Disbursal", desc: "Get funds in your bank account within 24 hours of approval." },
  { icon: Clock, title: "Flexible Tenure", desc: "Choose a repayment period ranging from 12 to 84 months." },
  { icon: FileCheck, title: "Minimal Paperwork", desc: "Completely digital process with minimal document uploads." },
  { icon: Layers, title: "Fixed EMIs", desc: "Enjoy stable monthly repayments with fixed interest rates." },
  { icon: Globe, title: "Online Application", desc: "Apply from anywhere, anytime through our secure portal." },
  { icon: Repeat, title: "Balance Transfer", desc: "Transfer your existing high-interest loan to a lower rate." },
  { icon: ArrowUpCircle, title: "Top-up Loans", desc: "Get additional funds on your existing personal loan." },
]

export function Features() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }

  return (
    <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">Benefits</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight">Features & Benefits</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Experience a hassle-free loan process designed to meet your immediate financial needs.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {features.map((f) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} variants={cardVariants}>
                <PremiumCard 
                  className="p-8 h-full flex flex-col min-h-[250px] cursor-pointer"
                  glowColor="rgba(37, 99, 235, 0.06)"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary mb-6 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                    <Icon size={28} />
                  </div>
                  <h4 className="text-lg font-black text-secondary dark:text-white mb-2">{f.title}</h4>
                  <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">{f.desc}</p>
                </PremiumCard>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
