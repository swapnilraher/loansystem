import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Business Loan in Chhatrapati Sambhajianagar – MSME Finance | Techstar Money Solution",
  description: "Scale your business in Chhatrapati Sambhajianagar (Aurangabad). Get unsecured Business Loan at 14% p.a., no collateral, fast approval. MSME, Mudra & startup funding available.",
  keywords: "business loan chhatrapati sambhajianagar, business loan aurangabad, msme loan aurangabad, startup funding aurangabad, mudra loan sambhajianagar, working capital aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "Business Loan in Chhatrapati Sambhajianagar – MSME Finance | Techstar Money Solution",
    description: "Collateral-free Business Loan in Sambhajianagar. 14% p.a. MSME & Startup approved fast.",
    type: "website",
    url: "https://techstarsolution.in/business-loan-chhatrapati-sambhajianagar",
  },
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Business Loan"
      location="Chhatrapati Sambhajianagar"
      serviceSlug="business-loan"
      locationSlug="chhatrapati-sambhajianagar"
    />
  )
}
