import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property in Pune – Up to ₹15 Cr at 9.00% | Techstar Money Solution",
  description: "Unlock your property value in Pune. Get LAP (Mortgage Loan) up to ₹15 Cr at 9.00% p.a. Residential & commercial properties accepted. Fast approval, multi-bank eligibility check.",
  keywords: "loan against property pune, LAP pune, mortgage loan pune, property loan agent pune, lap interest rate pune, property backed loan pune",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property-pune"
  },
  openGraph: {
    title: "Loan Against Property in Pune – Up to ₹15 Cr at 9.00% | Techstar Money Solution",
    description: "LAP up to ₹15 Cr in Pune. 9.00% p.a. Residential & commercial. Fast approval.",
    type: "website",
    url: "https://techstarsolution.in/loan-against-property-pune",
  },
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Against Property"
      location="Pune"
      serviceSlug="loan-against-property"
      locationSlug="pune"
    />
  )
}
