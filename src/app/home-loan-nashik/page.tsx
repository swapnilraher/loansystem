import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Home Loan in Nashik | Opp Station Road | TechStar Deals",
  description: "Secure the lowest Home Loan interest rates in Nashik starting at 8.40% p.a. Compare offers from 50+ major banks, check PMAY subsidy, and get up to 90% property funding.",
  keywords: "home loan nashik, plot loan nashik, land loan nashik, home loan agent nashik, best loan dsa nashik",
  alternates: {
    canonical: "https://techstarsolution.in/home-loan-nashik"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Home Loan"
      location="Nashik"
      serviceSlug="home-loan"
      locationSlug="nashik"
    />
  )
}
