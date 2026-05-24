"use client"
import React from "react"
import { ShieldCheck, HeartHandshake, FileCheck } from "lucide-react"

export function LogoCarousel() {
  const partners = [
    { name: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com" },
    { name: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com" },
    { name: "SBI", logo: "https://logo.clearbit.com/sbi.co.in" },
    { name: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com" },
    { name: "Kotak Mahindra", logo: "https://logo.clearbit.com/kotak.com" },
    { name: "IndusInd Bank", logo: "https://logo.clearbit.com/indusind.com" },
    { name: "IDFC First Bank", logo: "https://logo.clearbit.com/idfcfirstbank.com" },
    { name: "Yes Bank", logo: "https://logo.clearbit.com/yesbank.in" },
  ]

  // Double list to create seamless infinite scrolling effect
  const marqueeItems = [...partners, ...partners, ...partners]

  return (
    <section className="py-16 bg-slate-50/40 dark:bg-slate-900/20 overflow-hidden border-y border-slate-100 dark:border-slate-800/80 relative">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-xs font-black uppercase text-primary tracking-widest leading-none mb-1">Our Lending Partners</p>
        <p className="text-sm font-bold text-slate-505 dark:text-slate-400">Trusted by India's top banks & financial institutions</p>
      </div>
      
      {/* Infinite scrolling track */}
      <div className="relative w-full flex items-center justify-center overflow-hidden py-4 mask-gradient-x">
        <div className="flex gap-8 whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
          {marqueeItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white dark:bg-slate-900 py-3 px-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm shrink-0">
              <img 
                src={item.logo} 
                alt={item.name} 
                className="h-6 w-auto object-contain dark:brightness-90 opacity-80 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
              <span className="text-xs font-black text-secondary dark:text-white tracking-tight">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security & RBI Truststrip */}
      <div className="mt-12 flex flex-wrap justify-center items-center gap-6 md:gap-12 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-wider">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-850">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>RBI REGISTERED NBFC DSA</span>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-850">
          <HeartHandshake size={16} className="text-blue-500" />
          <span>100% SECURE DATA PROTECTION</span>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-850">
          <FileCheck size={16} className="text-purple-500" />
          <span>256-BIT SSL ENCRYPTED CONNECTION</span>
        </div>
      </div>

      <style jsx>{`
        .mask-gradient-x {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </section>
  )
}
