"use client"
import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { HomeHero } from "@/components/sections/HomeHero"
import { ProductGrid } from "@/components/sections/ProductGrid"
import { CIBILBanner } from "@/components/sections/CIBILBanner"
import { EligibilityWizard } from "@/components/sections/EligibilityWizard"
import { EMICalculator } from "@/components/sections/EMICalculator"
import { DocumentSupport } from "@/components/sections/DocumentSupport"
import { Testimonials } from "@/components/sections/Testimonials"
import { FAQ } from "@/components/sections/FAQ"
import { BlogAndCTA } from "@/components/sections/BlogAndCTA"

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HomeHero />
        <ProductGrid />
        <CIBILBanner />
        <EligibilityWizard />
        <EMICalculator />
        <DocumentSupport />
        <Testimonials />
        <FAQ />
        <BlogAndCTA />
      </main>
      <Footer />
    </>
  )
}
