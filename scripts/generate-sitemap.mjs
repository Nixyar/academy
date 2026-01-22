import fs from 'node:fs';
import path from 'node:path';

const cfgPath = path.resolve(process.cwd(), 'src', 'seo', 'seo-routes.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

const outDir = path.resolve(process.cwd(), 'dist');
const base = String(cfg.site.baseUrl || '').replace(/\/$/, '');

if (!base) {
  throw new Error('[sitemap] cfg.site.baseUrl is required');
}

const urls = (cfg.routes || []).filter(
    (route) => route && typeof route.path === 'string').
    filter((route) => route.path.startsWith('/')).
    filter((route) => !route.noindex && route.type !== 'private').
    map((route) => route.path).
    map((p) => {
      if (p === '/') return `${base}/`;
      return `${base}${p.endsWith('/') ? p : p + '/'}`;
    });

const now = new Date().toISOString();

const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).
        join('\n') +
    `\n</urlset>\n`;

fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf8');

console.log(`[sitemap] written ${urls.length} urls -> dist/sitemap.xml`);
