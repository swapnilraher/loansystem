import React from 'react';
import Link from 'next/link';
import { fetchSeoData } from '@/lib/googleSheets';

/**
 * Displays a list of other loan types available for the same city.
 * Expects the current city as a prop.
 */
export async function RelatedLoans({ city }: { city: string }) {
  const rows = await fetchSeoData();
  const loans = rows.filter((r) => r.city.toLowerCase() === city.toLowerCase());
  if (loans.length === 0) return null;
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Other Loans in {city}</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {loans.map((loan) => (
          <li key={loan.loan_type} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }}>
            <Link href={`/${loan.city}/${loan.loan_type}`}> {loan.loan_type} </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
