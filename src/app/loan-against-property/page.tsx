import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Loan Against Property (LAP) | Secure Mortgage Loans Up to ₹5 Crores | TechStar",
  description: "Unlock the value of your property with TechStar. Apply for a Loan Against Property (LAP) at lowest interest rates starting from 9.00% p.a. with flexible repayment tenures.",
  keywords: "loan against property, lap, mortgage loan, property loan, loan against commercial property, loan against residential property",
  alternates: {
    canonical: "https://techstarsolution.in/loan-against-property"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Loan Against Property"
      location="India"
      serviceSlug="loan-against-property"
      locationSlug="india"
    />
  )
}
