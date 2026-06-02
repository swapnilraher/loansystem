import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Instant Personal Loan in Mumbai | Lowest Interest Rates | TechStar",
  description: "Apply for a Personal Loan in Mumbai. Check eligibility in 2 minutes, compare interest rates from 50+ banks, and get instant approval with local DSA support.",
  keywords: "personal loan mumbai, loan agent mumbai, dsa loan mumbai, loan consultant mumbai, best loan dsa mumbai, loan documentation service mumbai",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-mumbai"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Personal Loan"
      location="Mumbai"
      serviceSlug="personal-loan"
      locationSlug="mumbai"
    />
  )
}
