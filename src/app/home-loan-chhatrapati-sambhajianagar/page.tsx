import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Home Loan in Chhatrapati Sambhajianagar | Lowest Interest Rates | TechStar",
  description: "Apply for a Home Loan in Chhatrapati Sambhajianagar (Aurangabad). Rates starting from 8.40% p.a., flexible tenure options, and complete documentation assistance.",
  keywords: "home loan chhatrapati sambhajianagar, home loan aurangabad, home loan agent aurangabad, housing loan chhatrapati sambhajianagar",
  alternates: {
    canonical: "https://techstarsolution.in/home-loan-chhatrapati-sambhajianagar"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Home Loan"
      location="Chhatrapati Sambhajianagar"
      serviceSlug="home-loan"
      locationSlug="chhatrapati-sambhajianagar"
    />
  )
}
