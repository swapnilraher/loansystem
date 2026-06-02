import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Trusted Loan Agent in Nashik | Financial Consultant | TechStar",
  description: "Get assistance from the top loan agent in Nashik. Techstar provides complete documentation review, eligibility matching, and fast-track bank submission services.",
  keywords: "loan agent nashik, loan consultant nashik, financial consultant nashik, best loan dsa nashik, loan documentation service nashik",
  alternates: {
    canonical: "https://techstarsolution.in/loan-agent-nashik"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Agent"
      location="Nashik"
      serviceSlug="loan-agent"
      locationSlug="nashik"
    />
  )
}
