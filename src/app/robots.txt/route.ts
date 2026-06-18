import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'robots.txt');
  if (!fs.existsSync(filePath)) {
    return new NextResponse('robots.txt not found', { status: 404 });
  }
  const text = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
