import React from "react"
import { Metadata } from "next"
import LocationPageTemplate from "@/components/sections/LocationPageTemplate"

export const metadata: Metadata = {
  title: "Premium Car Loan | Lowest Interest Rates & Fast Disbursal | Techstar Money Solution",
  description: "Apply for a new or used car loan online with Techstar Money Solution. Compare top auto finance banks, check eligibility instantly, and get fast disbursal at competitive interest rates.",
  keywords: "car loan, vehicle loan, new car finance, used car loan, car refinance, auto loan, lowest car emi",
  alternates: {
    canonical: "https://techstarsolution.in/car-loan"
  }
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
