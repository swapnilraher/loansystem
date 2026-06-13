// audit-sitemap.js – Node script to check every URL listed in the sitemap
// Uses built‑in fetch (Node 18+) and simple regex parsing – no external dependencies.

const sitemapUrl = 'https://techstarsolution.in/sitemap.xml';

/** Extract <loc> URLs from raw XML sitemap */
function extractUrls(xml) {
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

async function fetchSitemap() {
  const res = await fetch(sitemapUrl);
  if (!res.ok) {
    console.error(`Failed to fetch sitemap: ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();
  return extractUrls(xml);
}

/** Check a URL for HTTP status and any noindex meta tag */
async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    const status = res.status;
    const html = await res.text();
    const hasNoIndex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"'>]*noindex[^"'>]*["'][^>]*>/i.test(html);
    console.log(JSON.stringify({ url, status, hasNoIndex }));
  } catch (e) {
    console.error(`Error fetching ${url}: ${e.message}`);
  }
}

(async () => {
  const urls = await fetchSitemap();
  console.log(`Found ${urls.length} URLs in sitemap.`);
  for (const url of urls) {
    await checkUrl(url);
  }
})();
