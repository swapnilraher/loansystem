import React from 'react';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
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
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}</h1>
      <p>Get your {loanName.toLowerCase()} in {cityName} with instant approval, minimal documentation, and competitive rates.</p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}
