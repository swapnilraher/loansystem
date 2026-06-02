import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property (LAP) in Nashik | Mortgage Loan | TechStar",
  description: "Apply for a Loan Against Property (LAP) in Nashik. Unlock the value of your commercial or residential property with mortgage loans starting at 9.00% p.a. Minimal paperwork.",
  keywords: "loan against property nashik, lap loan nashik, mortgage loan nashik, property loan agent nashik, dsa loan nashik",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property-nashik"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Against Property"
      location="Nashik"
      serviceSlug="loan-against-property"
      locationSlug="nashik"
    />
  )
}
