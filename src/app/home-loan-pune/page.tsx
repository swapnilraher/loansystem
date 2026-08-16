import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Home Loan in Pune – Rates from 8.40% | PMAY Subsidy | Techstar Money Solution",
  description: "Buy your dream home in Pune with a Home Loan starting at 8.40% p.a. Save up to ₹3.5L in tax. Compare SBI, HDFC, Kotak & 50+ lenders. Doorstep service in Kothrud, Baner, Wakad & more.",
  keywords: "home loan pune, home loan interest rate pune, home loan agent pune, pmay subsidy pune, sbi home loan pune, hdfc home loan pune, best home loan dsa pune",
  alternates: {
    canonical: "https://techstarsolution.in/home-loan-pune"
  },
  openGraph: {
    title: "Home Loan in Pune – Rates from 8.40% | PMAY Subsidy | Techstar Money Solution",
    description: "Home Loan from 8.40% p.a. in Pune. Save ₹3.5L tax. Compare 50+ lenders. Doorstep service.",
    type: "website",
    url: "https://techstarsolution.in/home-loan-pune",
  },
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
