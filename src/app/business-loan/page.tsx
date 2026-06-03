import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Business Loan | Collateral Free MSME Loans Up to ₹75 Lakhs | TechStar",
  description: "Get an unsecured business loan with TechStar. 100% paperless process, competitive interest rates starting from 14% p.a., and flexible tenure for MSMEs and startups in India.",
  keywords: "business loan, msme loan, collateral free loan, working capital loan, startup finance, business loan agent",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Business Loan"
      location="India"
      serviceSlug="business-loan"
      locationSlug="india"
    />
  )
}
