import React from 'react';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';

/** Generate SEO metadata for /personal-loan/[city] pages */
export async function generateMetadata({ params }: { params: { city?: string } }) {
  const citySlug = params.city ?? '';
  const cityName = citySlug ? citySlug.replace(/-/g, ' ') : '';
  const loanName = 'Personal Loan';
  const title = citySlug ? `${loanName} in ${cityName}` : loanName;
  const description = citySlug
    ? `Apply for ${loanName.toLowerCase()} in ${cityName}. Fast approval, low interest, minimal docs.`
    : `Apply for ${loanName.toLowerCase()}. Fast approval, low interest, minimal docs.`;
  const canonical = citySlug
    ? `https://techstarsolution.in/personal-loan-${citySlug}`
    : `https://techstarsolution.in/personal-loan`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  };
}

export default function CityPage({ params }: { params: { city?: string } }) {
  const citySlug = params.city ?? '';
  // Render the same content for any city slug; SEO is handled above
  return (
    <main className="pl-page">
      <Header />
      <PersonalLoanPageContent city={citySlug} />
      <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}
