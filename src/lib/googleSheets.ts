import { google } from 'googleapis';
import LRU from 'lru-cache';

// Adjust these constants to match your Google Sheet
const SHEET_ID = process.env.GOOGLE_SHEET_ID; // e.g. '1a2b3c...'
const SHEET_RANGE = 'Sheet1!A2:J'; // skips header row

// Simple in‑memory LRU cache (5 min TTL)
const cache = new LRU<string, any>({ max: 1, ttl: 1000 * 60 * 5 });

/**
 * Fetch SEO rows from Google Sheets.
 * Returns an array of objects with the columns defined in the spec.
 */
export async function fetchSeoData() {
  if (cache.has('seoRows')) {
    return cache.get('seoRows');
  }

  if (!SHEET_ID) {
    throw new Error('Google Sheet ID not configured (process.env.GOOGLE_SHEET_ID)');
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = res.data.values || [];
  const headers = [
    'city',
    'state',
    'loan_type',
    'slug',
    'interest_rate',
    'emi_starting',
    'meta_title',
    'meta_description',
    'keywords',
    'last_updated',
  ];

  const seoRows = rows.map((row) => {
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });

  cache.set('seoRows', seoRows);
  return seoRows;
}
