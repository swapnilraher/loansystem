import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Car Loan – Lowest EMI, New & Used Cars | Techstar Money Solution",
  description: "Drive home your dream car today. Compare Car Loan rates from top auto finance banks. New & used car financing, fast disbursal, minimal docs & lowest EMI options.",
  keywords: "car loan, vehicle loan, new car finance, used car loan, car loan emi calculator, auto finance india, lowest car emi",
  alternates: {
    canonical: "https://techstarsolution.in/car-loan"
  },
  openGraph: {
    title: "Car Loan – Lowest EMI, New & Used Cars | Techstar Money Solution",
    description: "New & used car loans. Lowest EMI, fast disbursal. Compare top banks.",
    type: "website",
    url: "https://techstarsolution.in/car-loan",
  },
}

export default function Page() {
  return (
    <LocationPageTemplate 
      service="Car Loan"
      location="India"
      serviceSlug="car-loan"
      locationSlug="india"
    />
  )
}
