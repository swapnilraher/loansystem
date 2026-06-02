import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Instant Personal Loan in Chhatrapati Sambhajianagar | TechStar",
  description: "Apply for a Personal Loan in Chhatrapati Sambhajianagar (Aurangabad). Check eligibility online in 2 minutes, get quotes from 50+ banks, and fast disbursal.",
  keywords: "personal loan chhatrapati sambhajianagar, personal loan aurangabad, loan agent chhatrapati sambhajianagar, dsa loan chhatrapati sambhajianagar, loan consultant aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-chhatrapati-sambhajianagar"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Personal Loan"
      location="Chhatrapati Sambhajianagar"
      serviceSlug="personal-loan"
      locationSlug="chhatrapati-sambhajianagar"
    />
  )
}
