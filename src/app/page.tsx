import React from "react"
import { Metadata } from "next"
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
import { AnimatedSection } from "@/components/ui/AnimatedSection"
import DynamicSections from "@/components/ui/DynamicSections"

export const metadata: Metadata = {
  title: "Techstar Money Solution – Instant Loans, Best Rates & DSA Partner",
  description: "Apply for Personal, Home, Business & LAP loans with instant approval. Compare 50+ banks, check eligibility in 2 minutes & get quick disbursal. Trusted by thousands across India.",
  keywords: "instant loan, personal loan, home loan, business loan, loan against property, loan dsa, low interest loan, loan agent india",
  alternates: {
    canonical: "https://techstarsolution.in",
  },
  openGraph: {
    title: "Techstar Money Solution – Instant Loans, Best Rates & DSA Partner",
    description: "Apply for Personal, Home, Business & LAP loans with instant approval. Compare 50+ banks, check eligibility in 2 minutes & get quick disbursal. Trusted by thousands across India.",
    url: "https://techstarsolution.in",
    siteName: "Techstar Money Solution",
    images: [
      {
        url: "/partners.png",
        width: 1200,
        height: 630,
        alt: "Techstar Money Solution – India's Trusted Loan Marketplace"
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Techstar Money Solution – Instant Loans, Best Rates & DSA Partner",
    description: "Compare 50+ banks. Personal, Home, Business & LAP loans with quick approval & low interest rates.",
    images: ["/partners.png"],
  },
};



export default function Home() {

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
        <DynamicSections />
        <AnimatedSection><LocationCoverage /></AnimatedSection>

        <AnimatedSection><BlogAndCTA /></AnimatedSection>
        <Footer />
      </main>
    </>
  )
}
