import React from 'react';
import Link from 'next/link';
import { maharashtraCities } from '@/lib/maharashtraCities';

const loanTypes = [
  { slug: 'personal-loan', label: 'Personal Loan' },
  { slug: 'home-loan', label: 'Home Loan' },
  { slug: 'lap-loan', label: 'Loan Against Property' },
  { slug: 'business-loan', label: 'Business Loan' },
  { slug: 'car-loan', label: 'Car Loan' },
  { slug: 'loan-against-property', label: 'Loan Against Property' },
];

/**
 * Displays a list of other loan types available for the same city.
 */
export function RelatedLoans({ city, currentLoan }: { city: string; currentLoan: string }) {
  const otherLoans = loanTypes.filter((lt) => lt.slug !== currentLoan);
  if (otherLoans.length === 0) return null;

  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Other Loans in {cityName}</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {otherLoans.map((loan) => (
          <li key={loan.slug} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.75rem' }}>
            <Link href={`/${loan.slug}/maharashtra/${city}`}>{loan.label} in {cityName}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
