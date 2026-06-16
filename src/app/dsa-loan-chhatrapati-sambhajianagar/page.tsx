import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "DSA Loan Agent in Chhatrapati Sambhajianagar – Registered | Techstar Money Solution",
  description: "RBI-authorized DSA services in Chhatrapati Sambhajianagar (Aurangabad). Compare 50+ lenders for Personal, Home, Business & LAP loans. Expert documentation & fast disbursal.",
  keywords: "dsa loan chhatrapati sambhajianagar, loan dsa aurangabad, registered dsa aurangabad, direct selling agent sambhajianagar, techstar dsa aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/dsa-loan-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "DSA Loan Agent in Chhatrapati Sambhajianagar – Registered | Techstar Money Solution",
    description: "RBI-authorized DSA in Sambhajianagar. 50+ banks. All loan types. Fast disbursal.",
    type: "website",
    url: "https://techstarsolution.in/dsa-loan-chhatrapati-sambhajianagar",
  },
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
