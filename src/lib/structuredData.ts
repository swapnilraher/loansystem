// src/lib/structuredData.ts
/**
 * Helpers to generate JSON‑LD for SEO pages.
 * All functions return plain JavaScript objects that can be stringified.
 */

export function generateOrganizationLD() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Techstar Business Solution Pvt. Ltd.",
    url: "https://techstarsolution.in",
    logo: "https://techstarsolution.in/img/logo.jpeg",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91 7020646007",
      contactType: "customer service",
      areaServed: "IN",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pune",
      postalCode: "411030",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.facebook.com/techstarsolution02/",
      "https://www.instagram.com/techstarsolution/",
    ],
  };
}

export function generateFinancialServiceLD({ city, loanType, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: `${loanType} in ${city}`,
    url,
    areaServed: city,
    provider: {
      "@type": "Organization",
      name: "Techstar Business Solution Pvt. Ltd.",
    },
    serviceType: loanType,
  };
}

export function generateBreadcrumbLD(breadcrumbs) {
  // breadcrumbs: [{ name, url }]
  const itemListElement = breadcrumbs.map((bc, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: bc.name,
    item: bc.url,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export function generateFAQLD(faqs) {
  // faqs: [{ question, answer }]
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
