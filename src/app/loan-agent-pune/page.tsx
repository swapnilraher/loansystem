import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Agent in Pune – Expert DSA for All Loans | Techstar Money Solution",
  description: "Connect with certified Loan Agents in Pune. Personal, Home, Business & LAP loans – compare 50+ banks, get paperwork assistance & fastest approval. Doorstep service across Pune.",
  keywords: "loan agent pune, best loan agent pune, dsa loan pune, financial advisor pune, home loan agent pune, personal loan agent pune, business loan agent pune",
  alternates: {
    canonical: "https://techstarsolution.in/loan-agent-pune"
  },
  openGraph: {
    title: "Loan Agent in Pune – Expert DSA for All Loans | Techstar Money Solution",
    description: "Certified Loan Agents in Pune. All loan types. Compare 50+ banks. Doorstep service.",
    type: "website",
    url: "https://techstarsolution.in/loan-agent-pune",
  },
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
