import React from "react"

interface FAQItem {
  question: string
  answer: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface SEOSchemaProps {
  type: "Organization" | "LocalBusiness" | "FinancialService" | "FAQ" | "Breadcrumb" | "Service" | "WebSite"
  data?: any
}

export function SEOSchema({ type, data }: SEOSchemaProps) {
  let schema: any = null

  if (type === "Organization") {
    schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": data?.name || "Techstar Money Solution",
      "alternateName": "Techstar Money Solution",
      "url": "https://techstarsolution.in",
      "logo": "https://techstarsolution.in/img/logo.jpeg",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-9579005645",
        "contactType": "customer service",
        "areaServed": "IN",
        "availableLanguage": ["en", "hi", "mr"]
      },
      "sameAs": [
        "https://www.facebook.com/techstar",
        "https://www.linkedin.com/company/techstar",
        "https://twitter.com/techstar"
      ]
    }
  } 
  
  else if (type === "LocalBusiness" || type === "FinancialService") {
    schema = {
      "@context": "https://schema.org",
      "@type": type,
      "name": data?.name || "Techstar Money Solution",
      "image": "https://techstarsolution.in/partners.png",
      "telephone": "+91-9579005645",
      "url": "https://techstarsolution.in",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": data?.street || "Opposite Devgiri College, Station Road",
        "addressLocality": data?.locality || "Chhatrapati Sambhajinagar",
        "addressRegion": "Maharashtra",
        "postalCode": data?.postalCode || "431005",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": data?.latitude || 19.8698,
        "longitude": data?.longitude || 75.3182
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        "opens": "09:30",
        "closes": "18:30"
      },
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "Nashik" },
        { "@type": "AdministrativeArea", "name": "Pune" },
        { "@type": "AdministrativeArea", "name": "Mumbai" },
        { "@type": "AdministrativeArea", "name": "Aurangabad" },
        { "@type": "AdministrativeArea", "name": "Chhatrapati Sambhajinagar" },
        { "@type": "AdministrativeArea", "name": "Maharashtra" }
      ]
    }
  } 
  
  else if (type === "FAQ") {
    const faqItems: FAQItem[] = data?.items || []
    schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    }
  } 
  
  else if (type === "Breadcrumb") {
    const items: BreadcrumbItem[] = data?.items || []
    schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.name,
        "item": item.url
      }))
    }
  } 
  
  else if (type === "Service") {
    schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": data?.serviceType || "Financial Loan DSA Service",
      "provider": {
        "@type": "FinancialService",
        "name": "Techstar Money Solution",
        "url": "https://techstarsolution.in"
      },
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "Maharashtra" },
        { "@type": "AdministrativeArea", "name": "Nashik" },
        { "@type": "AdministrativeArea", "name": "Pune" },
        { "@type": "AdministrativeArea", "name": "Mumbai" }
      ],
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "description": data?.description || "Compare and apply for top loan products with starting rates of 8.40% p.a."
      }
    }
  }

  else if (type === "WebSite") {
    schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Techstar Money Solution",
      "url": "https://techstarsolution.in",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://techstarsolution.in/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  }

  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
