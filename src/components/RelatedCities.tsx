import React from 'react';
import Link from 'next/link';
import { maharashtraCities } from '@/lib/maharashtraCities';

/**
 * Displays a grid of nearby cities for the same loan type.
 */
export function RelatedCities({ loanType, currentCity }: { loanType: string; currentCity: string }) {
  const currentSlug = currentCity.toLowerCase().replace(/ /g, '-');
  const otherCities = maharashtraCities
    .map((c) => ({ name: c, slug: c.toLowerCase().replace(/ /g, '-') }))
    .filter((c) => c.slug !== currentSlug)
    .slice(0, 12); // Show max 12 nearby cities

  if (otherCities.length === 0) return null;

  const loanLabel = loanType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{loanLabel} in Other Cities</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {otherCities.map((city) => (
          <li key={city.slug} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.75rem' }}>
            <Link href={`/${loanType}/maharashtra/${city.slug}`}>{loanLabel} in {city.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
