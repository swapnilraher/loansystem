"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Star, ArrowRight, ArrowLeft, Building, MapPin, Users, Banknote, Home, User, Car, CreditCard, Flame, CheckCircle2, PhoneCall, Lock } from "lucide-react"
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

  // Single static banner image configuration
  const bannerImage = "/img/homepagebanner.png"

  const stats = [
    { value: 5000, decimals: 0, suffix: "+", label: "Customers", icon: Users },
    { value: 150, decimals: 0, suffix: "+", label: "Cities Covered", icon: MapPin },
    { value: 4, decimals: 0, suffix: "+", label: "Branches", icon: Building },
    { value: 500, decimals: 0, suffix: " Cr+", label: "Disbursed Annually", icon: Banknote },
  ]

  const services = [
    { title: "Home Loan", desc: "Instant approval at lowest interest rates", icon: Home, link: "/home-loan", tag: "Quick Sanction", color: "from-blue-500 to-blue-700", glow: "rgba(59, 130, 246, 0.15)" },
    { title: "Personal Loan", desc: "Paperless process at low rate", icon: User, link: "/personal-loan", tag: "Quick Disbursal", color: "from-emerald-500 to-teal-700", glow: "rgba(16, 185, 129, 0.15)" },
    { title: "New Car Loan", desc: "Drive away your dream car today", icon: Car, link: "/car-loan", tag: "Lowest EMI Ride", color: "from-orange-500 to-red-650", glow: "rgba(239, 68, 68, 0.15)" },
    { title: "Credit Card", desc: "Choose cards from all top banks", icon: CreditCard, link: "/credit-card", tag: "Rewards Unlimited", color: "from-purple-500 to-indigo-700", glow: "rgba(99, 102, 241, 0.15)" },
  ]

  // Lead capture states for the hero tabbed form
  const [activeTab, setActiveTab] = useState("personal")
  const [leadAmount, setLeadAmount] = useState("")
  const [leadMobile, setLeadMobile] = useState("")
  const [leadName, setLeadName] = useState("")
  const [leadCity, setLeadCity] = useState("")
  const [leadIncome, setLeadIncome] = useState("")
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)
  const [leadSuccess, setLeadSuccess] = useState(false)

  const handleHeroLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName || !leadMobile || !leadAmount) {
      alert("Please fill in Name, Mobile, and Loan Amount.")
      return
    }
    try {
      setIsLeadSubmitting(true)
      const data = {
        fullName: leadName,
        mobileNumber: leadMobile,
        loanAmount: leadAmount,
        monthlyIncome: leadIncome || "30000",
        employmentType: "Salaried",
        city: leadCity,
        source: `Hero Quick Apply - ${activeTab.toUpperCase()}`,
      }
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }
      
      setLeadSuccess(true)
    } catch (err: any) {
      console.error(err)
      alert("Something went wrong. Please try again.")
    } finally {
      setIsLeadSubmitting(false)
    }
  }

  return (
    <div ref={containerRef} className="position-relative overflow-hidden pt-5 mt-4 z-10">
      
      {/* Mesh Background */}
      <div className="position-absolute w-100 h-100 top-0 start-0 overflow-hidden pointer-events-none z-0">
        <div className="position-absolute top-0 start-0 w-[45vw] h-[45vw] rounded-circle bg-emerald-500/10 blur-[120px] animate-blob" />
        <div className="position-absolute top-50 end-0 w-[45vw] h-[45vw] rounded-circle bg-paytm-blue/10 blur-[130px] animate-blob [animation-delay:2s]" />
      </div>

      <motion.section 
        style={{
          scale: heroScale,
          opacity: heroOpacity,
          y: heroY,
          filter: heroBlur
        }}
        className="container py-5 position-relative z-10"
      >
        <div className="row g-5 align-items-center align-items-lg-stretch">
          
          {/* Left Column - Content */}
          <div className="col-lg-6 col-12 text-lg-start text-center space-y-6 d-flex flex-column justify-content-center">
            
            {/* Top Badge */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 bg-light dark:bg-slate-800 rounded-pill border border-slate-200 dark:border-slate-700 shadow-sm align-self-lg-start align-self-center">
              <Star size={14} fill="currentColor" className="text-warning animate-pulse" />
              <span className="text-xs uppercase font-black tracking-wider text-paytm-navy dark:text-slate-300">India's Premium Fintech Marketplace</span>
            </div>

            {/* Title */}
            <h1 className="display-4 font-black tracking-tight text-paytm-navy dark:text-white mb-3 leading-tight">
              Compare & Apply for <br className="d-none d-lg-block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600">
                Personal, Home & Business Loans
              </span>
            </h1>

            {/* Subtitle */}
            <p className="lead text-slate-500 dark:text-slate-400 max-w-xl mx-auto mx-lg-0 mb-4">
              Get lowest interest rates with 100% digital, paperless processing and instant approvals from 50+ banking partners.
            </p>

            {/* Checkmarks */}
            <div className="d-flex flex-wrap justify-content-lg-start justify-content-center gap-3 pt-3">
              {["50+ Banking Partners", "100% Digital Process", "Zero Paperwork"].map((chk, idx) => (
                <div key={idx} className="text-[11px] font-black text-uppercase text-slate-600 dark:text-slate-300 tracking-wider d-flex align-items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-success" />
                  {chk}
                </div>
              ))}
            </div>

          </div>

          {/* Right Column - Single Banner Visual (Very Large) */}
          <div className="col-lg-6 col-12 d-flex justify-content-center align-items-center position-relative">
            <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative z-20">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                src={bannerImage}
                alt="Fintech Banner"
                className="w-100 h-auto object-fit-contain max-h-[500px] lg:max-h-[600px] mix-blend-multiply dark:invert dark:mix-blend-screen"
                draggable="false"
              />
            </div>
          </div>

        </div>

        {/* Row 2 - Horizontal Eligibility Form */}
        <div className="row mt-5 pt-4 position-relative z-20">
          <div className="col-12 max-w-5xl mx-auto">
            <div className="card border-0 shadow-xl rounded-[3rem] p-4 p-md-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-start position-relative overflow-hidden" style={{ boxShadow: '0 25px 50px rgba(0, 41, 112, 0.1)' }}>
              <div className="position-absolute top-0 start-0 w-100 h-2 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-600" />
              
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h3 className="fs-5 font-black text-paytm-navy dark:text-white m-0">Check Eligibility</h3>
                  <p className="text-[10px] text-uppercase font-black text-slate-400 m-0 tracking-widest mt-1">Get instant approval rates</p>
                </div>
                
                {/* Tabs removed as per user request */}

                <span className="badge bg-success/10 text-success text-[10px] px-3 py-2 rounded-pill border border-success/20 d-flex align-items-center gap-1.5 font-bold">
                  <Lock size={12} /> 100% Secure Verification
                </span>
              </div>

              {!leadSuccess ? (
                <form onSubmit={handleHeroLeadSubmit} className="row g-3 align-items-end mt-2">
                  <div className="col-lg-2 col-md-4 col-12">
                    <label className="text-[10px] text-uppercase font-black text-slate-400 mb-2 d-block ms-3 tracking-wider">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter Your Name" 
                      className="form-control rounded-pill py-3 px-4 text-xs shadow-sm"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-lg-2 col-md-4 col-12">
                    <label className="text-[10px] text-uppercase font-black text-slate-400 mb-2 d-block ms-3 tracking-wider">Mobile Number</label>
                    <input 
                      type="tel" 
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit mobile number"
                      placeholder="10-digit number" 
                      className="form-control rounded-pill py-3 px-4 text-xs shadow-sm"
                      value={leadMobile}
                      onChange={(e) => setLeadMobile(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <div className="col-lg-2 col-md-4 col-12">
                    <label className="text-[10px] text-uppercase font-black text-slate-400 mb-2 d-block ms-3 tracking-wider">Loan Type</label>
                    <select 
                      className="form-select rounded-pill py-3 px-4 text-xs shadow-sm"
                      value={activeTab}
                      onChange={(e) => { setActiveTab(e.target.value); setLeadSuccess(false); }}
                    >
                      <option value="personal">Personal Loan</option>
                      <option value="home">Home Loan</option>
                      <option value="business">Business Loan</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="lap">Loan Against Property</option>
                      <option value="education">Education Loan</option>
                      <option value="car">Car Loan</option>
                      <option value="gold">Gold Loan</option>
                    </select>
                  </div>

                  <div className="col-lg-2 col-md-4 col-12">
                    <label className="text-[10px] text-uppercase font-black text-slate-400 mb-2 d-block ms-3 tracking-wider">Amount (₹)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Required amount" 
                      className="form-control rounded-pill py-3 px-4 text-xs shadow-sm"
                      value={leadAmount}
                      onChange={(e) => setLeadAmount(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <div className="col-lg-2 col-md-4 col-12">
                    <label className="text-[10px] text-uppercase font-black text-slate-400 mb-2 d-block ms-3 tracking-wider">City Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter City Name" 
                      className="form-control rounded-pill py-3 px-4 text-xs shadow-sm"
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-lg-2 col-md-4 col-12">
                    <button 
                      type="submit" 
                      disabled={isLeadSubmitting}
                      className="w-100 btn btn-paytm rounded-pill py-3 text-[11px] text-uppercase font-black tracking-wider shadow-lg d-flex align-items-center justify-content-center gap-1 hover:-translate-y-1 transition-transform"
                    >
                      {isLeadSubmitting ? "Wait..." : `Get Offers`}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-success/10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2">
                    <CheckCircle2 size={24} />
                  </div>
                  <h5 className="font-black text-paytm-navy dark:text-white m-0">Offers Sent Successfully!</h5>
                  <p className="text-xs text-slate-500 m-0 leading-relaxed">
                    Our loan advisor will contact you within 15 minutes with verified quotes.
                  </p>
                  <button onClick={() => setLeadSuccess(false)} className="btn btn-outline-secondary btn-sm py-1.5 px-4 rounded-full text-xs mt-3">
                    Submit Another Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - Bootstrap Columns */}
        <div className="row g-4 pt-5 mt-5 border-top border-slate-200/50 dark:border-slate-800/30 text-start">
          {stats.map((stat, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="space-y-1">
                <p className="fs-3 font-black text-paytm-navy dark:text-white tracking-tight m-0">
                  <AnimatedCounter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1 m-0">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

      </motion.section>

      {/* Services Grid (Premium layout style) */}
      <section className="container py-5 mt-4">
        <div className="row g-4 justify-content-center">
          {services.map((service, i) => (
            <div key={i} className="col-lg-3 col-md-6 col-12">
              <a href={service.link} className="text-decoration-none d-block h-100">
                <div className="product-premium-card p-4 d-flex flex-column h-100 position-relative overflow-hidden">
                  <div className={`position-absolute top-0 end-0 px-3 py-1 rounded-bl-2xl bg-gradient-to-r ${service.color} text-white text-[9px] font-black uppercase tracking-widest`}>
                    {service.tag}
                  </div>
                  
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${service.color} d-flex align-items-center justify-content-center text-white mb-4 shadow-md`}>
                    <service.icon size={24} />
                  </div>
                  
                  <h4 className="fs-5 font-black text-paytm-navy dark:text-white mb-2">{service.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold mb-4 flex-grow">{service.desc}</p>
                  
                  <div className="d-flex align-items-center gap-1 text-paytm-blue font-black uppercase tracking-widest text-[10px] mt-auto group-hover:text-paytm-navy transition-colors">
                    Apply Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
