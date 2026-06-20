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
  const bannerImage = "/img/homepagebanner.webp"

  const stats = [
    { value: 5000, decimals: 0, suffix: "+", label: "Customers", icon: Users },
    { value: 150, decimals: 0, suffix: "+", label: "Cities Covered", icon: MapPin },
    { value: 4, decimals: 0, suffix: "+", label: "Branches", icon: Building },
    { value: 500, decimals: 0, suffix: " Cr+", label: "Disbursed Annually", icon: Banknote },
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
        source: "website Lead form",
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
        className="container-xl py-5 position-relative z-10 mt-md-4"
      >
        <div className="row g-5 align-items-center">
          
          {/* Left Column - Content */}
          <div className="col-lg-6 col-12 text-lg-start text-center space-y-6 d-flex flex-column justify-content-center">
            
            {/* Top Badge */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 bg-light dark:bg-slate-800 rounded-pill border border-slate-200 dark:border-slate-700 shadow-sm align-self-lg-start align-self-center">
              <Star size={14} fill="currentColor" className="text-warning animate-pulse" />
              <span className="text-xs uppercase font-black tracking-wider text-paytm-navy dark:text-slate-300">India's Premium Fintech Marketplace</span>
            </div>

            {/* Title */}
            <h1 className="display-3 font-black tracking-tight text-paytm-navy dark:text-white mb-3 leading-none font-outfit">
              💰 One Stop <br className="d-none d-lg-block" />
              <span className="text-gradient-premium font-playfair italic font-normal px-2">
                Loan Solution
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mx-lg-0 mb-4 fs-6 fw-medium leading-relaxed">
              Based on your credit profile and income, we assist you in obtaining a loan from the most suitable banks and NBFCs in the market.
            </p>

            {/* Subtitle & Features */}
            <div className="mb-4 d-flex flex-column gap-4 max-w-xl mx-auto mx-lg-0">
              <h3 className="fs-5 font-black text-paytm-navy dark:text-white m-0 d-flex align-items-center justify-content-center justify-content-lg-start gap-2">
                <span className="text-emerald-500"><CheckCircle2 size={22} /></span> Loan Solutions Made Easy
              </h3>
              
              {/* Premium 2x2 Grid for Loans */}
              <div className="row g-3">
                <div className="col-sm-6 col-12">
                  <div className="d-flex align-items-center gap-3 bg-white/80 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer">
                    <div className="bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 text-emerald-600 dark:text-emerald-400 w-12 h-12 rounded-circle d-flex align-items-center justify-content-center shadow-inner group-hover:scale-110 transition-transform">
                      <Home size={22} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 fs-6">Home Loan</span>
                  </div>
                </div>
                <div className="col-sm-6 col-12">
                  <div className="d-flex align-items-center gap-3 bg-white/80 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 w-12 h-12 rounded-circle d-flex align-items-center justify-content-center shadow-inner group-hover:scale-110 transition-transform">
                      <Building size={22} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 fs-6">Business Loan</span>
                  </div>
                </div>
                <div className="col-sm-6 col-12">
                  <div className="d-flex align-items-center gap-3 bg-white/80 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer">
                    <div className="bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 w-12 h-12 rounded-circle d-flex align-items-center justify-content-center shadow-inner group-hover:scale-110 transition-transform">
                      <User size={22} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 fs-6">Personal Loan</span>
                  </div>
                </div>
                <div className="col-sm-6 col-12">
                  <div className="d-flex align-items-center gap-3 bg-white/80 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer">
                    <div className="bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/20 text-orange-600 dark:text-orange-400 w-12 h-12 rounded-circle d-flex align-items-center justify-content-center shadow-inner group-hover:scale-110 transition-transform">
                      <Banknote size={22} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 fs-6 leading-tight">Loan Against Property</span>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2 mt-2">
                <div className="badge bg-gradient-to-r from-paytm-navy to-blue-800 text-white border-0 px-3 py-2 rounded-pill font-black d-flex align-items-center gap-1.5 shadow-md tracking-wider text-[11px] hover:-translate-y-0.5 transition-transform cursor-default">
                  <Star size={14} className="text-warning fill-warning" /> Quick Process & Trusted
                </div>
                <div className="badge bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-0 px-3 py-2 rounded-pill font-black d-flex align-items-center gap-1.5 shadow-md tracking-wider text-[11px] hover:-translate-y-0.5 transition-transform cursor-default">
                  <CheckCircle2 size={14} className="text-white" /> Quick Approval & Support
                </div>
                <div className="badge bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-3 py-2 rounded-pill font-black d-flex align-items-center gap-1.5 shadow-md tracking-wider text-[11px] hover:-translate-y-0.5 transition-transform cursor-default">
                  <Flame size={14} className="text-white fill-white" /> Lowest Interest Rates
                </div>
                <div className="badge bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 px-3 py-2 rounded-pill font-black d-flex align-items-center gap-1.5 shadow-md tracking-wider text-[11px] hover:-translate-y-0.5 transition-transform cursor-default">
                  <Lock size={14} className="text-white" /> 100% Digital & Secure
                </div>
              </div>

              <div className="d-flex justify-content-center justify-content-lg-start mt-3 gap-2 gap-sm-3 w-100 max-w-[480px] mx-auto mx-lg-0">
                <a 
                  href="tel:7020646007" 
                  className="flex-1 text-decoration-none group position-relative d-inline-flex align-items-center justify-content-center gap-2 gap-sm-3 bg-paytm-navy dark:bg-slate-800 text-white px-3 py-2.5 sm:px-5 sm:py-3 rounded-pill shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden border border-slate-700/50"
                >
                  <div className="position-absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="position-relative z-10 d-flex align-items-center gap-2 gap-sm-3">
                    <div className="bg-white/20 p-1.5 sm:p-2.5 rounded-circle shadow-inner">
                      <PhoneCall size={18} className="animate-pulse text-white sm:w-[22px] sm:h-[22px]" />
                    </div>
                    <div className="d-flex flex-column text-start">
                      <span className="text-[8px] sm:text-[10px] font-black text-blue-300 text-uppercase tracking-widest mb-0.5 opacity-90 d-none d-sm-block">Call For Instant Approval</span>
                      <span className="font-black text-sm sm:fs-4 tracking-wider leading-none">7020646007</span>
                    </div>
                  </div>
                </a>

                <a 
                  href="https://api.whatsapp.com/send?phone=917020646007&text=Hello,%20I%20am%20interested%20in%20applying%20for%20a%20loan." 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-decoration-none group position-relative d-inline-flex align-items-center justify-content-center gap-2 gap-sm-3 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 sm:px-5 sm:py-3 rounded-pill shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden border border-emerald-500/50"
                >
                  <div className="position-relative z-10 d-flex align-items-center gap-2 gap-sm-3">
                    <div className="bg-white/20 p-1.5 sm:p-2.5 rounded-circle shadow-inner">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="text-white animate-pulse w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]">
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                      </svg>
                    </div>
                    <div className="d-flex flex-column text-start">
                      <span className="text-[8px] sm:text-[10px] font-black text-emerald-200 text-uppercase tracking-widest mb-0.5 opacity-90 d-none d-sm-block">WhatsApp For Quick Chat</span>
                      <span className="font-black text-sm sm:fs-4 tracking-wider leading-none">7020646007</span>
                    </div>
                  </div>
                </a>
              </div>
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
                className="w-100 h-auto object-fit-contain max-h-[600px] lg:max-h-[750px] scale-110 mix-blend-multiply dark:invert dark:mix-blend-screen"
                style={{ filter: 'contrast(1.15) brightness(1.05)' }}
                draggable="false"
              />
            </div>
          </div>

        </div>

        {/* Row 2 - Horizontal Eligibility Form */}
        <div className="row mt-5 pt-4 position-relative z-20">
          <div className="col-12 col-xl-11 mx-auto">
            <div className="card border-0 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-start position-relative overflow-hidden shadow-2xl" style={{ boxShadow: '0 25px 60px rgba(0, 41, 112, 0.08)' }}>
              <div className="position-absolute top-0 start-0 w-100 h-[6px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-600" />
              
              <div className="p-4 p-md-5">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-slate-100 dark:border-slate-800">
                  <div className="d-flex align-items-center gap-3">
                    <div className="w-12 h-12 bg-paytm-blue/10 rounded-2xl d-flex align-items-center justify-content-center text-paytm-blue">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="fs-4 font-black text-paytm-navy dark:text-white m-0 tracking-tight">Check Eligibility</h3>
                      <p className="text-[10px] text-uppercase font-black text-slate-400 m-0 tracking-widest mt-1">Get instant approval rates</p>
                    </div>
                  </div>
                  
                  <span className="badge bg-success/10 text-success px-4 py-2.5 rounded-pill border border-success/20 d-flex align-items-center gap-2 font-black shadow-sm text-xs">
                    <CheckCircle2 size={16} className="animate-pulse" /> 100% Secure Verification
                  </span>
                </div>

                {!leadSuccess ? (
                  <form onSubmit={handleHeroLeadSubmit} className="row g-3 g-md-4 align-items-end mt-2">
                    <div className="col-lg-2 col-md-4 col-12">
                      <label className="text-[11px] text-uppercase font-black text-slate-500 mb-2 d-block ms-1 tracking-wider">Your Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter Full Name" 
                        className="form-control form-control-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-paytm-blue rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition-all"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-lg-2 col-md-4 col-12">
                      <label className="text-[11px] text-uppercase font-black text-slate-500 mb-2 d-block ms-1 tracking-wider">Mobile Number</label>
                      <input 
                        type="tel" 
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title="Please enter a valid 10-digit mobile number"
                        placeholder="10-digit number" 
                        className="form-control form-control-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-paytm-blue rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition-all"
                        value={leadMobile}
                        onChange={(e) => setLeadMobile(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>

                    <div className="col-lg-2 col-md-4 col-12">
                      <label className="text-[11px] text-uppercase font-black text-slate-500 mb-2 d-block ms-1 tracking-wider">Loan Type</label>
                      <select 
                        className="form-select form-select-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-paytm-blue rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition-all"
                        value={activeTab}
                        onChange={(e) => { setActiveTab(e.target.value); setLeadSuccess(false); }}
                      >
                        <option value="personal">Personal Loan</option>
                        <option value="home">Home Loan</option>
                        <option value="business">Business Loan</option>
                        <option value="credit-card">Credit Card</option>
                        <option value="lap">Property Loan</option>
                        <option value="education">Education Loan</option>
                        <option value="car">Car Loan</option>
                        <option value="gold">Gold Loan</option>
                      </select>
                    </div>

                    <div className="col-lg-2 col-md-4 col-12">
                      <label className="text-[11px] text-uppercase font-black text-slate-500 mb-2 d-block ms-1 tracking-wider">Amount (₹)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Required amount" 
                        className="form-control form-control-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-paytm-blue rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition-all"
                        value={leadAmount}
                        onChange={(e) => setLeadAmount(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>

                    <div className="col-lg-2 col-md-4 col-12">
                      <label className="text-[11px] text-uppercase font-black text-slate-500 mb-2 d-block ms-1 tracking-wider">City Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter City Name" 
                        className="form-control form-control-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-paytm-blue rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition-all"
                        value={leadCity}
                        onChange={(e) => setLeadCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-lg-2 col-md-4 col-12">
                      <button 
                        type="submit" 
                        disabled={isLeadSubmitting}
                        className="w-100 btn btn-paytm btn-lg rounded-xl py-3 text-sm text-uppercase font-black tracking-wider shadow-lg d-flex align-items-center justify-content-center gap-2 hover:-translate-y-1 transition-all border-0"
                      >
                        {isLeadSubmitting ? "Wait..." : `Get Offers`}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-5 space-y-3">
                    <div className="w-16 h-16 bg-success/10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm border border-success/20">
                      <CheckCircle2 size={32} />
                    </div>
                    <h5 className="font-black text-paytm-navy dark:text-white m-0 fs-4">Offers Sent Successfully!</h5>
                    <p className="text-sm font-bold text-slate-500 m-0 leading-relaxed max-w-md mx-auto">
                      Our loan advisor will contact you within 15 minutes with verified quotes.
                    </p>
                    <button onClick={() => setLeadSuccess(false)} className="btn btn-outline-secondary py-2 px-5 rounded-pill text-sm mt-4 font-bold">
                      Submit Another Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Bootstrap Columns */}
        <div className="row g-4 pt-5 mt-5 border-top border-slate-200/50 dark:border-slate-800/30 text-start px-xl-4">
          {stats.map((stat, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-3">
                <div className="w-12 h-12 rounded-3xl bg-slate-100 dark:bg-slate-800 d-flex align-items-center justify-content-center text-paytm-blue shadow-sm">
                  <stat.icon size={24} strokeWidth={2} />
                </div>
                <div className="space-y-0.5">
                  <p className="fs-3 font-black text-paytm-navy dark:text-white tracking-tight m-0 leading-none">
                    <AnimatedCounter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none m-0 mt-1">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </motion.section>


    </div>
  )
}
