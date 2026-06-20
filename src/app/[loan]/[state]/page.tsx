import React from 'react';
import { notFound } from 'next/navigation';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import LocationPageTemplate from '@/components/sections/LocationPageTemplate';

import { maharashtraCities } from '@/lib/maharashtraCities';

import fs from 'fs';
import path from 'path';

/** Helper to title‑case a slug */
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Generate metadata for loan‑city pages (where params.state acts as the city).
 */
export async function generateMetadata({ params }: { params: Promise<{ loan: string; state: string }> }) {
  const resolvedParams = await params;
  const loanName = titleCase(resolvedParams.loan);
  const cityName = titleCase(resolvedParams.state);

  const staticPath = path.join(process.cwd(), 'src', 'app', `${resolvedParams.loan}-${resolvedParams.state}`);
  const hasStaticPage = fs.existsSync(staticPath);
  const canonical = hasStaticPage
    ? `https://techstarsolution.in/${resolvedParams.loan}-${resolvedParams.state}`
    : `https://techstarsolution.in/${resolvedParams.loan}/${resolvedParams.state}`;

  return {
    title: `${loanName} in ${cityName} – Lowest Rates & Fast Disbursal | Techstar`,
    description: `Apply for ${loanName.toLowerCase()} in ${cityName}. Fast approval, low interest rates, minimal documentation.`,
    alternates: { canonical },
    openGraph: {
      title: `${loanName} in ${cityName}`,
      description: `Apply for ${loanName} in ${cityName}. Fast approval, low interest, minimal docs.`,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function CityLoanPage({ params }: { params: Promise<{ loan: string; state: string }> }) {
  const resolvedParams = await params;
  const { loan, state } = resolvedParams;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  
  const citySlug = state.toLowerCase();
  if (!maharashtraCities.map(c => c.toLowerCase().replace(/ /g, '-')).includes(citySlug)) notFound();
  
  if (loan === 'personal-loan') {
    return (
      <main>
        <Header />
        <PersonalLoanPageContent city={state} />
        <Footer />
        <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
      </main>
    );
  }

  const loanName = titleCase(loan);
  const cityName = titleCase(state);

  return (
    <LocationPageTemplate 
      service={loanName}
      location={cityName}
      serviceSlug={loan}
      locationSlug={citySlug}
    />
  );
}
