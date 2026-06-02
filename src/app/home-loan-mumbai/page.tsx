import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Home Loan in Mumbai | Lowest Home Loan Interest Rates | TechStar",
  description: "Apply for a Home Loan in Mumbai with rates starting at 8.40% p.a. Check eligibility, calculate EMI, and get assisted documentation guidance.",
  keywords: "home loan mumbai, housing loan mumbai, home loan agent mumbai, home loan advisor mumbai, property loan mumbai, best home loan dsa mumbai",
  alternates: {
    canonical: "https://techstarsolution.in/home-loan-mumbai"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Home Loan"
      location="Mumbai"
      serviceSlug="home-loan"
      locationSlug="mumbai"
    />
  )
}
