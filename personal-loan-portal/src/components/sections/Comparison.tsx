"use client"
import React, { useState } from "react"
import { motion } from "framer-motion"
import { Star, ShieldAlert, Zap, Clock, FileCheck, ArrowRight, ShieldCheck } from "lucide-react"
import { PremiumCard } from "../ui/PremiumCard"
import { Button } from "../ui/Button"

// Premium comparison data matching the 6 top lenders
const comparisonData = {
  personal: [
    { bank: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com", rate: "10.50% - 14.50%", fee: "0.5% - 2.0%", speed: "4 Hours", docs: "Minimal", disbursal: "24 Hours" },
    { bank: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com", rate: "10.75% - 16.00%", fee: "Up to 2.25%", speed: "2 Hours", docs: "Minimal", disbursal: "Same Day" },
    { bank: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com", rate: "10.49% - 15.99%", fee: "1.0% - 2.0%", speed: "24 Hours", docs: "Standard", disbursal: "48 Hours" },
    { bank: "SBI", logo: "https://logo.clearbit.com/sbi.co.in", rate: "11.00% - 13.50%", fee: "Up to 1.5%", speed: "3 Days", docs: "Standard", disbursal: "4 Days" },
    { bank: "Tata Capital", logo: "https://logo.clearbit.com/tatacapital.com", rate: "10.99% - 18.00%", fee: "0.99% - 2.5%", speed: "12 Hours", docs: "Minimal", disbursal: "24 Hours" },
    { bank: "Bajaj Finance", logo: "https://logo.clearbit.com/bajajfinserv.in", rate: "11.49% - 19.00%", fee: "1.0% - 3.0%", speed: "Instant", docs: "Minimal", disbursal: "Same Day" }
  ],
  home: [
    { bank: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com", rate: "8.50% - 9.15%", fee: "0.5% or ₹3,000", speed: "4 Days", docs: "Standard", disbursal: "5 Days" },
    { bank: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com", rate: "8.65% - 9.35%", fee: "Up to 0.5%", speed: "3 Days", docs: "Standard", disbursal: "4 Days" },
    { bank: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com", rate: "8.60% - 9.25%", fee: "Up to ₹10,000", speed: "4 Days", docs: "Detailed", disbursal: "6 Days" },
    { bank: "SBI", logo: "https://logo.clearbit.com/sbi.co.in", rate: "8.50% - 9.05%", fee: "Nil - 0.35%", speed: "6 Days", docs: "Detailed", disbursal: "7 Days" },
    { bank: "Tata Capital", logo: "https://logo.clearbit.com/tatacapital.com", rate: "8.75% - 9.95%", fee: "Up to 0.5%", speed: "5 Days", docs: "Standard", disbursal: "5 Days" },
    { bank: "Bajaj Finance", logo: "https://logo.clearbit.com/bajajfinserv.in", rate: "8.85% - 10.25%", fee: "Up to 1.0%", speed: "3 Days", docs: "Minimal", disbursal: "4 Days" }
  ],
  business: [
    { bank: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com", rate: "15.00% - 19.00%", fee: "Up to 2.5%", speed: "48 Hours", docs: "Standard", disbursal: "3 Days" },
    { bank: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com", rate: "14.50% - 18.50%", fee: "Up to 2.0%", speed: "24 Hours", docs: "Minimal", disbursal: "24 Hours" },
    { bank: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com", rate: "15.25% - 20.00%", fee: "1.5% - 2.5%", speed: "3 Days", docs: "Standard", disbursal: "4 Days" },
    { bank: "SBI", logo: "https://logo.clearbit.com/sbi.co.in", rate: "11.20% - 14.50%", fee: "Up to 1.5%", speed: "5 Days", docs: "Detailed", disbursal: "6 Days" },
    { bank: "Tata Capital", logo: "https://logo.clearbit.com/tatacapital.com", rate: "13.99% - 22.00%", fee: "Up to 2.0%", speed: "24 Hours", docs: "Minimal", disbursal: "24 Hours" },
    { bank: "Bajaj Finance", logo: "https://logo.clearbit.com/bajajfinserv.in", rate: "14.00% - 24.00%", fee: "Up to 3.0%", speed: "12 Hours", docs: "Minimal", disbursal: "24 Hours" }
  ]
}

export function Comparison() {
  const [activeTab, setActiveTab] = useState<keyof typeof comparisonData>("personal")

  return (
    <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 transition-colors duration-300 relative" id="compare">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">Lender Rates</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
            Compare Top Lending Partners
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Review live interest rates, processing fees, and document requirements across India's premium banks.
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex justify-center gap-4 mb-12">
          {(Object.keys(comparisonData) as Array<keyof typeof comparisonData>).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all border ${
                activeTab === tab
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-150/60 dark:border-slate-800 text-slate-500 hover:border-slate-350"
              }`}
            >
              {tab} Loan
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {comparisonData[activeTab].map((lender, i) => (
            <PremiumCard 
              key={i} 
              className="p-6 md:p-8 flex flex-col min-h-[360px] border-slate-150/40 dark:border-slate-850 cursor-pointer"
              glowColor="rgba(37, 99, 235, 0.06)"
            >
              {/* Header inside Card */}
              <div className="flex justify-between items-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center p-2 shrink-0">
                    <img 
                      src={lender.logo} 
                      alt={lender.bank} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-secondary dark:text-white leading-tight">{lender.bank}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Approved DSA Partner</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} /> Live
                  </span>
                </div>
              </div>

              {/* Grid details inside Card */}
              <div className="space-y-4 flex-grow mb-6">
                {/* Interest Rate */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Interest Rate</span>
                  <span className="font-black text-primary text-base">{lender.rate} p.a.</span>
                </div>

                {/* Processing Fee */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Processing Fee</span>
                  <span className="font-extrabold text-secondary dark:text-white">{lender.fee}</span>
                </div>

                {/* Approval Speed */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" /> Approval Speed
                  </span>
                  <span className="font-extrabold text-secondary dark:text-white">{lender.speed}</span>
                </div>

                {/* Documentation level */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <FileCheck size={14} className="text-blue-500" /> Documentation
                  </span>
                  <span className="font-extrabold text-secondary dark:text-white">{lender.docs}</span>
                </div>

                {/* Disbursal Timeline */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-purple-500" /> Disbursal Time
                  </span>
                  <span className="font-extrabold text-secondary dark:text-white">{lender.disbursal}</span>
                </div>
              </div>

              {/* Action Button inside Card */}
              <a
                href="/personal-loan"
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] gap-2 border border-slate-100 dark:border-slate-800 hover:border-primary hover:text-primary transition-all active:scale-[0.98] mt-auto cursor-pointer"
              >
                Apply via TechStar <ArrowRight size={14} />
              </a>
            </PremiumCard>
          ))}
        </div>

      </div>
    </section>
  )
}
