"use client"
import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { HomeHero } from "@/components/sections/HomeHero"
import { DynamicBanners } from "@/components/sections/DynamicBanners"
import { LogoCarousel } from "@/components/sections/LogoCarousel"
import { LoanJourney } from "@/components/sections/LoanJourney"
import { Insurance } from "@/components/sections/Insurance"
import { EMICalculator } from "@/components/sections/EMICalculator"
import { EligibilityWizard } from "@/components/sections/EligibilityWizard"
import { DocumentSupport } from "@/components/sections/DocumentSupport"
import { Features } from "@/components/sections/Features"
import { TrustSignals } from "@/components/sections/TrustSignals"
import { Testimonials } from "@/components/sections/Testimonials"
import { FAQ } from "@/components/sections/FAQ"
import { BlogAndCTA } from "@/components/sections/BlogAndCTA"
import { Button } from "@/components/ui/Button"

import { FloatingLeadNotifications } from "@/components/ui/FloatingLeadNotifications"

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      <Header />
      
      {/* 1. Hero banner with CTA & Eligibility Form */}
      <HomeHero />
      
      {/* Dynamic Scrolling Banners (Urban Money style) */}
      <div className="pt-24 lg:pt-32">
        <DynamicBanners />
      </div>
      
      {/* 9. Partner banks logos */}
      <LogoCarousel />

      {/* Loan Journey step timeline */}
      <LoanJourney />
      
      {/* 4. Insurance section */}
      <Insurance />
      
      {/* 5. EMI calculator */}
      <div className="bg-slate-50 dark:bg-slate-900/30">
        <EMICalculator />
      </div>

      {/* Interactive Eligibility Match Wizard */}
      <EligibilityWizard />

      {/* Dedicated Document Assistance & Required Checklist Section */}
      <DocumentSupport />

      {/* 7. Why choose us */}
      <Features />
      
      {/* Trust & Compliance Signals */}
      <TrustSignals />
      
      {/* 8. Customer reviews */}
      <Testimonials />
      
      {/* 10. FAQ section */}
      <FAQ />
      
      {/* Latest Insights & Footer CTA */}
      <BlogAndCTA />
      
      <Footer />

      {/* Sticky lead form (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-[40] flex items-center gap-4 shadow-2xl">
        <div className="flex-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Limited Offer</p>
          <p className="text-sm font-black text-secondary dark:text-white">Rates from 8.40%</p>
        </div>
        <Button className="h-12 px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 cursor-pointer">Apply Now</Button>
      </div>

      {/* Premium Floating Elements */}
      <FloatingLeadNotifications />
    </main>
  )
}
