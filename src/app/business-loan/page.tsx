import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Business Loan – Collateral Free Up to ₹1.75 Cr | MSME & Startups | Techstar Money Solution",
  description: "Grow your business without pledging assets. Get collateral-free Business Loan at 14% p.a. 100% paperless, fast disbursal, flexible tenure. Apply online in 5 minutes.",
  keywords: "business loan, msme loan, collateral free business loan, working capital loan, startup loan, business loan online, fast business finance",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan"
  },
  openGraph: {
    title: "Business Loan – Collateral Free Up to ₹1.75 Cr | Techstar Money Solution",
    description: "100% paperless business loan. Rates from 14% p.a. Apply in 5 minutes.",
    type: "website",
    url: "https://techstarsolution.in/business-loan",
  },
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
