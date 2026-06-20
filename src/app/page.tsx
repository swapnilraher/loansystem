"use client"
import React from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { Header, Footer } from "@/components/sections/Layout"
import { HomeHero } from "@/components/sections/HomeHero"
import { ProductGrid } from "@/components/sections/ProductGrid"
import { LoanShowcase } from "@/components/sections/LoanShowcase"
import { BecomePartner } from "@/components/sections/BecomePartner"
import { CIBILBanner } from "@/components/sections/CIBILBanner"
import { BlogAndCTA } from "@/components/sections/BlogAndCTA"
import { TrustSignals } from "@/components/sections/TrustSignals"
import { LoanJourney } from "@/components/sections/LoanJourney"
import { LocationCoverage } from "@/components/sections/LocationCoverage"

const EligibilityWizard = dynamic(
  () => import("@/components/sections/EligibilityWizard").then((mod) => mod.EligibilityWizard),
  {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">Loading Eligibility Wizard...</div>
  }
)

const EMICalculator = dynamic(
  () => import("@/components/sections/EMICalculator").then((mod) => mod.EMICalculator),
  {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">Loading EMI Calculator...</div>
  }
)

const Testimonials = dynamic(
  () => import("@/components/sections/Testimonials").then((mod) => mod.Testimonials),
  {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">Loading Reviews...</div>
  }
)

const FAQ = dynamic(
  () => import("@/components/sections/FAQ").then((mod) => mod.FAQ),
  {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">Loading FAQs...</div>
  }
)

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
        <AnimatedSection><LoanShowcase /></AnimatedSection>
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
