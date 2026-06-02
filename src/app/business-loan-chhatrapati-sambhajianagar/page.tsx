import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Business Loan in Chhatrapati Sambhajianagar | MSME Finance | TechStar",
  description: "Secure a Business Loan in Chhatrapati Sambhajianagar (Aurangabad). Unsecured MSME loans up to 75 Lakhs, starting at 14.00% p.a. Minimal paperwork.",
  keywords: "business loan chhatrapati sambhajianagar, business loan aurangabad, msme loan chhatrapati sambhajianagar, startup loan aurangabad, working capital aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/business-loan-chhatrapati-sambhajianagar"
  }
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
