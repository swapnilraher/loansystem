import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Best Loan Agent in Chhatrapati Sambhajianagar | Advisor | TechStar",
  description: "Consult with professional Loan Agents in Chhatrapati Sambhajianagar (Aurangabad). Expert documentation check, bank selection assistance, and quick verification.",
  keywords: "loan agent chhatrapati sambhajianagar, loan agent aurangabad, best loan agent aurangabad, home loan advisor chhatrapati sambhajianagar",
  alternates: {
    canonical: "https://techstarsolution.in/loan-agent-chhatrapati-sambhajianagar"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Agent"
      location="Chhatrapati Sambhajianagar"
      serviceSlug="loan-agent"
      locationSlug="chhatrapati-sambhajianagar"
    />
  )
}
