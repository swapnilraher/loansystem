"use client"
import React from "react"
import { motion } from "framer-motion"
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
  const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )

  return (
    <>
      <Header />
      <main className="relative bg-slate-50/10 dark:bg-slate-900/10 overflow-hidden">
        <HomeHero />
        <AnimatedSection><ProductGrid /></AnimatedSection>
        <AnimatedSection><TrustSignals /></AnimatedSection>
        <AnimatedSection><LoanJourney /></AnimatedSection>
        <AnimatedSection><BecomePartner /></AnimatedSection>
        <AnimatedSection><CIBILBanner /></AnimatedSection>
        <AnimatedSection><EligibilityWizard /></AnimatedSection>
        <AnimatedSection><EMICalculator /></AnimatedSection>
        <AnimatedSection><Testimonials /></AnimatedSection>
        <AnimatedSection><LocationCoverage /></AnimatedSection>
        <AnimatedSection><FAQ /></AnimatedSection>
        <AnimatedSection><BlogAndCTA /></AnimatedSection>
        <Footer />
      </main>
    </>
  )
}
