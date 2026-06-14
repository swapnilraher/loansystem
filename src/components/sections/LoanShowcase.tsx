"use client"

import React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, ArrowRight, Wallet, Home, Building, Briefcase, Award } from "lucide-react"

const showcaseData = [
  {
    id: "personal-loan",
    title: "Personal Loan",
    benefits: [
      "Loan amounts up to ₹40 Lakhs with flexible repayment options",
      "Competitive interest rates starting from 10.99% per annum",
      "Fast disbursal within 24 hours of document verification"
    ],
    theme: "from-emerald-500 to-green-700",
    icon: Wallet,
    tagline: "Get your instant Personal loan here",
    subtagline: "Giving people hope amidst trying times",
    footerText: "100% Paperless | No Hidden Charges | Low Rate",
    route: "/personal-loan",
    tilt: "-rotate-3"
  },
  {
    id: "home-loan",
    title: "Home Loan",
    benefits: [
      "Up to ₹5 Crore Loan Amount for your dream home",
      "Low Interest Rates Starting at 8.50% p.a.",
      "Quick Approval in 48 Hours*"
    ],
    theme: "from-amber-100 to-amber-300",
    icon: Home,
    tagline: "Get closer to your dream home with Home Loan",
    subtagline: "INTEREST RATES AT VERY LOW %",
    footerText: "T&C apply",
    route: "/home-loan",
    tilt: "rotate-3",
    textColor: "text-amber-950"
  },
  {
    id: "loan-against-property",
    title: "Loan Against Property / Mortgage Loan",
    benefits: [
      "Unlock up to ₹10 Crore against your residential or commercial property",
      "Attractive interest rates starting from 9.50% p.a.",
      "Long repayment tenure up to 15 Years"
    ],
    theme: "from-rose-500 to-red-700",
    icon: Building,
    tagline: "Unlock the hidden value of your Property",
    subtagline: "Max Funding with Minimum Hassle",
    footerText: "Quick Processing | High LTV | Transparent",
    route: "/loan-against-property",
    tilt: "-rotate-3"
  },
  {
    id: "business-loan",
    title: "Business Loan",
    benefits: [
      "Collateral-free loans up to ₹75 Lakhs to scale your business",
      "Affordable rates starting from 15.00% p.a.",
      "Flexible repayment up to 5 Years"
    ],
    theme: "from-blue-600 to-indigo-800",
    icon: Briefcase,
    tagline: "Scale your business to new heights",
    subtagline: "Fuel Your Ambition Today",
    footerText: "No Collateral | Easy EMI | Minimal Docs",
    route: "/business-loan",
    tilt: "rotate-3"
  }
]

export function LoanShowcase() {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="space-y-24 md:space-y-32">
          {showcaseData.map((item, index) => {
            const isEven = index % 2 === 0
            
            return (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                
                {/* Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={`space-y-6 ${!isEven ? 'md:order-last' : ''}`}
                >
                  <h2 className="text-3xl md:text-4xl font-black text-secondary dark:text-white">
                    {item.title}
                  </h2>
                  
                  <div className="space-y-4 pt-2">
                    {item.benefits.map((benefit, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-secondary dark:text-white shrink-0 mt-0.5" />
                        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                          {/* Bold specific numbers/keywords for visual hierarchy */}
                          {benefit.split(/(₹\d+ (?:Lakhs|Crore)|\d+\.\d+%|\d+ (?:hours|Hours|Years))/).map((part, idx) => 
                            /(₹\d+ (?:Lakhs|Crore)|\d+\.\d+%|\d+ (?:hours|Hours|Years))/.test(part) 
                              ? <strong key={idx} className="font-black text-secondary dark:text-white">{part}</strong>
                              : part
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <a href={item.route} className="btn btn-primary bg-emerald-400 hover:bg-emerald-500 text-white border-0 rounded-full px-6 py-2.5 font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5">
                      Apply Now <ArrowRight size={16} />
                    </a>
                    <a href={item.route} className="btn btn-outline-secondary rounded-full px-6 py-2.5 font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                      Explore More <ArrowRight size={16} />
                    </a>
                  </div>
                </motion.div>

                {/* Graphic Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7 }}
                  className="relative flex justify-center perspective-1000"
                >
                  {/* Decorative Dots Background */}
                  <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 2px, transparent 2px)', backgroundSize: '20px 20px', transform: 'scale(1.5) rotate(15deg)' }} />

                  {/* The actual Card */}
                  <div className={`w-full max-w-sm aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br ${item.theme} ${item.tilt} hover:rotate-0 transition-all duration-500 shadow-2xl p-8 flex flex-col justify-between relative overflow-hidden group border border-white/20`}>
                    
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-white opacity-[0.05] pointer-events-none" />
                    
                    {/* Header with Logo */}
                    <div className="relative z-10 flex items-center mb-3 gap-2">
                      <img src="/img/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/20" />
                      <span className={`font-black tracking-widest text-sm uppercase ${item.textColor || 'text-white'}`}>Techstar</span>
                    </div>

                    {/* Middle Content */}
                    <div className="relative z-10 space-y-4">
                      <h3 className={`text-3xl md:text-4xl font-black leading-tight ${item.textColor || 'text-white'}`}>
                        {item.tagline.split(item.title)[0]}
                        <span className="text-yellow-300 block">{item.title}</span>
                        {item.tagline.split(item.title)[1]}
                      </h3>
                      <p className={`text-xs font-semibold opacity-90 ${item.textColor || 'text-white/80'}`}>
                        {item.subtagline}
                      </p>
                      
                      <button className="mt-4 bg-black text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-lg border border-white/10">
                        Apply Now
                      </button>
                    </div>

                    {/* Background Huge Icon */}
                    <item.icon className={`absolute -bottom-10 -right-10 w-64 h-64 opacity-[0.15] group-hover:scale-110 transition-transform duration-700 ${item.textColor || 'text-white'}`} />

                    {/* Footer Strip */}
                    <div className="absolute bottom-0 left-0 w-full bg-black text-white text-[9px] font-black tracking-widest text-center py-2.5 uppercase">
                      {item.footerText}
                    </div>
                  </div>
                </motion.div>
                
              </div>
            )
          })}
        </div>
        
      </div>
    </section>
  )
}
