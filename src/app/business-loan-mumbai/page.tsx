import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Business Loan in Mumbai | Collateral Free MSME Loans | TechStar",
  description: "Secure a Business Loan in Mumbai with low interest rates starting from 14% p.a. Flexible unsecured capital up to 75 Lakhs for MSMEs and startups.",
  keywords: "business loan mumbai, msme loan mumbai, working capital loan mumbai, startup loan mumbai, loan agent mumbai, business loan advisor mumbai",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan-mumbai"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Business Loan"
      location="Mumbai"
      serviceSlug="business-loan"
      locationSlug="mumbai"
    />
  )
}
