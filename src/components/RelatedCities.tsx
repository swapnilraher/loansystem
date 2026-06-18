import React from 'react';
import Link from 'next/link';
import { fetchSeoData } from '@/lib/googleSheets';

/**
 * Displays a list of nearby cities for the same loan type.
 * Simple static neighbor mapping could be expanded later.
 */
export async function RelatedCities({ loanType, currentCity }: { loanType: string; currentCity: string }) {
  const rows = await fetchSeoData();
  const cities = rows
    .filter((r) => r.loan_type.toLowerCase() === loanType.toLowerCase() && r.city.toLowerCase() !== currentCity.toLowerCase())
    .map((r) => r.city);
  if (cities.length === 0) return null;
  // Remove duplicates
  const uniqueCities = Array.from(new Set(cities));
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Other Cities offering {loanType}</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {uniqueCities.map((city) => (
          <li key={city} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }}>
            <Link href={`/${city}/${loanType}`}> {city} </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
