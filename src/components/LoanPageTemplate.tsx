import React from 'react';
import Head from 'next/head';

type LoanPageTemplateProps = {
  loan: string;
  state: string;
  city: string;
};

export default function LoanPageTemplate({ loan, state, city }: LoanPageTemplateProps) {
  const title = `${loan.replace('-', ' ')} in ${city}, ${state}`;
  const description = `Information and application for ${loan.replace('-', ' ')} in ${city}, ${state}.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p>{description}</p>
        {/* Add your loan specific UI components here */}
      </main>
    </>
  );
}
