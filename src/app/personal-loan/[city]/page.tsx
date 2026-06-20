import React from 'react';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';

import fs from 'fs';
import path from 'path';

/** Generate SEO metadata for /personal-loan/[city] pages */
export async function generateMetadata({ params }: { params: Promise<{ city?: string }> }) {
  const resolvedParams = await params;
  const citySlug = resolvedParams.city ?? '';
  const cityName = citySlug
    ? citySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';
  const loanName = 'Personal Loan';
  const title = citySlug ? `${loanName} in ${cityName} – Instant Approval | Techstar` : loanName;
  const description = citySlug
    ? `Apply for ${loanName.toLowerCase()} in ${cityName}. Fast approval, low interest, minimal docs.`
    : `Apply for ${loanName.toLowerCase()}. Fast approval, low interest, minimal docs.`;

  let canonical = `https://techstarsolution.in/personal-loan`;
  if (citySlug) {
    const staticPath = path.join(process.cwd(), 'src', 'app', `personal-loan-${citySlug}`);
    if (fs.existsSync(staticPath)) {
      canonical = `https://techstarsolution.in/personal-loan-${citySlug}`;
    } else {
      canonical = `https://techstarsolution.in/personal-loan/${citySlug}`;
    }
  }

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

export default async function CityPage({ params }: { params: Promise<{ city?: string }> }) {
  const resolvedParams = await params;
  const citySlug = resolvedParams.city ?? '';
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
