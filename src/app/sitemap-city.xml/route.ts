import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const revalidate = 86400;

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'sitemap-city.xml');
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Sitemap not found', { status: 404 });
  }
  const xml = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
