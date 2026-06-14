"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { Home, Briefcase, Phone, LayoutDashboard, Calculator } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user, profile, adminRole } = useAuth()
  
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

  let accountHref = "/dashboard"
  if (adminRole) {
    accountHref = "/admin/leads"
  } else if (pathname?.startsWith("/partner") || profile?.kycData || profile?.dsaCode) {
    accountHref = "/partner"
  }

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Loans", href: "/personal-loan", icon: Briefcase },
    { name: "EMI Calc", href: "/#emi-calculator", icon: Calculator },
    { name: "Support", href: "tel:9579005645", icon: Phone },
    { name: "Account", href: accountHref, icon: LayoutDashboard }
  ]

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-2">
      {tabs.map((tab) => {
        const isActive = 
          pathname === tab.href || 
          (tab.href !== "/" && pathname?.startsWith(tab.href)) ||
          (tab.name === "Account" && (pathname?.startsWith("/admin") || pathname?.startsWith("/partner") || pathname?.startsWith("/dashboard")))
        
        return (
          <a
            key={tab.name}
            href={tab.href}
            className="flex flex-col items-center justify-center flex-grow h-full py-1 text-blue-600 hover:text-blue-700 transition-colors group text-decoration-none"
          >
            <div className={`flex flex-col items-center gap-1 transition-all duration-250 ${isActive ? "scale-105" : "active:scale-95"}`}>
              {/* Active icon background box only behind the icon */}
              <div className={`w-12 h-7.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-blue-600 border border-emerald-100/10" 
                  : "bg-transparent text-blue-600/80 hover:text-blue-600"
              }`}>
                <tab.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider leading-none text-blue-600">
                {tab.name}
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
