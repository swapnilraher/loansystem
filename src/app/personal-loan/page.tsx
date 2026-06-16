import React from "react"
import { Metadata } from "next"
import { Header, Footer } from "@/components/sections/Layout"
import { Hero } from "@/components/sections/Hero"
import { Partners } from "@/components/sections/Partners"
import { AnimatedStats } from "@/components/sections/AnimatedStats"
import { Overview } from "@/components/sections/Overview"
import { EMICalculator } from "@/components/sections/EMICalculator"
import { Eligibility } from "@/components/sections/Eligibility"
import { Features } from "@/components/sections/Features"
import { Purpose } from "@/components/sections/Purpose"
import { ProcessAndTips } from "@/components/sections/ProcessAndTips"
import { FAQ } from "@/components/sections/FAQ"
import { Testimonials } from "@/components/sections/Testimonials"
import { BlogAndCTA } from "@/components/sections/BlogAndCTA"
import { CIBILBanner } from "@/components/sections/CIBILBanner"
import { StickyMobileCTA } from "@/components/ui/StickyMobileCTA"
import LoanComparisonTable from "@/components/ui/LoanComparisonTable"
import { PersonalLoanDetailedInfo } from "@/components/sections/PersonalLoanDetailedInfo"
export const metadata: Metadata = {
  title: "Personal Loan – Instant Approval Up to ₹50 Lakhs | Techstar Money Solution",
  description: "Need urgent funds? Apply for Personal Loan online. Compare rates from 50+ banks, check eligibility in 2 mins, get approval within 24 hrs & funds in your account fast.",
  keywords: "personal loan, instant personal loan, low interest personal loan, personal loan compare, personal loan eligibility, personal loan emi calculator",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan"
  },
  openGraph: {
    title: "Personal Loan – Instant Approval Up to ₹50 Lakhs | Techstar Money Solution",
    description: "Compare and apply for personal loans from 50+ banks. Instant approval & quick disbursal within 24 hrs.",
    type: "website",
    url: "https://techstarsolution.in/personal-loan",
  },
}

export default function PersonalLoanPage() {
  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the minimum salary required for a personal loan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most banks require a minimum monthly net salary of ₹15,000 for applicants in Tier-2 and Tier-3 cities, while for metro cities like Mumbai or Delhi, the requirement might be ₹25,000 or higher."
        }
      },
      // ... Add more as needed
    ]
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <Header />
      <Hero />
      <Partners />
      <LoanComparisonTable />
      <AnimatedStats />
      <Overview />
      <PersonalLoanDetailedInfo />
      <EMICalculator />
      <Eligibility />
      <Features />
      <Purpose />
      <ProcessAndTips />
      <CIBILBanner />
      <FAQ />
      <Testimonials />
      <BlogAndCTA />
      <Footer />

      <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
    </main>
  )
}
