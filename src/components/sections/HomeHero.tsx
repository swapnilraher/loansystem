"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Star, ArrowRight, Building, MapPin, Users, Banknote, Home, User, Car, CreditCard, Flame } from "lucide-react"
import { PersonalLoanForm } from "./PersonalLoanForm"
import { PremiumCard } from "../ui/PremiumCard"
import { AnimatedCounter } from "../ui/AnimatedCounter"

export function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96])
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroBlur = useTransform(scrollYProgress, [0, 0.5, 1], ["blur(0px)", "blur(2px)", "blur(6px)"])

  // Live approval counter (Fintech social proof widget)
  const [liveApproved, setLiveApproved] = useState(12453000)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveApproved(prev => prev + Math.floor(Math.random() * 45000) + 5000)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { value: 5.8, decimals: 1, suffix: " Lacs+", label: "Customers Annually", icon: Users },
    { value: 150, decimals: 0, suffix: "+", label: "Cities Covered", icon: MapPin },
    { value: 4, decimals: 0, suffix: "+", label: "Branches", icon: Building },
    { value: 61000, decimals: 0, suffix: " Cr+", label: "Disbursed Annually", icon: Banknote },
  ]

  const services = [
    { title: "Home Loan", desc: "Instant approval at lowest interest rates", icon: Home, link: "/home-loan", tag: "Quick Sanction", color: "from-blue-500 to-blue-700", glow: "rgba(59, 130, 246, 0.15)" },
    { title: "Personal Loan", desc: "Paperless process at low rate", icon: User, link: "/personal-loan", tag: "Quick Disbursal", color: "from-green-500 to-emerald-700", glow: "rgba(16, 185, 129, 0.15)" },
    { title: "New Car Loan", desc: "Drive away your dream car today.", icon: Car, link: "/car-loan", tag: "Lowest EMI Ride", color: "from-orange-500 to-red-600", glow: "rgba(239, 68, 68, 0.15)" },
    { title: "Credit Card", desc: "Choose cards from all top banks", icon: CreditCard, link: "/credit-card", tag: "Rewards Unlimited", color: "from-purple-500 to-indigo-700", glow: "rgba(99, 102, 241, 0.15)" },
  ]

  return (
    <div ref={containerRef} className="relative overflow-visible z-10">
      
      {/* Animated Aurora Mesh Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-blue-600/15 blur-[100px] animate-blob" />
        <div className="absolute top-[15%] right-[-5%] w-[55vw] h-[55vw] rounded-full bg-orange-500/10 blur-[130px] animate-blob [animation-delay:2s]" />
        <div className="absolute bottom-[-5%] left-[15%] w-[40vw] h-[40vw] rounded-full bg-blue-400/15 blur-[110px] animate-blob [animation-delay:4s]" />
      </div>

      <motion.section 
        style={{
          scale: heroScale,
          opacity: heroOpacity,
          y: heroY,
          filter: heroBlur
        }}
        className="relative pt-32 pb-48 lg:pb-32 bg-slate-50/20 dark:bg-slate-950/10 transition-colors duration-300 z-10"
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 space-y-6 text-left">
              
              {/* Badge & Live Ticker */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-full text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-blue-800/30 shadow-sm">
                  <Star size={14} fill="currentColor" /> India's Premium Financial Hub
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800/30">
                  <Flame size={12} fill="currentColor" className="text-amber-500 animate-pulse" />
                  <span>₹{liveApproved.toLocaleString("en-IN")} Approved Today</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-secondary leading-[1.1] tracking-tight">
                Empowering Your <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-orange-500 drop-shadow-sm">Financial Future</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl font-medium">
                Experience seamless access to top-tier loans, smart credit cards, and expert guidance—all designed to help you achieve your goals faster with a 100% paperless process.
              </p>

              {/* Stats Grid with Animated Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 mt-6 border-t border-slate-150/60 text-left">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-emerald-100/50">
                      <stat.icon size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl lg:text-2xl font-black text-secondary leading-none mb-1 tracking-tight">
                        <AnimatedCounter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full flex justify-center lg:justify-end z-20">
              <PersonalLoanForm />
            </div>
          </div>
        </div>

        {/* Overlapping Service Cards */}
        <div className="relative z-30 mt-16 lg:mt-24 mb-[-8rem] px-4 w-full flex justify-center overflow-x-auto no-scrollbar snap-x snap-mandatory lg:overflow-visible">
          <div className="flex gap-4 pb-6 px-4 w-full max-w-7xl snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-6 lg:px-0 lg:pb-0">
            {services.map((service, i) => (
              <a 
                key={i} 
                href={service.link}
                className="block shrink-0 w-[280px] snap-center lg:w-auto lg:shrink"
              >
                <PremiumCard 
                  className="p-6 shadow-xl hover:shadow-2xl flex flex-col min-h-[220px] h-full cursor-pointer"
                  glowColor={service.glow}
                >
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r ${service.color} text-white text-[10px] font-black uppercase tracking-widest`}>
                    {service.tag}
                  </div>
                  
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon size={28} />
                  </div>
                  
                  <h3 className="text-xl font-black text-secondary dark:text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 flex-grow">{service.desc}</p>
                  
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mt-auto">
                    Apply Now <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </PremiumCard>
              </a>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  )
}
