import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Instant Personal Loan in Pune | Lowest Interest Rates | TechStar",
  description: "Apply for a Personal Loan in Pune. Compare low interest rates from 50+ lenders, verify your CIBIL score eligibility, and get quick approval with minimal paperwork.",
  keywords: "personal loan pune, loan agent pune, dsa loan pune, personal loan consultant pune, best loan dsa pune, loan agent maharashtra",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-pune"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Personal Loan"
      location="Pune"
      serviceSlug="personal-loan"
      locationSlug="pune"
    />
  )
}
