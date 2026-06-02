import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Unsecured Business Loan in Pune | Mudra & MSME Loans | TechStar",
  description: "Apply for a Business Loan in Pune. Obtain collateral-free working capital, Mudra business loans, or startup funding at lowest rates. Disbursal in 24 hours.",
  keywords: "business loan pune, msme loan pune, mudra loan pune, working capital loan pune, dsa business loan pune, business loan maharashtra",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan-pune"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Business Loan"
      location="Pune"
      serviceSlug="business-loan"
      locationSlug="pune"
    />
  )
}
