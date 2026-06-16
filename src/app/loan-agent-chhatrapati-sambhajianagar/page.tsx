import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Agent in Chhatrapati Sambhajianagar – Expert DSA | Techstar Money Solution",
  description: "Trusted Loan Agents in Chhatrapati Sambhajianagar (Aurangabad). Get expert help for Personal, Home, Business & Property loans. Compare 50+ banks. Fast approval, doorstep assistance.",
  keywords: "loan agent chhatrapati sambhajianagar, loan agent aurangabad, dsa loan aurangabad, best loan agent aurangabad, home loan advisor sambhajianagar, loan consultant aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/loan-agent-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "Loan Agent in Chhatrapati Sambhajianagar – Expert DSA | Techstar Money Solution",
    description: "Certified Loan Agents in Sambhajianagar. All loan types. 50+ banks. Fast approval.",
    type: "website",
    url: "https://techstarsolution.in/loan-agent-chhatrapati-sambhajianagar",
  },
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
