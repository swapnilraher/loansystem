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
export const metadata: Metadata = {
  title: "Instant Personal Loan Up to ₹50 Lakhs | Competitive Rates | TechStar",
  description: "Apply for a personal loan online with TechStar. Compare top banks, check eligibility in 2 minutes, and get quick approval with minimal documentation. Rates start at 10.50% p.a.",
  keywords: "personal loan, instant loan, low interest loan, compare loans, online loan application, eligibility calculator, EMI calculator",
  openGraph: {
    title: "Instant Personal Loan Up to ₹50 Lakhs | TechStar",
    description: "Compare and apply for personal loans from 100+ lenders. Instant approval & quick disbursal.",
    type: "website",
    url: "https://techstar.in/personal-loan",
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
      <AnimatedStats />
      <Overview />
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

      {/* Sticky Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-100 z-50">
        <button className="w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">
          Apply Now
        </button>
      </div>
    </main>
  )
}
