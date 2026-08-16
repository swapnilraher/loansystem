"use client"

import React from "react"
import { MapPin, ArrowRight, ShieldCheck, Check } from "lucide-react"
import { PremiumCard } from "../ui/PremiumCard"

const locations = [
  {
    city: "Nashik",
    state: "Maharashtra",
    lenders: "50+ Lenders",
    time: "24-hr Disbursal",
    routes: {
      personal: "/personal-loan-nashik",
      business: "/business-loan-nashik",
      home: "/home-loan-nashik",
      dsa: "/dsa-loan-nashik"
    }
  },
  {
    city: "Pune",
    state: "Maharashtra",
    lenders: "75+ Lenders",
    time: "12-hr Disbursal",
    routes: {
      personal: "/personal-loan-pune",
      business: "/business-loan-pune",
      home: "/home-loan-pune",
      dsa: "/dsa-loan-pune"
    }
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    lenders: "100+ Lenders",
    time: "12-hr Disbursal",
    routes: {
      personal: "/personal-loan-mumbai",
      business: "/business-loan-mumbai",
      home: "/home-loan-mumbai",
      dsa: "#"
    }
  },
  {
    city: "Chhatrapati Sambhajianagar",
    alias: "Aurangabad",
    state: "Maharashtra",
    lenders: "45+ Lenders",
    time: "24-hr Disbursal",
    routes: {
      personal: "/personal-loan-chhatrapati-sambhajianagar",
      business: "/business-loan-chhatrapati-sambhajianagar",
      home: "/home-loan-chhatrapati-sambhajianagar",
      dsa: "/dsa-loan-chhatrapati-sambhajianagar"
    }
  },
  {
    city: "Nagpur",
    state: "Maharashtra",
    lenders: "40+ Lenders",
    time: "48-hr Disbursal",
    routes: {
      personal: "/personal-loan",
      business: "/business-loan",
      home: "/home-loan",
      dsa: "/#dsa-partner"
    }
  },
  {
    city: "Thane",
    state: "Maharashtra",
    lenders: "60+ Lenders",
    time: "24-hr Disbursal",
    routes: {
      personal: "/personal-loan",
      business: "/business-loan",
      home: "/home-loan",
      dsa: "/#dsa-partner"
    }
  },
  {
    city: "Kolhapur",
    state: "Maharashtra",
    lenders: "35+ Lenders",
    time: "48-hr Disbursal",
    routes: {
      personal: "/personal-loan",
      business: "/business-loan",
      home: "/home-loan",
      dsa: "/#dsa-partner"
    }
  }
]

export function LocationCoverage() {
  return (
    <section className="py-12 md:py-16 bg-slate-50/50 dark:bg-slate-900/10 transition-colors duration-300 relative">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
            Regional Presence
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
            Major Cities We Serve in <span className="text-primary italic">Maharashtra</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Get instant customized loan matches, fast doorstep document support, and dedicated advisors in your neighborhood.
          </p>
        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {locations.map((loc, idx) => (
            <PremiumCard 
              key={idx} 
              className="border border-slate-150/40 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft hover-lift rounded-3xl"
              glowColor="rgba(16, 185, 129, 0.04)"
            >
              <div className="p-6 flex flex-col justify-between h-full space-y-5 text-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-slate-800 flex items-center justify-center text-primary shrink-0 shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl md:text-3xl text-secondary dark:text-white leading-tight mb-1">
                      {loc.city}
                    </h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {loc.alias ? `${loc.alias}, ${loc.state}` : loc.state}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex justify-center gap-6 py-3 border-t border-b border-slate-100 dark:border-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-500" />
                    <span>{loc.lenders}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary" />
                    <span>{loc.time}</span>
                  </div>
                </div>

                {/* Quick Action Links */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Links</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    <a href={loc.routes.personal} className="hover:text-primary transition-colors flex items-center justify-center gap-1">
                      Personal Loan <ArrowRight size={12} />
                    </a>
                    <a href={loc.routes.business} className="hover:text-primary transition-colors flex items-center justify-center gap-1">
                      Business Loan <ArrowRight size={12} />
                    </a>
                    <a href={loc.routes.home} className="hover:text-primary transition-colors flex items-center justify-center gap-1">
                      Home Loan <ArrowRight size={12} />
                    </a>
                    <a href="/partners" className="hover:text-primary transition-colors flex items-center justify-center gap-1">
                      DSA Partner <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>

      </div>
    </section>
  )
}
