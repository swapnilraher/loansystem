"use client"
import React from "react"
import { Star, Quote, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { PremiumCard } from "../ui/PremiumCard"

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Home Loan Customer",
    content: "Techstar Money Solution helped me find the best home loan rate when other banks were giving me 9%+. Got it at 8.45% through them. Highly recommended!",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=rahul",
    glow: "rgba(59, 130, 246, 0.08)"
  },
  {
    name: "Priya Patel",
    role: "Personal Loan Customer",
    content: "The digital process was seamless. I applied for a personal loan and the amount was in my bank within 24 hours. No paperwork, just digital!",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=priya",
    glow: "rgba(16, 185, 129, 0.08)"
  },
  {
    name: "Amit Varma",
    role: "Business Owner",
    content: "Excellent service. They guided me through all the documentation and helped me get a business loan without any collateral. Very professional.",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=amit",
    glow: "rgba(139, 92, 246, 0.08)"
  }
]

export function Testimonials() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }

  return (
    <section className="py-12 md:py-16 bg-slate-55/50 dark:bg-slate-900/10 relative overflow-hidden transition-colors duration-300">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.015] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 text-primary rounded-lg text-xs font-black uppercase tracking-widest mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <Star size={14} fill="currentColor" /> Customer Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-secondary dark:text-white leading-tight tracking-tight">
            Trusted by Thousands of <br/>
            <span className="text-primary italic">Happy Borrowers</span>
          </h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={cardVariants} className="h-full">
              <PremiumCard 
                className="p-6 md:p-8 h-full flex flex-col cursor-pointer border-slate-150/40 dark:border-slate-800"
                glowColor={t.glow}
              >
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[...Array(t.rating)].map((_, idx) => <Star key={idx} size={18} fill="currentColor" />)}
                </div>
                
                <Quote className="text-primary/10 mb-4" size={40} />
                
                <p className="text-secondary/80 dark:text-slate-300 font-medium leading-relaxed mb-8 italic">
                  "{t.content}"
                </p>
                
                <div className="mt-auto flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <img src={t.image} alt={t.name} className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-100 dark:border-slate-800" />
                  <div>
                    <h4 className="font-bold text-secondary dark:text-white flex items-center gap-2">
                      {t.name} <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Brand Stats */}
        <div className="mt-10 md:mt-12 flex flex-wrap justify-center gap-6 md:gap-12 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 dark:hover:opacity-80 transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-secondary dark:text-white">4.8/5</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Google Rating</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-secondary dark:text-white">1M+</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">App Downloads</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-secondary dark:text-white">10K+</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily Applications</span>
          </div>
        </div>
      </div>
    </section>
  )
}
