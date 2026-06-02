import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Unsecured Business Loan in Nashik | MSME & Startup Loans | TechStar",
  description: "Apply for a Business Loan in Nashik. Secure collateral-free working capital, mudra loans, or startup funding at low interest rates. Quick approval within 24 hours.",
  keywords: "business loan nashik, msme loan nashik, mudra loan nashik, startup loan nashik, business loan maharashtra, best loan dsa nashik",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan-nashik"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Business Loan"
      location="Nashik"
      serviceSlug="business-loan"
      locationSlug="nashik"
    />
  )
}
