import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Business Loan in Pune – Collateral Free MSME Funding | Techstar Money Solution",
  description: "Expand your Pune business with a collateral-free Business Loan. Get MSME & startup funding at 14% p.a., approved in 24 hrs. Mudra loan, working capital & more. Apply in 5 minutes.",
  keywords: "business loan pune, msme loan pune, working capital loan pune, startup loan pune, mudra loan pune, collateral free loan pune, business finance pune",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan-pune"
  },
  openGraph: {
    title: "Business Loan in Pune – Collateral Free MSME Funding | Techstar Money Solution",
    description: "MSME & Startup loans in Pune. 14% p.a. Approved in 24 hrs. Apply in 5 mins.",
    type: "website",
    url: "https://techstarsolution.in/business-loan-pune",
  },
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
