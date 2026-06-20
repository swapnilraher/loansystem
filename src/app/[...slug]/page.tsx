import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ─── Paths ───────────────────────────────────────────────────────────────────
const CSV_PATH          = path.join(process.cwd(), 'data', 'loan_pages.csv');
const CITY_INTEL_PATH   = path.join(process.cwd(), 'data', 'city_intel.json');
const VARIATION_PATH    = path.join(process.cwd(), 'data', 'variation_pool.json');

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCsv(csv: string) {
  const lines  = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { values.push(cur); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur);
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h.trim()] = (values[i] ?? '').trim(); });
    return obj;
  });
}

// ─── Load data (server-side module scope) ────────────────────────────────────
const rows        = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
const cityIntel   = JSON.parse(fs.readFileSync(CITY_INTEL_PATH, 'utf8')) as Record<string, any>;
const varPool     = JSON.parse(fs.readFileSync(VARIATION_PATH,  'utf8')) as {
  intro_variants:   string[];
  benefit_variants: string[];
  cta_variants:     string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function findRow(slugParts?: string[]) {
  if (!slugParts) return undefined;
  const slug = slugParts.join('/');
  return rows.find(r => r.URL_Slug === slug && r.Status !== 'draft');
}


function buildNarrative(row: Record<string, string>) {
  const ci = cityIntel[row.City] || {};
  const scenario = pick([
    `A ${row.Loan_Type.toLowerCase()} helped a ${(ci.industry?.split(' ')[0]) || 'local'} family in ${row.City} cover unexpected expenses.`,
    `When a small business in ${row.City} faced a cash-flow crunch, a ${row.Loan_Type.toLowerCase()} kept operations running.`,
    `A first-time borrower from ${row.City} used a ${row.Loan_Type.toLowerCase()} to achieve a major financial milestone.`,
  ]);
  const emotion = pick([
    `The relief of instant approval was priceless.`,
    `Knowing funds would arrive within 24 hrs made all the difference.`,
    `Quick disbursal let the borrower focus on what mattered most.`,
  ]);
  const local = pick([
    ci.local_banks?.length ? `Most applicants in ${row.City} prefer ${ci.local_banks[0]}.` : `Local lenders in ${row.City} offer competitive terms.`,
    ci.industry ? `${ci.industry} professionals often lead in loan uptake.` : `${row.City} residents trust us for fast processing.`,
    `Approval times in ${row.City} average ${ci.approval_time || '24–48 hrs'}.`,
  ]);
  return `${scenario} ${emotion} ${local}`;
}

function buildFaq(row: Record<string, string>) {
  const ci = cityIntel[row.City] || {};
  return [
    { q: `Which banks in ${row.City} offer ${row.Loan_Type.toLowerCase()}?`, a: ci.local_banks?.join(', ') || 'HDFC, ICICI, Axis, SBI.' },
    { q: `How fast is ${row.Loan_Type.toLowerCase()} approval in ${row.City}?`, a: `Typically ${ci.approval_time || '24–48 hrs'}.` },
    { q: `Any special rates for ${(ci.industry?.split(' ')[0]) || 'local'} professionals in ${row.City}?`, a: `Yes – we run regular promotions for ${ci.industry?.toLowerCase() || 'local'} borrowers.` },
    { q: `How much can I borrow as a ${row.Loan_Type.toLowerCase()}?`, a: `Up to ₹50 Lakhs for salaried applicants.` },
    { q: `What documents are needed for ${row.Loan_Type.toLowerCase()} in ${row.City}?`, a: `PAN, Aadhaar, 3-month salary slips, 6-month bank statements.` },
    { q: `Can self-employed borrowers in ${row.City} apply?`, a: `Yes – with GST returns and 2-year ITR.` },
    { q: `Why choose ${row.Loan_Type.toLowerCase()} over a credit card?`, a: `Lower interest rates, longer tenure, and structured EMI.` },
    { q: `Is pre-payment allowed?`, a: `Yes, with no penalty in most cases.` },
  ];
}

function robotsMeta(row: Record<string, string>) {
  const ctr = parseFloat(row.CTR ?? '0');
  return ctr >= 1.5
    ? { index: true,  follow: true }
    : { index: false, follow: true };
}

function generateTitle(row: Record<string, string>) {
  return pick([
    `${row.Loan_Type} in ${row.City} | Instant Approval & Low Interest`,
    `${row.Loan_Type} in ${row.City} | Fast Disbursal & Low EMI`,
    `${row.Loan_Type} in ${row.City} | Quick Funding – Apply Today`,
  ]);
}

function generateMeta(row: Record<string, string>) {
  const ci = cityIntel[row.City] || {};
  return pick([
    `Apply for ${row.Loan_Type} in ${row.City}. Low interest, minimal docs. Avg approval ${ci.approval_time || '24–48 hrs'}.`,
    `Get ${row.Loan_Type} in ${row.City} within 24 hrs. Trusted by ${ci.local_banks?.slice(0,2).join(' & ') || 'local banks'}.`,
    `${row.Loan_Type} in ${row.City} for ${ci.industry?.toLowerCase() || 'residents'}. Fast, paperless, expert DSA support.`,
  ]).trim();
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const row = findRow(resolvedParams.slug);
  if (!row) return {};
  return {
    title:       generateTitle(row),
    description: generateMeta(row),
    // Always index,follow — let Google crawl first, apply CTR pruning later via GSC
    robots: { index: true, follow: true },
    openGraph: {
      title:       generateTitle(row),
      description: generateMeta(row),
      url:         `https://techstarsolution.in/${row.URL_Slug}`,
    },
    alternates: { canonical: `https://techstarsolution.in/${row.URL_Slug}` },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function LoanPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const row = findRow(resolvedParams.slug);
  if (!row) { notFound(); return null; }

  const ci      = cityIntel[row.City] || {};
  const intro   = pick(varPool.intro_variants)  .replace('{Loan_Type}', row.Loan_Type).replace('{City}', row.City);
  const benefit = pick(varPool.benefit_variants).replace('{Loan_Type}', row.Loan_Type);
  const cta     = pick(varPool.cta_variants)    .replace('{Loan_Type}', row.Loan_Type).replace('{City}', row.City);
  const story   = buildNarrative(row);
  const faqs    = buildFaq(row);
  const highCtr = parseFloat(row.CTR ?? '0') >= 2.0;

  const loanTypes = ['personal-loan', 'home-loan', 'business-loan', 'lap-loan'];
  const state     = row.State.toLowerCase();
  const citySlug  = row.City.toLowerCase().replace(/ /g, '-');

  // JSON-LD schemas
  const financialSchema = {
    '@context': 'https://schema.org', '@type': 'FinancialService',
    name: `${row.Loan_Type} in ${row.City}`, serviceType: row.Loan_Type,
    areaServed: { '@type': 'Place', address: { '@type': 'PostalAddress', addressRegion: row.State, addressLocality: row.City } },
    provider: { '@type': 'Organization', name: 'Techstar Money Solution', url: 'https://techstarsolution.in' },
    url: `https://techstarsolution.in/${row.URL_Slug}`,
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://techstarsolution.in/' },
      { '@type': 'ListItem', position: 2, name: row.Loan_Type, item: `https://techstarsolution.in/${row.Loan_Type.toLowerCase().replace(/ /g, '-')}` },
      { '@type': 'ListItem', position: 3, name: row.State,    item: `https://techstarsolution.in/${row.Loan_Type.toLowerCase().replace(/ /g, '-')}/${state}` },
      { '@type': 'ListItem', position: 4, name: row.City,     item: `https://techstarsolution.in/${row.URL_Slug}` },
    ],
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      {/* Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(financialSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* H1 */}
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{row.H1}</h1>

      {/* Intro */}
      <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{intro}</p>

      {/* Benefits */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Benefits</h2>
      <p style={{ marginBottom: '1.5rem' }}>{benefit}</p>

      {/* Local story */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Real Story from {row.City}</h2>
      <p style={{ fontStyle: 'italic', background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{story}</p>

      {/* City Trust Layer */}
      {ci.local_banks && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Local Trust Layer – {row.City}</h2>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li><strong>Popular Banks:</strong> {ci.local_banks.join(', ')}</li>
            {ci.industry   && <li><strong>Common Income Profile:</strong> {ci.industry}</li>}
            {ci.approval_time && <li><strong>Avg Approval Time:</strong> {ci.approval_time}</li>}
            {ci.fast_approval_tips && <li><strong>Tip:</strong> {ci.fast_approval_tips}</li>}
          </ul>
        </section>
      )}

      {/* How to Apply */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>How to Apply</h2>
      <p style={{ marginBottom: '1.5rem' }}>{cta}</p>

      {/* High-CTR CTA Banner */}
      {highCtr && (
        <section style={{ background: 'linear-gradient(135deg,#0066ff,#00aaff)', color: '#fff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>Ready to secure your {row.Loan_Type}?</h2>
          <p style={{ margin: '0 0 1rem', opacity: 0.9 }}>Fast approval in {row.City} · Trusted by thousands · Minimal docs</p>
          <Link href={`/apply/${row.URL_Slug}`} style={{ background: '#fff', color: '#0066ff', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>
            Apply Now →
          </Link>
        </section>
      )}

      {/* FAQ */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
      {faqs.map((f, i) => (
        <details key={i} style={{ marginBottom: '0.75rem', border: '1px solid #eee', borderRadius: '6px', padding: '0.75rem' }}>
          <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{f.q}</summary>
          <p style={{ margin: '0.5rem 0 0', color: '#555' }}>{f.a}</p>
        </details>
      ))}

      {/* Internal Links */}
      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Explore More Loans in {row.City}</h2>
        <ul style={{ paddingLeft: '1.25rem' }}>
          {loanTypes.map(type => (
            <li key={type}>
              <Link href={`/${type}/${state}/${citySlug}`}>{type.replace(/-/g, ' ')} in {row.City}</Link>
            </li>
          ))}
          <li><Link href={`/personal-loan/${state}`}>All Personal Loans in {row.State}</Link></li>
        </ul>
      </section>
    </main>
  );
}

// ISR – revalidate daily
export const revalidate = 86400;
