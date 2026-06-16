import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property in Chhatrapati Sambhajianagar – 9.00% | Techstar Money Solution",
  description: "Mortgage your property in Chhatrapati Sambhajianagar (Aurangabad) and get LAP up to ₹15 Cr at 9.00% p.a. Residential & commercial properties. Fast multi-bank approval & expert guidance.",
  keywords: "loan against property chhatrapati sambhajianagar, LAP aurangabad, mortgage loan aurangabad, property loan sambhajianagar, lap agent aurangabad",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property-chhatrapati-sambhajianagar"
  },
  openGraph: {
    title: "Loan Against Property in Chhatrapati Sambhajianagar – 9.00% | Techstar Money Solution",
    description: "LAP up to ₹15 Cr in Sambhajianagar. 9.00% p.a. Fast approval. Expert DSA support.",
    type: "website",
    url: "https://techstarsolution.in/loan-against-property-chhatrapati-sambhajianagar",
  },
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
