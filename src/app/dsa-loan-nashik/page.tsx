import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Premium Loan DSA in Nashik | Banking Partner | TechStar",
  description: "Partner with the premium Loan DSA in Nashik. Techstar Business Solution coordinates files directly with RBI-registered lenders to guarantee highest approval chances.",
  keywords: "dsa loan nashik, best loan dsa nashik, loan dsa registration nashik, loan agent nashik, loan documentation service nashik",
  alternates: {
    canonical: "https://techstarsolution.in/dsa-loan-nashik"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="DSA Loan"
      location="Nashik"
      serviceSlug="dsa-loan"
      locationSlug="nashik"
    />
  )
}
