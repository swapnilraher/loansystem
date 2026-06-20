import React from 'react';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';
import { 
  generateOrganizationLD, 
  generateFinancialServiceLD, 
  generateBreadcrumbLD, 
  generateFAQLD,
  getCityGeoData,
  generateLocalBusinessLD
} from '@/lib/structuredData';
import Link from 'next/link';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';
import LocationPageTemplate from '@/components/sections/LocationPageTemplate';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan', 'business-loan', 'car-loan', 'loan-against-property'];

/** Helper to title‑case a slug */
function titleCase(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Generate SEO metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: Promise<{ loan: string; state: string; city: string }> }) {
  const resolvedParams = await params;
  const loanName = titleCase(resolvedParams.loan);
  const cityName = titleCase(resolvedParams.city);
  const stateName = titleCase(resolvedParams.state);
  const canonical = `https://techstarsolution.in/${resolvedParams.loan}/${resolvedParams.state}/${resolvedParams.city}`;

  const title = `${loanName} in ${cityName}, ${stateName} – Low Interest Rates & Quick Approval | Techstar Business Solution`;
  const description = `Apply for ${loanName} in ${cityName}, ${stateName} with Techstar Business Solution. Compare interest rates, eligibility, EMI options and get quick approval from leading banks and NBFCs. Call +91 7020646007.`;
  const keywords = [
    `${loanName.toLowerCase()} in ${cityName.toLowerCase()}`,
    `best ${loanName.toLowerCase()} in ${cityName.toLowerCase()}`,
    `instant ${loanName.toLowerCase()} in ${cityName.toLowerCase()}`,
    `low interest ${loanName.toLowerCase()} in ${cityName.toLowerCase()}`,
    `${loanName.toLowerCase()} agent in ${cityName.toLowerCase()}`,
    `${loanName.toLowerCase()} DSA in ${cityName.toLowerCase()}`,
    `${loanName.toLowerCase()} consultant in ${cityName.toLowerCase()}`,
    `apply ${loanName.toLowerCase()} online in ${cityName.toLowerCase()}`,
    `${loanName.toLowerCase()} near me`,
    `quick approval ${loanName.toLowerCase()} in ${cityName.toLowerCase()}`,
  ].join(', ');

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: 'https://techstarsolution.in/img/logo.jpeg' }],
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image' as const,
      images: ['https://techstarsolution.in/img/logo.jpeg'],
    },
  };
}

export default async function LoanStateCityPage({ params }: { params: Promise<{ loan: string; state: string; city: string }> }) {
  const resolvedParams = await params;
  const { loan, state, city } = resolvedParams;

  // Validate loan type
  if (!validLoans.includes(loan)) notFound();
  // Only Maharashtra supported for now
  if (state.toLowerCase() !== 'maharashtra') notFound();

  const citySlug = city.toLowerCase();
  const cityList = maharashtraCities.map((c) => c.toLowerCase().replace(/ /g, '-'));
  if (!cityList.includes(citySlug)) notFound();

  const loanName = titleCase(loan);
  const cityName = titleCase(city);
  const stateName = titleCase(state);
  const canonical = `https://techstarsolution.in/${loan}/${state}/${city}`;

  const geoData = getCityGeoData(city);

  // JSON‑LD structured data
  const jsonLd = [
    generateOrganizationLD(),
    generateFinancialServiceLD({ city: cityName, loanType: loanName, url: canonical }),
    generateLocalBusinessLD({
      city: cityName,
      loanType: loanName,
      url: canonical,
      street: geoData.street,
      postalCode: geoData.postalCode,
      latitude: geoData.latitude,
      longitude: geoData.longitude
    }),
    generateBreadcrumbLD([
      { name: 'Home', url: 'https://techstarsolution.in' },
      { name: stateName, url: `https://techstarsolution.in/${state}` },
      { name: cityName, url: `https://techstarsolution.in/${state}/${city}` },
      { name: loanName, url: canonical },
    ]),
    generateFAQLD([
      { question: `What is the interest rate for ${loanName} in ${cityName}?`, answer: `Interest rates for ${loanName} in ${cityName} start from competitive rates offered by leading banks and NBFCs. Contact us at +91 7020646007 for the latest rates.` },
      { question: `What documents are required for ${loanName} in ${cityName}?`, answer: `Standard KYC documents, income proof, address proof, and loan‑specific documents are required. Our team will guide you through the complete process.` },
      { question: `Who is eligible for ${loanName} in ${cityName}?`, answer: `Salaried individuals, self‑employed professionals, and business owners meeting bank eligibility criteria can apply. Contact Techstar Business Solution for a free eligibility check.` },
    ]),
  ];

  if (loan === 'personal-loan') {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Header />
        <PersonalLoanPageContent city={city} />
        <Footer />
        <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
      </>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LocationPageTemplate 
        service={loanName}
        location={cityName}
        serviceSlug={loan}
        locationSlug={citySlug}
      />
    </>
  );
}
