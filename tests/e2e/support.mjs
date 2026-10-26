// Shared helpers for the end-to-end suite: a static server that behaves like GitHub Pages, the browser, and
// a page wrapper that records every console error, uncaught exception and failed request.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

export const DIST = path.resolve(process.env.DIST || 'dist');
export const PORT = Number(process.env.PORT || 4321);
export const BASE = `http://localhost:${PORT}`;

export const ROUTES = ['/', '/work/reservation-agent/', '/work/graph-rag/', '/work/rag-from-scratch/'];
export const ENTRIES = ['reservation-agent', 'graph-rag', 'rag-from-scratch'];
export const CHAPTERS = ['intro', 'experience', 'reservation-agent', 'graph-rag', 'rag-from-scratch', 'single-vs-multi-agent', 'contact'];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml',
};

/** Serves dist/ as GitHub Pages does: index.html for a folder, a 301 to add the folder's slash, 404.html otherwise. */
export function serve(root = DIST, port = PORT) {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error(`No build in ${root}: run "npm run build" first.`);
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let file = path.join(root, decodeURIComponent(u.pathname));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    try {
      let st = fs.statSync(file);
      if (st.isDirectory()) {
        if (!u.pathname.endsWith('/')) return res.writeHead(301, { Location: u.pathname + '/' + u.search }).end();
        file = path.join(file, 'index.html');
        st = fs.statSync(file);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      fs.createReadStream(path.join(root, '404.html')).pipe(res);
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

/** Chromium; PW_CHROMIUM points at a browser binary when Playwright's own download isn't installed. */
export function launch() {
  return chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
}

/**
 * A fresh context and page. page.problems() lists console errors and warnings, uncaught exceptions, and
 * failed same-origin requests seen so far.
 */
export async function open(browser, url = '/', opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`console.${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    if (r.url().startsWith(BASE)) problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on('response', (r) => {
    // the 404 page is meant to answer 404; anything else same-origin failing is a broken asset
    if (r.url().startsWith(BASE) && r.status() >= 400 && r.request().resourceType() !== 'document') problems.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  // Chrome warns when a preloaded font isn't used within ~3s of load. It only happens when the machine is too busy to
  // lay the page out in time (checked on every route, desktop, phone and reduced motion: no warning under normal
  // load), so it's left out here rather than making the suite flaky.
  page.problems = () => problems.filter((p) => !/was preloaded using link preload but not used/.test(p));
  if (url) await page.goto(BASE + url);
  return page;
}

/** Waits until no page is turning. */
export async function settle(page, extra = 50) {
  await page.waitForFunction(() => !document.querySelector('.leaf'), null, { timeout: 5000 });
  await page.waitForTimeout(extra);
}

/** What the reader can see of the front book: its pages' running heads, the hash, and whether a cover is shut. */
export function state(page) {
  return page.evaluate(() => {
    const books = [...document.querySelectorAll('.book')];
    const book = books[books.length - 1];
    const pages = [...book.querySelectorAll('.pages .page')].filter(
      (p) => getComputedStyle(p).visibility !== 'hidden' && !p.classList.contains('pre') && p.getClientRects().length
    );
    return {
      hash: location.hash,
      path: location.pathname,
      shut: book.classList.contains('closed') ? (book.classList.contains('at-back') || document.documentElement.dataset.cover === 'back' ? 'back' : 'front') : false,
      pages: pages.map((p) => p.getAttribute('aria-label')),
      overlay: !!document.querySelector('.overlay'),
    };
  });
}

/** Every anchor on the visible pages of the front book (and its chrome). */
export function anchors(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .filter((a) => a.getClientRects().length && getComputedStyle(a).visibility !== 'hidden')
      .map((a) => ({ href: a.getAttribute('href'), abs: a.href, target: a.target, rel: a.rel, text: a.textContent.trim().slice(0, 60) }))
  );
}
