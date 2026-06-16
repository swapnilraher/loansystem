import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Personal Loan in Pune – Instant Approval for IT & Salaried | Techstar Money Solution",
  description: "Need quick funds in Pune? Get Personal Loan approved in 24 hrs. Compare HDFC, ICICI, Axis & 50+ banks. Low interest, minimal docs, doorstep service in Hinjewadi, Kharadi & Baner.",
  keywords: "personal loan pune, instant personal loan pune, personal loan hinjewadi, personal loan kharadi, personal loan baner, personal loan salaried pune",
  alternates: {
    canonical: "https://techstarsolution.in/personal-loan-pune"
  },
  openGraph: {
    title: "Personal Loan in Pune – Instant Approval for IT & Salaried | Techstar Money Solution",
    description: "Approved in 24 hrs. Compare 50+ banks. Low interest. Doorstep service across Pune.",
    type: "website",
    url: "https://techstarsolution.in/personal-loan-pune",
  },
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Personal Loan"
      location="Pune"
      serviceSlug="personal-loan"
      locationSlug="pune"
    />
  )
}
