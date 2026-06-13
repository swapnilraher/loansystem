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
      <main className="scroll-snap-container">
        <div className="scroll-snap-section">
          <HomeHero />
        </div>
        <div className="scroll-snap-section">
          <ProductGrid />
        </div>
        <div className="scroll-snap-section mb-5 mb-lg-0">
          <TrustSignals />
        </div>
        <div className="scroll-snap-section">
          <LoanJourney />
        </div>
        <div className="scroll-snap-section">
          <BecomePartner />
        </div>
        <div className="scroll-snap-section">
          <CIBILBanner />
        </div>
        <div className="scroll-snap-section">
          <EligibilityWizard />
        </div>
        <div className="scroll-snap-section">
          <EMICalculator />
        </div>
        <div className="scroll-snap-section">
          <Testimonials />
        </div>
        <div className="scroll-snap-section">
          <LocationCoverage />
        </div>
        <div className="scroll-snap-section">
          <FAQ />
        </div>
        <div className="scroll-snap-section">
          <BlogAndCTA />
        </div>
        <div className="scroll-snap-section">
          <Footer />
        </div>
      </main>
    </>
  )
}
