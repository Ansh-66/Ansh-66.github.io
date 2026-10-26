// Writes one real HTML file per page, so every link works on GitHub Pages
// without a client-side redirect, and the content is there before JS runs.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = 'https://ansh-66.github.io';
const dist = path.resolve('dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const { render, pages } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);

// Preload the faces used above the fold so text doesn't reflow when they arrive.
const assets = fs.readdirSync(path.join(dist, 'assets'));
const want = ['young-serif-latin-400-normal', 'ibm-plex-sans-latin-400-normal', 'ibm-plex-mono-latin-400-normal'];
const preloads = want
  .map((w) => assets.find((f) => f.startsWith(w) && f.endsWith('.woff2')))
  .filter(Boolean)
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`)
  .join('\n    ');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Content Security Policy: only this site's own files, plus the one inline script in index.html's head, allowed by
// its hash (worked out here, from the built page, so editing that script can't leave the policy stale). Inline style
// attributes stay allowed: the prerendered bar charts use them, and the site shows no one else's content.
// frame-ancestors can't be set from a <meta> tag; GitHub Pages sends no headers.
const inline = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hashes = inline.map((s) => `'sha256-${crypto.createHash('sha256').update(s).digest('base64')}'`).join(' ');
const csp = [
  "default-src 'self'",
  `script-src 'self' ${hashes}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

for (const p of pages) {
  const url = p.path === '*' ? '/404/' : p.path;
  const head = [
    `<meta http-equiv="Content-Security-Policy" content="${csp}" />`,
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    p.path === '*' ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${SITE}${url}" /><meta property="og:url" content="${SITE}${url}" />`,
    preloads,
  ].join('\n    ');
  const html = template
    .replace('<!--head-->', head)
    .replace('<div id="root"><!--app-->', `<div id="root" data-path="${esc(url)}">${render(url)}`);
  const out = p.path === '*' ? path.join(dist, '404.html') : path.join(dist, url, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('wrote', path.relative(dist, out));
}
// robots.txt and the sitemap list the same pages, so they can't drift from the routes.
const urls = pages.filter((p) => p.path !== '*').map((p) => `${SITE}${p.path}`);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`
);
console.log('wrote robots.txt, sitemap.xml');
fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
