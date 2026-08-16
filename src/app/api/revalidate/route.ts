// src/app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Revalidation endpoint for SEO incremental updates.
 * Triggered (e.g., via Google Sheets webhook) with a secret token.
 * Example request: POST /api/revalidate?secret=YOUR_SECRET
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('secret');
  const expected = process.env.REVALIDATE_SECRET; // set in .env

  if (!token || token !== expected) {
    return new NextResponse('Invalid token', { status: 401 });
  }

  // Revalidate the main sitemaps and dynamic pages
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap-static.xml');
  revalidatePath('/sitemap-city.xml');
  revalidatePath('/sitemap-loan.xml');
  revalidatePath('/sitemap-dynamic.xml');

  // Optionally trigger ISR for all dynamic pages (wildcard not supported, so use fallback)
  // This will cause the next request to regenerate the page using the latest Google Sheet data.

  return NextResponse.json({ message: 'Revalidation triggered' });
}
