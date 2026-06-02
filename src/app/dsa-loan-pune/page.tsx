import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Registered Loan DSA in Pune | Techstar Business Solution",
  description: "Apply for bank loans through Techstar's certified Loan DSA in Pune. Enjoy single-window evaluation across 50+ banking partners with paperless processing.",
  keywords: "dsa loan pune, loan dsa pune, registered loan dsa pune, direct selling agent pune, techstar dsa pune",
  alternates: {
    canonical: "https://techstarsolution.in/dsa-loan-pune"
  }
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="DSA Loan"
      location="Pune"
      serviceSlug="dsa-loan"
      locationSlug="pune"
    />
  )
}
