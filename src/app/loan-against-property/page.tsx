import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property – Up to ₹15 Cr at 9.00% | Techstar Money Solution",
  description: "Unlock your property's value. Get LAP (Mortgage Loan) up to ₹15 Crores at rates starting 9.00% p.a. Residential & commercial properties accepted. Fast approval & flexible repayment.",
  keywords: "loan against property, LAP loan, mortgage loan, property loan, commercial property loan, residential property loan, lap interest rate",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property"
  },
  openGraph: {
    title: "Loan Against Property – Up to ₹15 Cr at 9.00% | Techstar Money Solution",
    description: "Unlock your property value. LAP up to ₹15 Cr at 9.00% p.a. Commercial & residential accepted.",
    type: "website",
    url: "https://techstarsolution.in/loan-against-property",
  },
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Against Property"
      location="India"
      serviceSlug="loan-against-property"
      locationSlug="india"
    />
  )
}
