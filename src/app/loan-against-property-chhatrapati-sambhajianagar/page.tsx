import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property in Chhatrapati Sambhajianagar | Mortgage Loan | TechStar",
  description: "Get a Loan Against Property (LAP) in Chhatrapati Sambhajianagar (Aurangabad). High valuation, lowest rates starting at 9.00% p.a., and local guidance.",
  keywords: "loan against property chhatrapati sambhajianagar, loan against property aurangabad, mortgage loan chhatrapati sambhajianagar, lap loan aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property-chhatrapati-sambhajianagar"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Against Property"
      location="Chhatrapati Sambhajianagar"
      serviceSlug="loan-against-property"
      locationSlug="chhatrapati-sambhajianagar"
    />
  )
}
