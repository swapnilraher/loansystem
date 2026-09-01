import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const revalidate = 86400;

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'robots.txt');
  if (!fs.existsSync(filePath)) {
    return new NextResponse('User-agent: *\nAllow: /\n', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  const text = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
