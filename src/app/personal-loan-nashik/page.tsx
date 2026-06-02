import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Instant Personal Loan in Nashik | Low Interest Rates | TechStar",
  description: "Apply for a Personal Loan in Nashik. Check eligibility in 2 minutes, compare interest rates from 50+ banks, and enjoy a 100% paperless process with local DSA support.",
  keywords: "personal loan nashik, loan agent nashik, dsa loan nashik, loan consultant nashik, best loan dsa nashik, loan documentation service nashik",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-nashik"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Personal Loan"
      location="Nashik"
      serviceSlug="personal-loan"
      locationSlug="nashik"
    />
  )
}
