import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

// ── Parse CSV to get all published programmatic pages ─────────────────────────
function getCsvRows() {
  try {
    const csv = fs.readFileSync(path.join(process.cwd(), 'data', 'loan_pages.csv'), 'utf8')
    const lines = csv.trim().split(/\r?\n/)
    const header = lines[0].split(',')
    return lines.slice(1).map(line => {
      const values: string[] = []
      let cur = '', inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue }
        if (ch === ',' && !inQ) { values.push(cur); cur = '' }
        else { cur += ch }
      }
      values.push(cur)
      const obj: Record<string, string> = {}
      header.forEach((h, i) => { obj[h.trim()] = (values[i] ?? '').trim() })
      return obj
    }).filter(r => r.Status === 'published')
  } catch {
    return []
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://techstarsolution.in'

  // ── Static core pages (highest priority) ─────────────────────────────────────
  const coreRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,                   priority: 1.0, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/personal-loan`,      priority: 0.9, changeFrequency: 'weekly',  lastModified: new Date() },
    { url: `${baseUrl}/home-loan`,          priority: 0.9, changeFrequency: 'weekly',  lastModified: new Date() },
    { url: `${baseUrl}/business-loan`,      priority: 0.9, changeFrequency: 'weekly',  lastModified: new Date() },
    { url: `${baseUrl}/loan-against-property`, priority: 0.9, changeFrequency: 'weekly', lastModified: new Date() },
    { url: `${baseUrl}/car-loan`,           priority: 0.8, changeFrequency: 'weekly',  lastModified: new Date() },
    { url: `${baseUrl}/cibil-score`,        priority: 0.8, changeFrequency: 'weekly',  lastModified: new Date() },
    { url: `${baseUrl}/become-dsa-partner`, priority: 0.8, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/about`,              priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/blog/improve-credit-score`, priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/privacy`,            priority: 0.3, changeFrequency: 'yearly',  lastModified: new Date() },
    { url: `${baseUrl}/terms`,              priority: 0.3, changeFrequency: 'yearly',  lastModified: new Date() },
  ]

  // ── Static city pages (dedicated routes) ─────────────────────────────────────
  const cityRoutes: MetadataRoute.Sitemap = [
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
  ].map(route => ({
    url: `${baseUrl}${route}`,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
    lastModified: new Date(),
  }))

  // ── Programmatic SEO pages from CSV ──────────────────────────────────────────
  const csvRows = getCsvRows()
  const csvRoutes: MetadataRoute.Sitemap = csvRows.map(row => {
    const ctr = parseFloat(row.CTR ?? '0')
    return {
      url: `${baseUrl}/${row.URL_Slug}`,
      priority: ctr >= 2.0 ? 0.9 : ctr >= 1.5 ? 0.8 : 0.7,
      changeFrequency: 'weekly' as const,
      lastModified: new Date(),
    }
  })

  return [...coreRoutes, ...cityRoutes, ...csvRoutes]
}
