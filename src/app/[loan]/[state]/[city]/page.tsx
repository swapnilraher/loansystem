import React from 'react';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';
import { generateOrganizationLD, generateFinancialServiceLD, generateBreadcrumbLD, generateFAQLD } from '@/lib/structuredData';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan', 'business-loan', 'car-loan', 'loan-against-property'];

/** Helper to title‑case a slug */
function titleCase(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Generate SEO metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = titleCase(params.loan);
  const cityName = titleCase(params.city);
  const stateName = titleCase(params.state);
  const canonical = `https://techstarsolution.in/${params.loan}/${params.state}/${params.city}`;

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

export default function LoanStateCityPage({ params }: { params: { loan: string; state: string; city: string } }) {
  const { loan, state, city } = params;

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

  // JSON‑LD structured data
  const jsonLd = [
    generateOrganizationLD(),
    generateFinancialServiceLD({ city: cityName, loanType: loanName, url: canonical }),
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <Header />
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Best {loanName} in {cityName}, {stateName}</h1>
        <p>
          Apply for {loanName.toLowerCase()} in {cityName}, {stateName} with Techstar Business Solution.
          Get instant approval, competitive interest rates, and minimal documentation.
          Call <a href="tel:+917020646007">+91 7020646007</a> today.
        </p>
        {/* Placeholder for actual loan form component */}
        <StickyMobileCTA targetId="loan-form" label="Apply Now" />
        <Footer />
      </main>
    </>
  );
}
