import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "DSA Loan Agent in Pune – Registered Partner | Techstar Money Solution",
  description: "Apply for any bank loan through Techstar's registered DSA in Pune. Single-window access to 50+ banking partners. Personal, Home, Business & LAP loans – 100% paperless & fast disbursal.",
  keywords: "dsa loan pune, loan dsa pune, registered dsa pune, direct selling agent pune, loan partner pune, techstar dsa pune, bank loan agent pune",
  alternates: {
    canonical: "https://techstarsolution.in/dsa-loan-pune"
  },
  openGraph: {
    title: "DSA Loan Agent in Pune – Registered Partner | Techstar Money Solution",
    description: "Registered DSA in Pune. 50+ banking partners. All loan types. 100% paperless.",
    type: "website",
    url: "https://techstarsolution.in/dsa-loan-pune",
  },
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
