import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Best Loan Agent in Pune | Financial Services Advisory | TechStar",
  description: "Consult with Techstar's certified Loan Agents in Pune. Find personalized guidance, documentation verification, and fast approval rates for your personal, business, or home loans.",
  keywords: "loan agent pune, best loan agent pune, financial advisor pune, mortgage agent pune, home loan agent pune",
  alternates: {
    canonical: "https://techstarsolution.in/loan-agent-pune"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Agent"
      location="Pune"
      serviceSlug="loan-agent"
      locationSlug="pune"
    />
  )
}
