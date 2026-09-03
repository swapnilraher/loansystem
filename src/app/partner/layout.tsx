import type { Metadata } from "next"
import PartnerClientLayout from "./PartnerClientLayout"

export const metadata: Metadata = {
  title: "Techstar Money Solution | Loan DSA Partner",
  description: "Partner with Techstar Money Solution for loan DSA opportunities across Personal Loan, Business Loan, Home Loan, Loan Against Property, Working Capital and Balance Transfer.",
  keywords: "Techstar Money Solution, Techstar Money Solution Private Limited, Loan DSA, DSA Partner, Loan DSA Partner, Become a Loan DSA, Loan Agency in Chhatrapati Sambhajinagar, Loan Services Chhatrapati Sambhajinagar, Personal Loan DSA, Business Loan DSA, Home Loan DSA, Loan Against Property DSA, Working Capital DSA, Balance Transfer DSA",
  alternates: {
    canonical: "https://partner.techstarsolution.in/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Partner with Techstar Money Solution",
    description: "Join Techstar Money Solution as a DSA partner and explore opportunities across multiple financial solutions.",
    url: "https://partner.techstarsolution.in/",
    siteName: "Techstar Money Solution",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://partner.techstarsolution.in/partners.png",
        width: 1200,
        height: 630,
        alt: "Techstar Money Solution DSA partner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner with Techstar Money Solution",
    description: "Join Techstar Money Solution as a DSA partner and explore opportunities across multiple financial solutions.",
    images: ["https://partner.techstarsolution.in/partners.png"],
  },
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PartnerClientLayout>{children}</PartnerClientLayout>
}
