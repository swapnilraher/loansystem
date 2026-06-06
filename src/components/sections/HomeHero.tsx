"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Star, ArrowRight, ArrowLeft, Building, MapPin, Users, Banknote, Home, User, Car, CreditCard, Flame, CheckCircle2, PhoneCall } from "lucide-react"
import { PersonalLoanForm } from "./PersonalLoanForm"
import { PremiumCard } from "../ui/PremiumCard"
import { AnimatedCounter } from "../ui/AnimatedCounter"

export function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.97])
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const heroBlur = useTransform(scrollYProgress, [0, 0.5, 1], ["blur(0px)", "blur(1px)", "blur(4px)"])

  // Live approval counter (Fintech social proof widget)
  const [liveApproved, setLiveApproved] = useState(12453000)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveApproved(prev => prev + Math.floor(Math.random() * 45000) + 5000)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Slider states & manual controls
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const heroImages = ["/img/1.png", "/img/2.png", "/img/3.png", "/img/4.png"]

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [isPaused, heroImages.length])

  // Handle Swipe/Manual dragging
  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setIsPaused(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
    setTouchStart(null)
    setTouchEnd(null)
    setIsPaused(false)
  }

  const nextSlide = () => {
    setActiveImageIndex((prev) => (prev + 1) % heroImages.length)
  }

  const prevSlide = () => {
    setActiveImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)
  }

  const stats = [
    { value: 5.8, decimals: 1, suffix: " Lacs+", label: "Customers Annually", icon: Users },
    { value: 150, decimals: 0, suffix: "+", label: "Cities Covered", icon: MapPin },
    { value: 4, decimals: 0, suffix: "+", label: "Branches", icon: Building },
    { value: 61000, decimals: 0, suffix: " Cr+", label: "Disbursed Annually", icon: Banknote },
  ]

  const services = [
    { title: "Home Loan", desc: "Instant approval at lowest interest rates", icon: Home, link: "/home-loan", tag: "Quick Sanction", color: "from-blue-500 to-blue-700", glow: "rgba(59, 130, 246, 0.15)" },
    { title: "Personal Loan", desc: "Paperless process at low rate", icon: User, link: "/personal-loan", tag: "Quick Disbursal", color: "from-emerald-500 to-teal-700", glow: "rgba(16, 185, 129, 0.15)" },
    { title: "New Car Loan", desc: "Drive away your dream car today", icon: Car, link: "/car-loan", tag: "Lowest EMI Ride", color: "from-orange-500 to-red-650", glow: "rgba(239, 68, 68, 0.15)" },
    { title: "Credit Card", desc: "Choose cards from all top banks", icon: CreditCard, link: "/credit-card", tag: "Rewards Unlimited", color: "from-purple-500 to-indigo-700", glow: "rgba(99, 102, 241, 0.15)" },
  ]

  return (
    <div ref={containerRef} className="relative overflow-visible z-10">
      
      {/* Animated Aurora Mesh Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[55vw] h-[55vw] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none animate-blob [animation-delay:2s]" />
      </div>

      <motion.section 
        style={{
          scale: heroScale,
          opacity: heroOpacity,
          y: heroY,
          filter: heroBlur
        }}
        className="relative pt-24 pb-16 transition-colors duration-300 z-10"
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Content Column */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                <Star size={14} fill="currentColor" className="text-emerald-500" />
                <span>India's Premium Fintech Loan Marketplace</span>
              </div>

              {/* H1 Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-secondary dark:text-white leading-[1.15] tracking-tight">
                Compare & Apply for <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 drop-shadow-sm">
                  Loans & Credit Cards
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                Experience seamless access to top-tier personal loans, business loans, and credit cards with our 100% digital, paperless process and instant approvals.
              </p>

              {/* Benefits List */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-secondary dark:text-white tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-500" /> 50+ Top Bank Partners
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-2 text-xs font-black uppercase text-secondary dark:text-white tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-500" /> 100% Digital Process
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-2 text-xs font-black uppercase text-secondary dark:text-white tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Instant Sanctions
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
                <a 
                  href="#check-eligibility" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  Check Eligibility <ArrowRight size={16} className="ml-2" />
                </a>
                <a 
                  href="tel:+919579005645" 
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500 text-slate-750 dark:text-slate-300 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-slate-100/30 transition-all"
                >
                  <PhoneCall className="mr-2" size={16} /> 9579005645
                </a>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto lg:mx-0 border-t border-slate-200/60 dark:border-slate-800/30 text-left">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1 group">
                    <p className="text-2xl font-black text-secondary dark:text-white tracking-tight group-hover:text-primary transition-colors">
                      <AnimatedCounter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                    </p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: 1080x1350 Aspect Ratio slidable poster (visible right at the front) */}
            <div className="w-full max-w-[420px] lg:max-w-[480px] aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-950 relative group select-none shrink-0 z-20">
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent z-10 pointer-events-none" />
              
              {/* Slider Viewport */}
              <div 
                className="flex h-full w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {heroImages.map((src, index) => (
                  <div key={src} className="w-full h-full shrink-0 relative flex items-center justify-center bg-slate-50 dark:bg-slate-900/40">
                    <img
                      src={src}
                      alt={`Financial Poster ${index + 1}`}
                      className="w-full h-full object-contain"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>

              {/* Manual Left/Right Navigation Arrows */}
              <button 
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 dark:bg-slate-900/85 text-secondary dark:text-white flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all z-20 opacity-0 group-hover:opacity-100"
                aria-label="Previous Slide"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 dark:bg-slate-900/85 text-secondary dark:text-white flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all z-20 opacity-0 group-hover:opacity-100"
                aria-label="Next Slide"
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>

              {/* Slider Dot Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20 bg-slate-950/40 backdrop-blur-md px-4 py-2 rounded-full">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeImageIndex === index ? "w-6 bg-primary" : "w-2 bg-white/60 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* Interactive Form Card (below the main hero fold) */}
      <div id="check-eligibility" className="container mx-auto px-4 lg:px-8 max-w-7xl pb-20 pt-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[2.5rem] p-6 lg:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800/30">
                <Flame size={12} fill="currentColor" className="text-amber-500 animate-pulse" />
                <span>₹{liveApproved.toLocaleString("en-IN")} Approved Today</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-secondary dark:text-white leading-tight tracking-tight">
                Check Your Personal Loan Eligibility
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
                Get instant, customized quotes from 50+ top-tier banking and lending partners with no impact on your credit score.
              </p>
            </div>
            
            <div className="w-full lg:w-auto shrink-0 flex justify-center z-20">
              <PersonalLoanForm />
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping Service Cards */}
      <div className="relative z-30 mb-[-6rem] px-4 w-full flex justify-center overflow-x-auto no-scrollbar snap-x snap-mandatory lg:overflow-visible">
        <div className="flex gap-4 pb-6 px-4 w-full max-w-7xl snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-6 lg:px-0 lg:pb-0">
          {services.map((service, i) => (
            <a 
              key={i} 
              href={service.link}
              className="block shrink-0 w-[280px] snap-center lg:w-auto lg:shrink"
            >
              <PremiumCard 
                className="p-6 shadow-xl hover:shadow-2xl flex flex-col min-h-[220px] h-full cursor-pointer group"
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
      
    </div>
  )
}
