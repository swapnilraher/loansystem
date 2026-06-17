import React from 'react';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
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

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
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

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
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

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
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

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

// Supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
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

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

// List of supported loan types
const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  };
}

export default function LoanStateCityPage({ params }: { params: { loan: string; state: string; city: string } }) {
  const { loan, state, city } = params;

  // Validate loan type
  if (!validLoans.includes(loan)) notFound();
  // Currently only Maharashtra is supported
  if (state.toLowerCase() !== 'maharashtra') notFound();

  const citySlug = city.toLowerCase();
  const cityList = maharashtraCities.map((c) => c.toLowerCase().replace(/ /g, '-'));
  if (!cityList.includes(citySlug)) notFound();

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  const citySlug = city.toLowerCase();
  const cityList = maharashtraCities.map((c) => c.toLowerCase().replace(/ /g, '-'));
  if (!cityList.includes(citySlug)) notFound();

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  };
}

export default function LoanStateCityPage({ params }: { params: { loan: string; state: string; city: string } }) {
  const { loan, state, city } = params;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  if (state.toLowerCase() !== 'maharashtra') notFound();

  const citySlug = city.toLowerCase();
  const cityList = maharashtraCities.map((c) => c.toLowerCase().replace(/ /g, '-'));
  if (!cityList.includes(citySlug)) notFound();

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  };
}

export default function LoanStateCityPage({
  params,
}: {
  params: { loan: string; state: string; city: string };
}) {
  const { loan, state, city } = params;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  if (state.toLowerCase() !== 'maharashtra') notFound();

  const citySlug = city.toLowerCase();
  if (!maharashtraCities.map((c) => c.toLowerCase().replace(/ /g, '-')).includes(citySlug))
    notFound();

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');
  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  };
}

export default function LoanStateCityPage({
  params,
}: {
  params: { loan: string; state: string; city: string };
}) {
  const { loan, state, city } = params;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  if (state.toLowerCase() !== 'maharashtra') notFound();

  const citySlug = city.toLowerCase();
  if (!maharashtraCities.map((c) => c.toLowerCase().replace(/ /g, '-')).includes(citySlug))
    notFound();

  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');
  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>
        Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.
      </p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

/** Generate metadata for loan‑state‑city pages */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  };
}

export default function StateCityLoanPage({ params }: { params: { loan: string; state: string; city: string } }) {
  const { loan, state, city } = params;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  // Only Maharashtra is supported for now
  if (state.toLowerCase() !== 'maharashtra') notFound();
  const citySlug = city.toLowerCase();
  if (!maharashtraCities.map(c => c.toLowerCase().replace(/ /g, '-')).includes(citySlug)) notFound();
  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {state}</h1>
      <p>Get your {loanName.toLowerCase()} in {cityName}, {state} with instant approval, minimal documentation, and competitive rates.</p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}

import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/sections/Layout';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';
import { maharashtraCities } from '@/lib/maharashtraCities';

/**
 * Generate metadata for loan‑state‑city pages.
 */
export async function generateMetadata({ params }: { params: { loan: string; state: string; city: string } }) {
  const loanName = params.loan.replace(/-/g, ' ');
  const cityName = params.city.replace(/-/g, ' ');
  const stateName = params.state.replace(/-/g, ' ');
  return {
    title: `${loanName} in ${cityName}, ${stateName}`,
    description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
    alternates: { canonical: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}` },
    openGraph: {
      title: `${loanName} in ${cityName}, ${stateName}`,
      description: `Apply for ${loanName} in ${cityName}, ${stateName}. Fast approval, low interest, minimal docs.`,
      url: `https://techstarsolution.in/${params.loan}-${params.state}-${params.city}`,
      type: 'website',
    },
  };
}

export default function CityLoanPage({ params }: { params: { loan: string; state: string; city: string } }) {
  const { loan, state, city } = params;
  const validLoans = ['personal-loan', 'home-loan', 'lap-loan'];
  if (!validLoans.includes(loan)) notFound();
  // Currently only Maharashtra is supported
  if (state.toLowerCase() !== 'maharashtra') notFound();
  const citySlug = city.toLowerCase();
  if (!maharashtraCities.map(c => c.toLowerCase().replace(/ /g, '-')).includes(citySlug)) notFound();
  const loanName = loan.replace(/-/g, ' ');
  const cityName = city.replace(/-/g, ' ');
  const stateName = state.replace(/-/g, ' ');
  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{loanName} in {cityName}, {stateName}</h1>
      <p>Get your {loanName.toLowerCase()} in {cityName}, {stateName} with instant approval, minimal documentation, and competitive rates.</p>
      {/* Placeholder for actual loan form component */}
      <StickyMobileCTA targetId="loan-form" label="Apply Now" />
      <Footer />
    </main>
  );
}
