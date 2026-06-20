import React from "react"
import { Metadata } from "next"
import { Header, Footer } from "@/components/sections/Layout"
import PersonalLoanPageContent from "@/components/sections/PersonalLoanPageBS"
import { StickyMobileCTA } from "@/components/ui/StickyMobileCTA"

export const metadata: Metadata = {
  title: "Personal Loan in Chhatrapati Sambhajianagar – Fast Approval | Techstar Money Solution",
  description: "Residents of Chhatrapati Sambhajianagar (Aurangabad) – apply for Personal Loan and get approval in 24 hrs. Compare 50+ banks, low interest rates, minimal documentation & expert DSA support.",
  keywords: "personal loan chhatrapati sambhajianagar, personal loan aurangabad, loan agent aurangabad, personal loan low interest aurangabad, instant personal loan sambhajianagar",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "Personal Loan in Chhatrapati Sambhajianagar – Fast Approval | Techstar Money Solution",
    description: "Approved in 24 hrs. Compare 50+ banks. Expert DSA support in Sambhajianagar.",
    type: "website",
    url: "https://techstarsolution.in/personal-loan-chhatrapati-sambhajianagar",
  },
}

export default function Page() {
  return (
    <main>
      <Header />
      <PersonalLoanPageContent city="Chhatrapati Sambhajianagar" />
      <Footer />
      <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
    </main>
  )
}
