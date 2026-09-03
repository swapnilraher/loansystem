import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  return handleRouting(req)
}

function handleRouting(req: NextRequest) {
  const url = req.nextUrl.clone()
  const host = req.headers.get('host') || ''
  const hostname = host.split(':')[0].toLowerCase()
  const pathname = url.pathname

  // Helper to determine if we are in local development
  const isLocalhost = hostname.includes('localhost') || hostname === '127.0.0.1'
  const portSuffix = host.includes(':') ? `:${host.split(':')[1]}` : ''

  const isAdminSubdomain =
    hostname === 'admin.techstarsolution.in' ||
    hostname === 'admin.localhost' ||
    hostname.startsWith('admin.')

  const isPartnerSubdomain =
    hostname === 'partner.techstarsolution.in' ||
    hostname === 'partner.localhost' ||
    hostname.startsWith('partner.')

  // ── Block sitemaps and bots indexing on Admin portal ──
  if (isAdminSubdomain) {
    if (pathname.startsWith('/sitemap') || pathname === '/sitemap.xml') {
      return new NextResponse('Sitemap Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex, nofollow' },
      })
    }
    if (pathname === '/robots.txt') {
      return new NextResponse('User-agent: *\nDisallow: /\n', {
        headers: {
          'Content-Type': 'text/plain',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  }

  // ── SEO robots.txt and sitemap.xml for Partner Subdomain (Homepage Only) ──
  if (isPartnerSubdomain) {
    if (pathname === '/robots.txt') {
      const robotsTxt = `User-agent: *
Allow: /$
Disallow: /login
Disallow: /partner/login
Disallow: /onboarding
Disallow: /application-status
Disallow: /leads
Disallow: /wallet
Disallow: /profile
Disallow: /credit-check
Disallow: /api/

Sitemap: https://partner.techstarsolution.in/sitemap.xml
`
      return new NextResponse(robotsTxt, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    if (pathname === '/sitemap.xml' || pathname === '/sitemap') {
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://partner.techstarsolution.in/</loc>
    <lastmod>2026-09-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
      return new NextResponse(sitemapXml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  }

  // ── 1. Safety: Bypass API routes, Next.js internals, and static assets ──
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // ── 2. Admin Subdomain: admin.techstarsolution.in / admin.localhost ──
  if (isAdminSubdomain) {
    // If already on /admin or /admin/*, let Next.js serve the internal route
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return NextResponse.next()
    }

    // Rewrite clean paths (/, /leads, /users, /settings, /login) to internal /admin routes
    const internalPath = pathname === '/' || pathname === '' ? '/admin' : `/admin${pathname}`
    url.pathname = internalPath
    return NextResponse.rewrite(url)
  }

  // ── 3. Partner Subdomain: partner.techstarsolution.in / partner.localhost ──
  if (isPartnerSubdomain) {
    // If someone visits /admin or /admin/* on partner subdomain, redirect to Admin subdomain
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const subPath = pathname.replace(/^\/admin/, '') || '/'
      const adminOrigin = isLocalhost
        ? `http://admin.localhost${portSuffix}`
        : 'https://admin.techstarsolution.in'
      return NextResponse.redirect(`${adminOrigin}${subPath}${url.search}`, 308)
    }

    // Direct public routes allowed under partner portal
    if (pathname.startsWith('/onboarding') || pathname.startsWith('/application-status')) {
      return NextResponse.next()
    }

    // If already on /partner or /partner/*, let Next.js serve the internal route
    if (pathname === '/partner' || pathname.startsWith('/partner/')) {
      return NextResponse.next()
    }

    // Rewrite clean paths (/, /leads, /profile, /wallet, /login) to internal /partner routes
    const internalPath = pathname === '/' || pathname === '' ? '/partner' : `/partner${pathname}`
    url.pathname = internalPath
    return NextResponse.rewrite(url)
  }

  // ── 4. Main Domain: techstarsolution.in / www.techstarsolution.in / localhost ──
  // Block and 308 Redirect any /admin or /admin/* to admin subdomain
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const subPath = pathname.replace(/^\/admin/, '') || '/'
    const adminOrigin = isLocalhost
      ? `http://admin.localhost${portSuffix}`
      : 'https://admin.techstarsolution.in'
    return NextResponse.redirect(`${adminOrigin}${subPath}${url.search}`, 308)
  }

  // Block and 308 Redirect any /partner or /partner/* to partner subdomain
  // Exception: on raw localhost (not partner.localhost), allow direct access for local dev preview
  if (pathname === '/partner' || pathname.startsWith('/partner/')) {
    if (!isLocalhost) {
      const subPath = pathname.replace(/^\/partner/, '') || '/'
      return NextResponse.redirect(`https://partner.techstarsolution.in${subPath}${url.search}`, 308)
    }
    // On localhost: serve internally so JS/CSS chunks load correctly
    return NextResponse.next()
  }

  // Block and 308 Redirect /become-dsa-partner to partner subdomain
  if (pathname === '/become-dsa-partner' || pathname.startsWith('/become-dsa-partner/')) {
    const partnerOrigin = isLocalhost
      ? `http://partner.localhost${portSuffix}`
      : 'https://partner.techstarsolution.in'
    return NextResponse.redirect(`${partnerOrigin}${url.search}`, 308)
  }

  // Block /login on main domain -> 308 redirect to partner subdomain login
  if (pathname === '/login') {
    const partnerOrigin = isLocalhost
      ? `http://partner.localhost${portSuffix}`
      : 'https://partner.techstarsolution.in'
    return NextResponse.redirect(`${partnerOrigin}/login${url.search}`, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, documents, static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf|css|js|map)).*)',
  ],
}
