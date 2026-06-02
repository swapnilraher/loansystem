import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Home Loan in Pune | FC Road Location | TechStar Finance",
  description: "Get the lowest Home Loan interest rates in Pune starting from 8.40% p.a. Check your eligibility, evaluate PMAY interest subsidies, and compare 50+ lenders.",
  keywords: "home loan pune, plot loan pune, land loan pune, home purchase loan pune, best home loan dsa pune, loan consultant pune",
  alternates: {
    canonical: "https://techstarsolution.in/home-loan-pune"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Home Loan"
      location="Pune"
      serviceSlug="home-loan"
      locationSlug="pune"
    />
  )
}
