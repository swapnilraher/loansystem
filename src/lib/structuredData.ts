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

export function generateFinancialServiceLD({ city, loanType, url }: { city: string; loanType: string; url: string }) {
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

export function generateBreadcrumbLD(breadcrumbs: { name: string; url: string }[]) {
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

export function generateFAQLD(faqs: { question: string; answer: string }[]) {
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

export function getCityGeoData(city: string) {
  const c = city.toLowerCase();
  
  if (c === "pune") {
    return { latitude: 18.5204, longitude: 73.8567, postalCode: "411001", street: "FC Road, Shivaji Nagar" };
  }
  if (c === "mumbai" || c === "mumbai city") {
    return { latitude: 19.0760, longitude: 72.8777, postalCode: "400001", street: "Bandra Kurla Complex (BKC)" };
  }
  if (c === "mumbai suburban") {
    return { latitude: 19.1200, longitude: 72.8500, postalCode: "400051", street: "Western Express Highway, Andheri" };
  }
  if (c.includes("sambhajia") || c.includes("aurangabad")) {
    return { latitude: 19.8698, longitude: 75.3182, postalCode: "431005", street: "Opposite Devgiri College, Station Road" };
  }
  if (c === "nagpur") {
    return { latitude: 21.1458, longitude: 79.0882, postalCode: "440001", street: "Kingsway Road, Near Railway Station" };
  }
  if (c === "thane") {
    return { latitude: 19.2183, longitude: 72.9781, postalCode: "400601", street: "Gokhale Road, Naupada" };
  }
  if (c === "navi mumbai") {
    return { latitude: 19.0330, longitude: 73.0297, postalCode: "400703", street: "Sector 17, Vashi" };
  }
  if (c === "solapur") {
    return { latitude: 17.6599, longitude: 75.9064, postalCode: "413001", street: "Station Road, Near Railway Station" };
  }
  if (c === "kolhapur") {
    return { latitude: 16.7050, longitude: 74.2433, postalCode: "416001", street: "Rajarampuri, Main Road" };
  }
  if (c === "amravati") {
    return { latitude: 20.9374, longitude: 77.7796, postalCode: "444601", street: "Badnera Road, Near Railway Overbridge" };
  }
  if (c === "akola") {
    return { latitude: 20.7002, longitude: 77.0082, postalCode: "444001", street: "National Highway 6, Near Bus Stand" };
  }
  if (c === "latur") {
    return { latitude: 18.4088, longitude: 76.5604, postalCode: "413512", street: "Ausa Road, Near Shivaji Chowk" };
  }
  if (c === "jalgaon") {
    return { latitude: 21.0077, longitude: 75.5626, postalCode: "425001", street: "Court Road, Near Railway Station" };
  }
  if (c === "nashik") {
    return { latitude: 19.9975, longitude: 73.7898, postalCode: "422001", street: "College Road, Near Canada Corner" };
  }

  return { 
    latitude: 19.0760, 
    longitude: 72.8777, 
    postalCode: "400001", 
    street: "Main Street, Near Town Plaza" 
  };
}

export function generateLocalBusinessLD({ city, loanType, url, street, postalCode, latitude, longitude }: { city: string; loanType: string; url: string; street: string; postalCode: string; latitude: number; longitude: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Techstar Business Solution - ${loanType} in ${city}`,
    image: "https://techstarsolution.in/img/logo.jpeg",
    telephone: "+91 7020646007",
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      addressLocality: city,
      addressRegion: "Maharashtra",
      postalCode,
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude,
      longitude
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: city
    }
  };
}
