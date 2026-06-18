// scripts/generate-sitemaps.ts
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { fetchSeoData } from '../src/lib/googleSheets.ts';

// Helper to build a sitemap entry string
function sitemapUrl(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function generate() {
  const rows = await fetchSeoData();
  const base = 'https://techstarsolution.in';
  const today = new Date().toISOString().split('T')[0];

  // --- static pages (hard‑coded list) ---
  const staticUrls = [
    '/',
    '/about',
    '/privacy',
    '/terms',
    '/partner',
    '/blog',
  ];
  const staticEntries = staticUrls.map((p) => sitemapUrl(`${base}${p}`, today, 'weekly', '0.8')).join('\n');

  // --- city landing pages (unique city list) ---
  const cities = Array.from(new Set(rows.map((r) => r.city.toLowerCase())));
  const cityEntries = cities.map((c) => sitemapUrl(`${base}/${c}`, today, 'weekly', '0.7')).join('\n');

  // --- loan‑type landing pages (unique loan types) ---
  const loanTypes = Array.from(new Set(rows.map((r) => r.loan_type.toLowerCase())));
  const loanEntries = loanTypes.map((lt) => sitemapUrl(`${base}/${lt}`, today, 'weekly', '0.7')).join('\n');

  // --- dynamic city‑loan pages ---
  const dynamicEntries = rows
    .map((r) => {
      const loc = `${base}/${r.city.toLowerCase()}/${r.loan_type.toLowerCase()}`;
      const lastmod = r.last_updated?.split('T')[0] || today;
      return sitemapUrl(loc, lastmod, 'daily', '0.9');
    })
    .join('\n');

  // Write individual sitemap files
  const outDir = resolve('public');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/sitemap-static.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries}\n</urlset>`);
  writeFileSync(`${outDir}/sitemap-city.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n${cityEntries}\n</urlset>`);
  writeFileSync(`${outDir}/sitemap-loan.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n${loanEntries}\n</urlset>`);
  writeFileSync(`${outDir}/sitemap-dynamic.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n${dynamicEntries}\n</urlset>`);

  // Master sitemap index
  const indexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <sitemap><loc>${base}/sitemap-static.xml</loc></sitemap>\n` +
    `  <sitemap><loc>${base}/sitemap-city.xml</loc></sitemap>\n` +
    `  <sitemap><loc>${base}/sitemap-loan.xml</loc></sitemap>\n` +
    `  <sitemap><loc>${base}/sitemap-dynamic.xml</loc></sitemap>\n` +
    `</sitemapindex>`;
  writeFileSync(`${outDir}/sitemap.xml`, indexContent);

  console.log('Sitemaps generated');
}

generate().catch((e) => {
  console.error('Error generating sitemaps:', e);
  process.exit(1);
});
