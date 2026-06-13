"use client"
import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { HomeHero } from "@/components/sections/HomeHero"
import { ProductGrid } from "@/components/sections/ProductGrid"
import { BecomePartner } from "@/components/sections/BecomePartner"
import { CIBILBanner } from "@/components/sections/CIBILBanner"
import { EligibilityWizard } from "@/components/sections/EligibilityWizard"
import { EMICalculator } from "@/components/sections/EMICalculator"

import { Testimonials } from "@/components/sections/Testimonials"
import { FAQ } from "@/components/sections/FAQ"
import { BlogAndCTA } from "@/components/sections/BlogAndCTA"
import { TrustSignals } from "@/components/sections/TrustSignals"
import { LoanJourney } from "@/components/sections/LoanJourney"
import { LocationCoverage } from "@/components/sections/LocationCoverage"

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative bg-slate-50/10 dark:bg-slate-900/10">
        <HomeHero />
        <ProductGrid />
        <TrustSignals />
        <LoanJourney />
        <BecomePartner />
        <CIBILBanner />
        <EligibilityWizard />
        <EMICalculator />
        <Testimonials />
        <LocationCoverage />
        <FAQ />
        <BlogAndCTA />
        <Footer />
      </main>
    </>
  )
}
