// scripts/generate-sitemaps.js
// Standalone script – no Google Sheets dependency.
// Scans src/app folders to discover all routable pages and generates:
//   public/sitemap-static.xml
//   public/sitemap-city.xml
//   public/sitemap-loan.xml
//   public/sitemap-dynamic.xml
//   public/sitemap.xml  (master index)
//   public/robots.txt

import { writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const BASE = 'https://techstarsolution.in';
const TODAY = new Date().toISOString().split('T')[0]; // e.g. 2026-06-18
const APP_DIR = resolve('src', 'app');
const OUT_DIR = resolve('public');

// ─── helpers ───
function entry(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}
function wrap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}
function hasPage(dir) {
  return existsSync(join(dir, 'page.tsx')) || existsSync(join(dir, 'page.jsx'));
}
function dirs(parent) {
  if (!existsSync(parent)) return [];
  return readdirSync(parent).filter((d) => {
    const p = join(parent, d);
    return statSync(p).isDirectory() && !d.startsWith('[') && !d.startsWith('.');
  });
}

// ─── 1. Static pages ───
const staticPaths = ['/', '/about', '/partner', '/privacy', '/terms', '/blog', '/become-dsa-partner', '/cibil-score'];
const staticEntries = staticPaths.map((p) => entry(`${BASE}${p}`, TODAY, 'weekly', p === '/' ? '1.0' : '0.8')).join('\n');

// ─── 2. Loan-type landing pages ───
const loanTypes = ['personal-loan', 'home-loan', 'lap-loan', 'business-loan', 'car-loan', 'loan-against-property'];
const loanEntries = loanTypes
  .filter((lt) => existsSync(join(APP_DIR, lt)))
  .map((lt) => entry(`${BASE}/${lt}`, TODAY, 'weekly', '0.9'))
  .join('\n');

// ─── 3. City-specific static pages (e.g. personal-loan-pune, home-loan-chhatrapati-sambhajianagar) ───
const allTopLevel = dirs(APP_DIR);
const cityStaticDirs = allTopLevel.filter((d) => {
  // Matches patterns like "personal-loan-pune", "business-loan-chhatrapati-sambhajianagar", etc.
  return loanTypes.some((lt) => d.startsWith(lt + '-')) || d.startsWith('loan-agent-') || d.startsWith('dsa-loan-');
});
const cityStaticEntries = cityStaticDirs
  .filter((d) => hasPage(join(APP_DIR, d)))
  .map((d) => entry(`${BASE}/${d}`, TODAY, 'weekly', '0.8'))
  .join('\n');

// ─── 4. Dynamic loan/state/city pages (e.g. personal-loan/maharashtra/pune) ───
const dynamicEntries = [];
loanTypes.forEach((loan) => {
  const loanPath = join(APP_DIR, loan);
  if (!existsSync(loanPath)) return;
  const states = dirs(loanPath);
  states.forEach((state) => {
    const statePath = join(loanPath, state);
    const cities = dirs(statePath);
    cities.forEach((city) => {
      const cityPath = join(statePath, city);
      if (hasPage(cityPath)) {
        dynamicEntries.push(entry(`${BASE}/${loan}/${state}/${city}`, TODAY, 'weekly', '0.8'));
      }
    });
  });
});

// Also check the [loan] dynamic route cities list
// These are generated dynamically at runtime, so we use maharashtraCities to enumerate them
const maharashtraCities = [
  'Achalpur', 'Ahmednagar', 'Ajra', 'Akola', 'Alibag', 'Ambarnath', 'Ambegaon', 'Amravati',
  'Atpadi', 'Aurangabad', 'Baramati', 'Barshi', 'Beed', 'Bhiwandi', 'Bhor', 'Bhudargad',
  'Bhusawal', 'Boisar', 'Chandgad', 'Chandrapur', 'Dahanu', 'Daund', 'Dhule', 'Gadhinglaj',
  'Gaganbawada', 'Gondia', 'Hatkanangle', 'Haveli', 'Hinganghat', 'Ichalkaranji', 'Indapur',
  'Jalgaon', 'Jalna', 'Jat', 'Jawhar', 'Junnar', 'Kadegaon', 'Kagal', 'Kalyan-Dombivli',
  'Karad', 'Karjat', 'Karvir', 'Kavathemahankal', 'Khalapur', 'Khandala', 'Khandwa',
  'Khanapur', 'Khatav', 'Khed', 'Kolhapur', 'Koregaon', 'Latur', 'Mahabaleshwar', 'Mahad',
  'Malegaon', 'Man', 'Mangaon', 'Maval', 'Mhasla', 'Mira-Bhayandar', 'Miraj', 'Mokhada',
  'Mulshi', 'Mumbai', 'Murud', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Navi Mumbai',
  'Osmanabad', 'Palghar', 'Palus', 'Panhala', 'Panvel', 'Parbhani', 'Patan', 'Pen',
  'Phaltan', 'Poladpur', 'Pune', 'Purandar', 'Radhanagari', 'Roha', 'Sangli', 'Satara',
  'Shahuwadi', 'Shirala', 'Shirol', 'Shirur', 'Shrivardhan', 'Solapur', 'Sudhagad', 'Tala',
  'Talasari', 'Tasgaon', 'Thane', 'Udgir', 'Ulhasnagar', 'Uran', 'Vada', 'Vasai-Virar',
  'Vashi', 'Velhe', 'Vikramgad', 'Wai', 'Walwa', 'Wardha', 'Washim', 'Yavatmal',
  'Bhandara', 'Buldhana', 'Gadchiroli', 'Hingoli', 'Mumbai City', 'Mumbai Suburban',
  'Raigad', 'Ratnagiri', 'Sindhudurg'
];
const uniqueCities = [...new Set(maharashtraCities)].sort();

// For each loan type × city generate a dynamic URL via the [loan]/[state]/[city] route
loanTypes.forEach((loan) => {
  uniqueCities.forEach((city) => {
    const slug = city.toLowerCase().replace(/ /g, '-');
    dynamicEntries.push(entry(`${BASE}/${loan}/maharashtra/${slug}`, TODAY, 'weekly', '0.7'));
  });
});

// ─── 5. Blog posts ───
const blogDir = join(APP_DIR, 'blog');
const blogEntries = [];
if (existsSync(blogDir)) {
  dirs(blogDir).forEach((slug) => {
    if (hasPage(join(blogDir, slug))) {
      blogEntries.push(entry(`${BASE}/blog/${slug}`, TODAY, 'monthly', '0.6'));
    }
  });
}

// ─── 6. Deduplicate URLs ───
const seenUrls = new Set();
function dedup(entriesStr) {
  return entriesStr
    .split('\n  <url>')
    .filter((chunk) => {
      const match = chunk.match(/<loc>([^<]+)<\/loc>/);
      if (!match) return true;
      if (seenUrls.has(match[1])) return false;
      seenUrls.add(match[1]);
      return true;
    })
    .join('\n  <url>');
}

// ─── Write files ───
mkdirSync(OUT_DIR, { recursive: true });

const allDynamic = dynamicEntries.join('\n');

writeFileSync(join(OUT_DIR, 'sitemap-static.xml'), wrap(staticEntries));
writeFileSync(join(OUT_DIR, 'sitemap-loan.xml'), wrap(loanEntries));
writeFileSync(join(OUT_DIR, 'sitemap-city.xml'), wrap(cityStaticEntries));
writeFileSync(join(OUT_DIR, 'sitemap-dynamic.xml'), wrap(allDynamic));
writeFileSync(join(OUT_DIR, 'sitemap-blog.xml'), wrap(blogEntries.join('\n')));

// Master sitemap index
const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE}/sitemap-static.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE}/sitemap-loan.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE}/sitemap-city.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE}/sitemap-dynamic.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE}/sitemap-blog.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
</sitemapindex>`;
writeFileSync(join(OUT_DIR, 'sitemap.xml'), indexContent);

// robots.txt
const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /partner/
Disallow: /login/
Disallow: /auth/
Disallow: /dashboard/

Sitemap: ${BASE}/sitemap.xml
`;
writeFileSync(join(OUT_DIR, 'robots.txt'), robots);

// Stats
const totalStatic = staticPaths.length;
const totalLoan = loanTypes.length;
const totalCityStatic = cityStaticDirs.length;
const totalDynamic = dynamicEntries.length;
const totalBlog = blogEntries.length;
const total = totalStatic + totalLoan + totalCityStatic + totalDynamic + totalBlog;

console.log('✅ Sitemaps generated successfully!');
console.log(`   Static pages:     ${totalStatic}`);
console.log(`   Loan landing:     ${totalLoan}`);
console.log(`   City-static:      ${totalCityStatic}`);
console.log(`   Dynamic (city×loan): ${totalDynamic}`);
console.log(`   Blog posts:       ${totalBlog}`);
console.log(`   ──────────────────`);
console.log(`   TOTAL URLs:       ${total}`);
console.log('');
console.log('Files written to public/:');
console.log('   sitemap.xml (master index)');
console.log('   sitemap-static.xml');
console.log('   sitemap-loan.xml');
console.log('   sitemap-city.xml');
console.log('   sitemap-dynamic.xml');
console.log('   sitemap-blog.xml');
console.log('   robots.txt');
