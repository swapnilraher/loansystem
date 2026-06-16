import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import matter from 'gray-matter';
import remark from 'remark';
import html from 'remark-html';

// Paths
const CSV_PATH = path.join(process.cwd(), 'data', 'loan_pages.csv');
const CITY_INTEL_PATH = path.join(process.cwd(), 'data', 'city_intel.json');
const VARIATION_POOL_PATH = path.join(process.cwd(), 'data', 'variation_pool.json');

// CSV parser (simple, robust for quoted fields)
function parseCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(cur); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur);
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h] = values[idx] ?? ''; });
    return obj;
  });
}

// Load data once (server‑side)
const csvData = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCsv(csvData);
const cityIntel = JSON.parse(fs.readFileSync(CITY_INTEL_PATH, 'utf8'));
const variationPool = JSON.parse(fs.readFileSync(VARIATION_POOL_PATH, 'utf8'));

function findRow(slugParts: string[]) {
  const urlSlug = slugParts.join('/');
  return rows.find(r => r.URL_Slug === urlSlug && r.Status !== 'draft');
}

/** Random helper */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build a unique, human‑like narrative block */
function buildNarrative(row: any) {
  const cityData = cityIntel[row.City] || {};
  const scenario = randomChoice([
    `A ${row.Loan_Type.toLowerCase()} helped a ${cityData.industry?.split(' ')[0] || 'local'} family in ${row.City} cover unexpected medical bills.`,
    `When a small business in ${row.City} faced a cash‑flow crunch, a ${row.Loan_Type.toLowerCase()} kept the lights on.`,
    `A recent graduate from ${row.City} used a ${row.Loan_Type.toLowerCase()} to move into his first apartment.`
  ]);
  const emotion = randomChoice([
    `The relief of getting the funds instantly was priceless.`,
    `Knowing the loan would be approved within 24 hrs eased a lot of stress.`,
    `The quick disbursal let the borrower focus on what mattered most.`
  ]);
  const localContext = randomChoice([
    `In ${row.City}, most applicants prefer banks like ${cityData.local_banks?.[0] || 'HDFC'}.`,
    `${cityData.industry ? `${cityData.industry} professionals` : 'Residents'} often seek low‑interest options.`,
    `Approval times here average ${cityData.approval_time || '24‑48 hrs'}.`
  ]);
  return `${scenario} ${emotion} ${localContext}`;
}

/** Build expanded FAQ set */
function buildFaq(row: any) {
  const cityData = cityIntel[row.City] || {};
  const cityFaqs = [
    {
      "@type": "Question",
      "name": `Which banks in ${row.City} provide ${row.Loan_Type.toLowerCase()}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `${cityData.local_banks?.join(', ') || 'Local banks'} offer this loan.` }
    },
    {
      "@type": "Question",
      "name": `What is the average approval time for a ${row.Loan_Type.toLowerCase()} in ${row.City}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `Typically ${cityData.approval_time || '24‑48 hrs'}.` }
    },
    {
      "@type": "Question",
      "name": `Are there special interest rates for ${cityData.industry?.split(' ')[0] || 'residents'} in ${row.City}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `We often run promos for ${cityData.industry?.toLowerCase() || 'local'} professionals.` }
    }
  ];

  const loanFaqs = [
    {
      "@type": "Question",
      "name": `How much can I borrow as a ${row.Loan_Type.toLowerCase()}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `Up to ₹50 Lakhs depending on income and credit profile.` }
    },
    {
      "@type": "Question",
      "name": `What documents are needed for a ${row.Loan_Type.toLowerCase()} in ${row.City}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `PAN, Aadhaar, income proof, address proof.` }
    },
    {
      "@type": "Question",
      "name": `Can I get a ${row.Loan_Type.toLowerCase()} if I am self‑employed in ${row.City}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `Yes, with GST returns and bank statements.` }
    }
  ];

  const intentFaqs = [
    {
      "@type": "Question",
      "name": `Why choose a ${row.Loan_Type.toLowerCase()} over a credit card?`,
      "acceptedAnswer": { "@type": "Answer", "text": `Lower interest rates and longer tenure.` }
    },
    {
      "@type": "Question",
      "name": `Is pre‑payment allowed for a ${row.Loan_Type.toLowerCase()}?`,
      "acceptedAnswer": { "@type": "Answer", "text": `Yes, with no penalty in most cases.` }
    }
  ];

  return [...cityFaqs, ...loanFaqs, ...intentFaqs];
}

/** Title rotation logic – simple random pick from up to 3 variants */
function generateTitle(row: any) {
  const base = `${row.Loan_Type} in ${row.City}`;
  const variants = [
    `${base} | Instant Approval & Low Interest`,
    `${base} | Fast Disbursal & Low EMI`,
    `${base} | Quick Funding – Apply Today`
  ];
  return randomChoice(variants);
}

/** Meta description rotation */
function generateMeta(row: any) {
  const cityData = cityIntel[row.City] || {};
  const base = `Apply for ${row.Loan_Type} in ${row.City}.`; 
  const variants = [
    `${base} ${cityData.approval_time ? `Average approval time ${cityData.approval_time}.` : ''} Low interest, minimal docs.`,
    `${base} Get funds within 24‑48 hrs. Trusted by ${cityData.local_banks?.slice(0,2).join(' and ') || 'local banks'}.`,
    `${base} Fast approval for ${cityData.industry?.toLowerCase() || 'residents'}. Click to apply now.`
  ];
  return randomChoice(variants).trim();
}

/** Robots meta based on CTR (expects a CTR column in CSV) */
function robotsMeta(row: any) {
  const ctr = parseFloat(row.CTR ?? '0');
  if (ctr > 0 && ctr >= 1.5) {
    return { index: true, follow: true };
  }
  return { index: false, follow: true };
}

export async function generateMetadata({ params }: { params: { slug: string[] } }) {
  const row = findRow(params.slug);
  if (!row) return {};
  const title = generateTitle(row);
  const description = generateMeta(row);
  const robots = robotsMeta(row);
  return {
    title,
    description,
    robots,
    openGraph: {
      title,
      description,
      url: `https://example.com/${row.URL_Slug}`
    },
    alternates: { canonical: `https://example.com/${row.URL_Slug}` }
  };
}

export default async function LoanPage({ params }: { params: { slug: string[] } }) {
  const row = findRow(params.slug);
  if (!row) { notFound(); return null; }

  // Semantic variations
  const intro = randomChoice(variationPool.intro_variants);
  const benefit = randomChoice(variationPool.benefit_variants);
  const cta = randomChoice(variationPool.cta_variants);

  // Narrative block (human‑like story)
  const narrative = buildNarrative(row);

  const markdown = `
${intro.replace('{Loan_Type}', row.Loan_Type).replace('{City}', row.City)}

## Benefits
${benefit.replace('{Loan_Type}', row.Loan_Type)}

${narrative}

## How to Apply
${cta.replace('{Loan_Type}', row.Loan_Type).replace('{City}', row.City)}
`;

  const processed = await remark().use(html).process(markdown);
  const contentHtml = processed.toString();

  const loanTypes = ['personal-loan', 'home-loan', 'business-loan', 'lap-loan'];
  const state = row.State.toLowerCase();
  const citySlug = row.City.toLowerCase();

  const internalLinks = (
    <ul style={{ marginTop: '2rem' }}>
      {loanTypes.map(type => (
        <li key={type}>
          <Link href={`/${type}/${state}/${citySlug}`}>
            {type.replace('-', ' ')} {row.City}
          </Link>
        </li>
      ))}
      <li>
        <Link href={`/personal-loan/${state}`}>Personal Loan {row.State} hub</Link>
      </li>
    </ul>
  );

  // Enhanced CTA for high‑CTR pages (CTR >= 2.0)
  const highCtr = parseFloat(row.CTR ?? '0') >= 2.0;
  const enhancedCta = highCtr ? (
    <section style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f8ff', borderRadius: '8px', textAlign: 'center' }}>
      <h2 style={{ margin: '0 0 0.5rem' }}>Ready to secure your {row.Loan_Type}?</h2>
      <p style={{ margin: '0 0 1rem' }}>Fast approval in {row.City}, trusted by leading banks.</p>
      <Link href={`/apply/${row.URL_Slug}`}
            style={{
              display: 'inline-block',
              background: '#0066ff',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}>
        Apply Now
      </Link>
    </section>
  ) : null;

  // Schema – enriched with expanded FAQs
  const financialSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": `${row.Loan_Type} in ${row.City}`,
    "serviceType": row.Loan_Type,
    "areaServed": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": row.State,
        "addressLocality": row.City
      }
    },
    "provider": { "@type": "Organization", "name": "ABC Finance", "url": "https://example.com" },
    "url": `https://example.com/${row.URL_Slug}`
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": buildFaq(row)
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
      { "@type": "ListItem", "position": 2, "name": row.Loan_Type, "item": `https://example.com/${row.Loan_Type.toLowerCase().replace(' ', '-')}` },
      { "@type": "ListItem", "position": 3, "name": row.State, "item": `https://example.com/${row.Loan_Type.toLowerCase().replace(' ', '-')}/${state}` },
      { "@type": "ListItem", "position": 4, "name": row.City, "item": `https://example.com/${row.URL_Slug}` }
    ]
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>{row.H1}</h1>
      <article dangerouslySetInnerHTML={{ __html: contentHtml }} />
      {internalLinks}
      {enhancedCta}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(financialSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </main>
  );
}

// ISR – revalidate daily
export const revalidate = 86400;
