import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'sitemap-loan.xml');
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Sitemap not found', { status: 404 });
  }
  const xml = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
