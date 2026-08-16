// scripts/submit-sitemap.js
const { google } = require('googleapis');
const path = require('path');

async function submit() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve('service-account.json'), // place your service account JSON here
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  const webmasters = google.webmasters({ version: 'v3', auth });
  const siteUrl = 'https://techstarsolution.in';
  await webmasters.sitemaps.submit({ siteUrl, feedpath: `${siteUrl}/sitemap.xml` });
  console.log('✅ Sitemap submitted to Google Search Console');
}

submit().catch(console.error);
