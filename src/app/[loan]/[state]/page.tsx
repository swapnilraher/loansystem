import React from 'react';
import { notFound } from 'next/navigation';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';

import { maharashtraCities } from '@/lib/maharashtraCities';

/**
 * Generate metadata for loan‑city pages (where params.state acts as the city).
 */
export async function generateMetadata({ params }: { params: { loan: string; state: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}`,
    description: `Apply for ${loanName} in ${cityName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}` },
    openGraph: {
      title: `${loanName} in ${cityName}`,
      description: `Apply for ${loanName} in ${cityName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}`,
      type: 'website',
    },
  };
}

export default function CityLoanPage({ params }: { params: { loan: string; state: string } }) {
  const { loan, state } = params;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  
  const citySlug = state.toLowerCase();
  if (!maharashtraCities.map(c => c.toLowerCase().replace(/ /g, '-')).includes(citySlug)) notFound();
  
  const loanName = loan.replace(/-/g, ' ');
  const cityName = state.replace(/-/g, ' ');
  return (
    <>
      <PersonalLoanPageContent />
    </>
  );
}
