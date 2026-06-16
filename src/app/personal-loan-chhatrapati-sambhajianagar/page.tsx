import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Personal Loan in Chhatrapati Sambhajianagar – Fast Approval | Techstar Money Solution",
  description: "Residents of Chhatrapati Sambhajianagar (Aurangabad) – apply for Personal Loan and get approval in 24 hrs. Compare 50+ banks, low interest rates, minimal documentation & expert DSA support.",
  keywords: "personal loan chhatrapati sambhajianagar, personal loan aurangabad, loan agent aurangabad, personal loan low interest aurangabad, instant personal loan sambhajianagar",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "Personal Loan in Chhatrapati Sambhajianagar – Fast Approval | Techstar Money Solution",
    description: "Approved in 24 hrs. Compare 50+ banks. Expert DSA support in Sambhajianagar.",
    type: "website",
    url: "https://techstarsolution.in/personal-loan-chhatrapati-sambhajianagar",
  },
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
