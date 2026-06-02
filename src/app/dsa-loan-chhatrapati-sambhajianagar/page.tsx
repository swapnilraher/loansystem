import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Registered Loan DSA in Chhatrapati Sambhajianagar | Techstar",
  description: "Get RBI-authorized DSA assistance in Chhatrapati Sambhajianagar (Aurangabad). Evaluate 50+ lenders, match credit scores, and secure quick loan dispatches.",
  keywords: "dsa loan chhatrapati sambhajianagar, loan dsa aurangabad, direct selling agent chhatrapati sambhajianagar, techstar business solution dsa",
  alternates: {
    canonical: "https://techstarsolution.in/dsa-loan-chhatrapati-sambhajianagar"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="DSA Loan"
      location="Chhatrapati Sambhajianagar"
      serviceSlug="dsa-loan"
      locationSlug="chhatrapati-sambhajianagar"
    />
  )
}
