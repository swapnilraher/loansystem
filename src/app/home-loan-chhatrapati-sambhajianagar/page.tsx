import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Home Loan in Chhatrapati Sambhajianagar – 8.40% Rate | Techstar Money Solution",
  description: "Planning to buy a home in Chhatrapati Sambhajianagar (Aurangabad)? Get Home Loan from 8.40% p.a. PMAY subsidy available. Compare 50+ banks & get instant sanction with expert DSA support.",
  keywords: "home loan chhatrapati sambhajianagar, home loan aurangabad, housing loan aurangabad, home loan agent sambhajianagar, best home loan dsa aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/home-loan-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "Home Loan in Chhatrapati Sambhajianagar – 8.40% Rate | Techstar Money Solution",
    description: "Home Loan from 8.40% p.a. in Sambhajianagar. PMAY subsidy. Compare 50+ banks.",
    type: "website",
    url: "https://techstarsolution.in/home-loan-chhatrapati-sambhajianagar",
  },
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
