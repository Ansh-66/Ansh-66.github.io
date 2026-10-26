// Writes one real HTML file per page, so every link works on GitHub Pages
// without a client-side redirect, and the content is there before JS runs.
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

for (const p of pages) {
  const url = p.path === '*' ? '/404/' : p.path;
  const head = [
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
fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
