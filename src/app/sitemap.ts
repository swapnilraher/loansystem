import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

const BASE = 'https://techstarsolution.in'
const NOW  = new Date()

// ── Parse CSV for programmatic SEO pages ─────────────────────────────────────
function getCsvRows() {
  try {
    const csv = fs.readFileSync(path.join(process.cwd(), 'data', 'loan_pages.csv'), 'utf8')
    const lines = csv.trim().split(/\r?\n/)
    const header = lines[0].split(',')
    return lines.slice(1).map(line => {
      const vals: string[] = []
      let cur = '', inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue }
        if (ch === ',' && !inQ) { vals.push(cur); cur = '' }
        else { cur += ch }
      }
      vals.push(cur)
      const obj: Record<string, string> = {}
      header.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim() })
      return obj
    }).filter(r => r.Status === 'published' && r.URL_Slug)
  } catch { return [] }
}

export default function sitemap(): MetadataRoute.Sitemap {

  // ── 1. Homepage ──────────────────────────────────────────────────────────────
  const home: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: NOW, changeFrequency: 'daily', priority: 1.0 },
  ]

  // ── 2. Core loan product pages ───────────────────────────────────────────────
  const loanProducts: MetadataRoute.Sitemap = [
    '/personal-loan',
    '/home-loan',
    '/business-loan',
    '/loan-against-property',
    '/car-loan',
    '/cibil-score',
  ].map(r => ({ url: `${BASE}${r}`, lastModified: NOW, changeFrequency: 'weekly' as const, priority: 0.95 }))

  // ── 3. DSA / Partner acquisition pages ──────────────────────────────────────
  const dsaPages: MetadataRoute.Sitemap = [
    '/become-dsa-partner',
  ].map(r => ({ url: `${BASE}${r}`, lastModified: NOW, changeFrequency: 'monthly' as const, priority: 0.85 }))

  // ── 4. City-specific dedicated pages (Pune + Sambhajianagar) ────────────────
  const cityPages: MetadataRoute.Sitemap = [
    '/personal-loan-pune',
    '/personal-loan-chhatrapati-sambhajianagar',
    '/home-loan-pune',
    '/home-loan-chhatrapati-sambhajianagar',
    '/business-loan-pune',
    '/business-loan-chhatrapati-sambhajianagar',
    '/loan-against-property-pune',
    '/loan-against-property-chhatrapati-sambhajianagar',
    '/loan-agent-pune',
    '/loan-agent-chhatrapati-sambhajianagar',
    '/dsa-loan-pune',
    '/dsa-loan-chhatrapati-sambhajianagar',
  ].map(r => ({ url: `${BASE}${r}`, lastModified: NOW, changeFrequency: 'weekly' as const, priority: 0.88 }))

  // ── 5. Blog / Content pages ──────────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = [
    '/blog/improve-credit-score',
  ].map(r => ({ url: `${BASE}${r}`, lastModified: NOW, changeFrequency: 'monthly' as const, priority: 0.75 }))

  // ── 6. About / Legal pages ───────────────────────────────────────────────────
  const infoPages: MetadataRoute.Sitemap = [
    '/about',
    '/privacy',
    '/terms',
  ].map(r => ({ url: `${BASE}${r}`, lastModified: NOW, changeFrequency: 'yearly' as const, priority: 0.40 }))

  // ── 7. Programmatic SEO pages from CSV (all published rows) ─────────────────
  const csvRows = getCsvRows()
  const csvPages: MetadataRoute.Sitemap = csvRows.map(row => {
    const ctr = parseFloat(row.CTR ?? '0')
    return {
      url:             `${BASE}/${row.URL_Slug}`,
      lastModified:    NOW,
      changeFrequency: 'weekly' as const,
      priority:        ctr >= 2.5 ? 0.92
                     : ctr >= 1.5 ? 0.85
                     : 0.75,
    }
  })

  // ── EXCLUDED from sitemap (private / auth / dashboard) ──────────────────────
  // /admin/*        → private (admin.techstarsolution.in subdomain)
  // /partner/*      → private (partner.techstarsolution.in subdomain)
  // /dashboard      → requires auth
  // /auth           → login page, no SEO value
  // /api/*          → API routes

  return [
    ...home,
    ...loanProducts,
    ...dsaPages,
    ...cityPages,
    ...blogPages,
    ...infoPages,
    ...csvPages,
  ]
}
