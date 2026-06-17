import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const appDir = path.resolve(process.cwd(), 'src', 'app');
  const loanTypes = ['personal-loan', 'home-loan', 'lap-loan'];
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

  // Add homepage
  urls.push({ url: baseUrl, lastModified: new Date() });

  return urls;
}
