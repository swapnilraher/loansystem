import React from 'react';
import Link from 'next/link';
import { maharashtraCities } from '@/lib/maharashtraCities';

export const metadata = {
  title: 'Personal Loan – All Cities in Maharashtra',
  description: 'Select your city to view personal loan details and apply instantly.',
};

export default function PersonalLoanCities() {
  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Personal Loan – All Cities</h1>
      <p style={{ marginBottom: '1.5rem' }}>Choose your city to see personalized personal loan information.</p>
      <style>{`
        .city-link {
          display: block;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #0066ff, #00aaff);
          color: #fff;
          border-radius: 8px;
          text-decoration: none;
          text-align: center;
          transition: transform 0.2s;
        }
        .city-link:hover {
          transform: scale(1.03);
        }
      `}</style>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {maharashtraCities.map(city => (
          <li key={city}>
            <Link
              href={`/personal-loan-${city.toLowerCase().replace(/ /g, '-')}`}
              className="city-link"
            >
              {city}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
