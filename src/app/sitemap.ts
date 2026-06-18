import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const appDir = path.resolve(process.cwd(), 'src', 'app');
  const loanTypes = ['personal-loan', 'home-loan', 'lap-loan', 'business-loan', 'car-loan', 'loan-against-property'];
  const urls: MetadataRoute.Sitemap = [];

  loanTypes.forEach((loan) => {
    const loanPath = path.join(appDir, loan);
    if (!fs.existsSync(loanPath)) return;
    const states = fs.readdirSync(loanPath);
    states.forEach((state) => {
      const statePath = path.join(loanPath, state);
      if (!fs.statSync(statePath).isDirectory()) return;
      const cities = fs.readdirSync(statePath);
      cities.forEach((city) => {
        const cityPath = path.join(statePath, city);
        if (!fs.statSync(cityPath).isDirectory()) return;
        const url = `${baseUrl}/${loan}/${state}/${city}`;
        urls.push({ url, lastModified: new Date() });
      });
    });
  });

  // After processing loan type city pages, include all other top‑level pages (static and blog)
  const excludeDirs = new Set([
    'api',
    'admin',
    'auth',
    'dashboard',
    '[...slug]',
    '[loan]',
    '[state]',
    '[city]',
    'become-dsa-partner',
    'partner',
    'privacy',
    'terms',
    'robots.ts',
    'sitemap.ts',
    'layout.tsx',
    'page.tsx'
  ]);

  // Helper to add a URL if it exists
  const addIfExists = (urlPath: string) => {
    const fullPath = path.join(appDir, urlPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      // page.tsx or page.jsx inside the folder signifies a routable page
      const pageFile = path.join(fullPath, 'page.tsx');
      if (fs.existsSync(pageFile)) {
        const url = `${baseUrl}/${urlPath.replace(/\\/g, '/')}`;
        urls.push({ url, lastModified: new Date() });
      }
    }
  };

  // Walk first‑level directories (static pages like about, partner, etc.)
  const topLevel = fs.readdirSync(appDir);
  topLevel.forEach((dir) => {
    if (excludeDirs.has(dir)) return;
    addIfExists(dir);
  });

  // Add blog posts – each folder under /blog is a post
  const blogDir = path.join(appDir, 'blog');
  if (fs.existsSync(blogDir)) {
    const posts = fs.readdirSync(blogDir);
    posts.forEach((slug) => {
      const postPath = path.join('blog', slug);
      addIfExists(postPath);
    });
  }

  // Add homepage (already added earlier) – kept for clarity
  urls.push({ url: baseUrl, lastModified: new Date() });

  return urls;
}

