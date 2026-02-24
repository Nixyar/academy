import fs from 'node:fs';
import path from 'node:path';

// SPA — single page, no router. Just one canonical URL.
const BASE_URL = process.env.SITE_URL || 'https://vibecoderai.ru';
const outDir = path.resolve(process.cwd(), 'dist');
const now = new Date().toISOString();

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `  <url><loc>${BASE_URL}/</loc><lastmod>${now}</lastmod></url>\n` +
  `</urlset>\n`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf8');

console.log(`[sitemap] written 1 url -> dist/sitemap.xml`);
