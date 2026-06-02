import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property in Pune | Lowest Interest Rates | TechStar",
  description: "Get a Loan Against Property (LAP) in Pune starting at 9.00% p.a. Multi-bank eligibility checking, low processing charges, and professional local DSA support.",
  keywords: "loan against property pune, mortgage loan pune, property loan agent pune, lap loan pune, mortgage loan consultant pune",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property-pune"
  }
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
