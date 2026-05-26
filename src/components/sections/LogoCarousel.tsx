"use client"
import React from "react"
import { ShieldCheck, HeartHandshake, FileCheck } from "lucide-react"

export function LogoCarousel() {
  const partners = [
    { 
      name: "HDFC Bank", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/f0/HDFC-Bank-Logo.svg",
      className: "h-5 dark:brightness-200"
    },
    { 
      name: "ICICI Bank", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg",
      className: "h-5 dark:brightness-200"
    },
    { 
      name: "SBI", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/State_Bank_of_India.svg",
      className: "h-5"
    },
    { 
      name: "Axis Bank", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Axis_Bank_logo.svg",
      className: "h-4 dark:brightness-200"
    },
    { 
      name: "Kotak Mahindra", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Kotak_Mahindra_Bank_logo.svg",
      className: "h-5 dark:brightness-200"
    },
    { 
      name: "IDFC First Bank", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/IDFC_First_Bank_logo.svg",
      className: "h-6 dark:brightness-200"
    },
    { 
      name: "Yes Bank", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Yes_Bank_Logo.svg",
      className: "h-5 dark:brightness-200"
    },
    { 
      name: "Bajaj Finserv", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Bajaj_Finserv_Logo.svg",
      className: "h-5 dark:brightness-200"
    },
    { 
      name: "Tata Capital", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Tata_logo.svg",
      className: "h-6 dark:brightness-200"
    },
    { 
      name: "L&T Finance", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/L%26T_Logo.svg",
      className: "h-5 dark:brightness-200"
    }
  ]

  // Double list to create seamless infinite scrolling effect
  const marqueeItems = [...partners, ...partners, ...partners]

  return (
    <section className="py-16 bg-slate-50/40 dark:bg-slate-900/20 overflow-hidden border-y border-slate-150/60 dark:border-slate-800/80 relative">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-xs font-black uppercase text-primary tracking-widest leading-none mb-1">Our Lending Partners</p>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Trusted by India's top banks & financial institutions</p>
      </div>
      
      {/* Loop Track */}
      <div className="relative w-full flex items-center justify-center overflow-hidden py-4 mask-gradient-x">
        <div className="flex gap-8 whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
          {marqueeItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center bg-white dark:bg-slate-900 py-3.5 px-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm shrink-0 hover:border-primary/20 transition-all duration-300 min-w-[120px] h-14">
              <img 
                src={item.logo} 
                alt={item.name} 
                className={`${item.className} w-auto max-h-full object-contain`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Trust credentials badges */}
      <div className="mt-12 flex flex-wrap justify-center items-center gap-6 md:gap-12 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-wider">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>RBI REGISTERED NBFC DSA</span>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm">
          <HeartHandshake size={16} className="text-blue-500" />
          <span>100% SECURE DATA PROTECTION</span>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm">
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
