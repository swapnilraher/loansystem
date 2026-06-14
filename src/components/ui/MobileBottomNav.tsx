"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { Home, Briefcase, Phone, LayoutDashboard, Calculator } from "lucide-react"
import { motion } from "framer-motion"

export function MobileBottomNav() {
  const pathname = usePathname()
  
  // Hide on admin and partner routes to prevent dashboard layout overlapping
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/partner")) {
    return null
  }

  // Hide on pages that have their own sticky CTA bars to prevent double bars on mobile
  const pagesWithStickyCTA = [
    "/personal-loan",
    "/home-loan",
    "-nashik",
    "-pune",
    "-mumbai",
    "-chhatrapati-sambhajianagar"
  ]
  
  const hasStickyCTA = pagesWithStickyCTA.some(page => pathname?.includes(page))
  if (hasStickyCTA) {
    return null
  }

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Loans", href: "/personal-loan", icon: Briefcase },
    { name: "EMI Calc", href: "/#emi-calculator", icon: Calculator },
    { name: "Support", href: "tel:9579005645", icon: Phone },
    { name: "Account", href: "/dashboard", icon: LayoutDashboard }
  ]

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href))
        
        return (
          <a
            key={tab.name}
            href={tab.href}
            className="relative flex flex-col items-center justify-center flex-grow h-full py-1 text-slate-500 hover:text-primary transition-colors group"
          >
            {/* Active background pill */}
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl z-0 scale-[0.8] origin-center"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            
            <div className={`relative z-10 flex flex-col items-center gap-1 transition-transform duration-250 ${isActive ? "text-primary scale-110" : "group-active:scale-95"}`}>
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                {tab.name}
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
