import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/sections/Header';
import Footer from '@/components/sections/Footer';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { SEO } from '@/components/SEO';
import { fetchSeoData } from '@/lib/googleSheets';
import { generateOrganizationLD, generateFinancialServiceLD, generateBreadcrumbLD, generateFAQLD } from '@/lib/structuredData';

/** Generate metadata for loan‑state‑city pages using Google Sheet data */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const rows = await fetchSeoData();
  const row = rows.find(
    (r) =>
      r.loan_type.toLowerCase().replace(/ /g, '-') === params.loan &&
      r.state.toLowerCase() === params.state &&
      r.city.toLowerCase().replace(/ /g, '-') === params.city
  );
  if (!row) return {};
  const canonical = `https://techstarsolution.in/${params.loan}/${params.state}/${params.city}`;
  return {
    title: row.meta_title || `${row.loan_type} in ${row.city}, ${row.state}`,
    description: row.meta_description || `Apply for ${row.loan_type} in ${row.city}, ${row.state}. Fast approval, low interest, minimal docs.`,
    keywords: row.keywords,
    alternates: { canonical },
    openGraph: {
      title: row.meta_title || `${row.loan_type} in ${row.city}, ${row.state}`,
      description: row.meta_description || `Apply for ${row.loan_type} in ${row.city}, ${row.state}. Fast approval, low interest, minimal docs.`,
      url: canonical,
      images: [{ url: "https://techstarsolution.in/img/logo.jpeg" }],
    },
    twitter: {
      title: row.meta_title || `${row.loan_type} in ${row.city}, ${row.state}`,
      description: row.meta_description || `Apply for ${row.loan_type} in ${row.city}, ${row.state}. Fast approval, low interest, minimal docs.`,
      card: "summary_large_image",
      images: ["https://techstarsolution.in/img/logo.jpeg"],
    },
  };
}

export default async function LoanStateCityPage({ params }: { params: { loan: string; state: string; city: string } }) {
  const rows = await fetchSeoData();
  const row = rows.find(
    (r) =>
      r.loan_type.toLowerCase().replace(/ /g, '-') === params.loan &&
      r.state.toLowerCase() === params.state &&
      r.city.toLowerCase().replace(/ /g, '-') === params.city
  );
  if (!row) notFound();

  const canonical = `https://techstarsolution.in/${params.loan}/${params.state}/${params.city}`;
  const jsonLd = [
    generateOrganizationLD(),
    generateFinancialServiceLD({ city: row.city, loanType: row.loan_type, url: canonical }),
    generateBreadcrumbLD([
      { name: "Home", url: "https://techstarsolution.in" },
      { name: row.state, url: `https://techstarsolution.in/${params.state}` },
      { name: row.city, url: `https://techstarsolution.in/${params.state}/${params.city}` },
      { name: row.loan_type, url: canonical },
    ]),
    generateFAQLD([
      { question: `What is the interest rate for ${row.loan_type} in ${row.city}?`, answer: `${row.interest_rate}% (as of ${row.last_updated})` },
      { question: `What documents are required for ${row.loan_type} in ${row.city}?`, answer: `Standard KYC, income proof, address proof, and loan‑specific documents.` },
      { question: `Who is eligible for ${row.loan_type} in ${row.city}?`, answer: `Salaried, self‑employed, and professionals meeting bank criteria.` },
    ]),
  ];

  return (
    <>
      <SEO
        title={row.meta_title || `${row.loan_type} in ${row.city}, ${row.state}`}
        description={row.meta_description || `Apply for ${row.loan_type} in ${row.city}, ${row.state}. Fast approval, low interest, minimal docs.`}
        keywords={row.keywords}
        canonical={canonical}
        ogImage="https://techstarsolution.in/img/logo.jpeg"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <Header />
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{row.loan_type} in {row.city}, {row.state}</h1>
        <p>{row.meta_description}</p>
        {/* Add more loan‑specific content here */}
        <StickyMobileCTA targetId="loan-form" label="Apply Now" />
        <Footer />
      </main>
    </>
  );
}
