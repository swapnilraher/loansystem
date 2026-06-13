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
              <div className="p-5 flex flex-col justify-between h-full space-y-4 text-left">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary shrink-0 shadow-sm">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-secondary dark:text-white leading-tight">
                      {loc.city}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {loc.alias ? `${loc.alias}, ${loc.state}` : loc.state}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Check size={12} className="text-emerald-500" />
                    <span>{loc.lenders}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-primary" />
                    <span>{loc.time}</span>
                  </div>
                </div>

                {/* Quick Action Links */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quick Links</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-extrabold text-slate-650 dark:text-slate-350">
                    <a href={loc.routes.personal} className="hover:text-primary transition-colors flex items-center gap-0.5">
                      Personal Loan <ArrowRight size={10} />
                    </a>
                    <a href={loc.routes.business} className="hover:text-primary transition-colors flex items-center gap-0.5">
                      Business Loan <ArrowRight size={10} />
                    </a>
                    <a href={loc.routes.home} className="hover:text-primary transition-colors flex items-center gap-0.5">
                      Home Loan <ArrowRight size={10} />
                    </a>
                    <a href={loc.routes.dsa} className="hover:text-primary transition-colors flex items-center gap-0.5">
                      DSA Partner <ArrowRight size={10} />
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
