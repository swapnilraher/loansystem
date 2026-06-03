"use client"
import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { HomeHero } from "@/components/sections/HomeHero"
import { ProductGrid } from "@/components/sections/ProductGrid"
import { BecomePartner } from "@/components/sections/BecomePartner"
import { CIBILBanner } from "@/components/sections/CIBILBanner"
import { EligibilityWizard } from "@/components/sections/EligibilityWizard"
import { EMICalculator } from "@/components/sections/EMICalculator"
import { DocumentSupport } from "@/components/sections/DocumentSupport"
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
      <main>
        <HomeHero />
        <ProductGrid />
        <TrustSignals />
        <LoanJourney />
        <BecomePartner />
        <CIBILBanner />
        <EligibilityWizard />
        <EMICalculator />
        <DocumentSupport />
        <Testimonials />
        <LocationCoverage />
        <FAQ />
        <BlogAndCTA />
      </main>
      <Footer />
    </>
  )
}
