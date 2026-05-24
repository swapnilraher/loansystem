"use client"
import React from "react"
import { Shield, Heart, Car, Umbrella, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"
import { PremiumCard } from "../ui/PremiumCard"

const insurances = [
  { 
    title: "Term Insurance", 
    icon: Shield, 
    desc: "₹1 Cr life cover starting at ₹500/month", 
    color: "bg-blue-500",
    glow: "rgba(59, 130, 246, 0.15)" 
  },
  { 
    title: "Health Insurance", 
    icon: Heart, 
    desc: "Cashless treatment at 10,000+ hospitals", 
    color: "bg-rose-500",
    glow: "rgba(244, 63, 94, 0.15)"
  },
  { 
    title: "Car Insurance", 
    icon: Car, 
    desc: "Instant policy issuance & zero dep cover", 
    color: "bg-amber-500",
    glow: "rgba(245, 158, 11, 0.15)"
  },
]

export function Insurance() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[150px] rounded-full translate-x-1/2" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Column */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-black uppercase tracking-widest">
              <Umbrella size={14} /> Total Protection
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">
              Protect What <span className="text-primary italic">Matters Most</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              From your life and health to your car and travel, we partner with top insurers to bring you the most comprehensive coverage at the best premiums.
            </p>
            <div className="space-y-4 pt-2">
              {["Compare 50+ Insurers", "Instant Policy Issuance", "Dedicated Claims Support"].map((t, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-slate-300">
                  <CheckCircle2 size={20} className="text-primary" /> {t}
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-wider shadow-xl shadow-primary/20 cursor-pointer">Explore Plans</Button>
            </div>
          </motion.div>

          {/* Right Cards Column */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 gap-6"
          >
            {insurances.map((ins, i) => {
              const Icon = ins.icon
              return (
                <motion.div key={i} variants={cardVariants}>
                  <PremiumCard 
                    className="bg-slate-800/40 border-slate-700/50 hover:border-primary/50 text-white p-8 flex items-center gap-6 cursor-pointer"
                    glowColor={ins.glow}
                  >
                    <div className={`w-16 h-16 ${ins.color} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black mb-1">{ins.title}</h3>
                      <p className="text-slate-400 text-sm font-semibold">{ins.desc}</p>
                    </div>
                    <ArrowRight size={24} className="text-slate-650 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                  </PremiumCard>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
