// Every URL the site serves: status codes as GitHub Pages returns them, the prerendered HTML (content and
// metadata without JavaScript), the assets each page references, and a clean console once it hydrates.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, open, settle, state, BASE, ROUTES, ENTRIES } from './support.mjs';

let server, browser;
before(async () => {
  server = await serve();
  browser = await launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

const get = (url, method = 'GET') => fetch(BASE + url, { method, redirect: 'manual' });

test('status codes match GitHub Pages', async () => {
  for (const r of ROUTES) assert.equal((await get(r)).status, 200, r);
  for (const r of ['/index.html', '/work/graph-rag/index.html', '/?utm_source=test', '/Ansh_Kumar_Singh_Resume.pdf', '/favicon.svg', '/robots.txt', '/sitemap.xml'])
    assert.equal((await get(r)).status, 200, r);
  const slashless = await get('/work/graph-rag');
  assert.equal(slashless.status, 301);
  assert.equal(slashless.headers.get('location'), '/work/graph-rag/');
  for (const r of ['/nope', '/work/nope/', '/work/', '/work/graph-rag/extra'])
    assert.equal((await get(r)).status, 404, r);
});

test('the resume is a real PDF', async () => {
  const res = await get('/Ansh_Kumar_Singh_Resume.pdf');
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  const head = Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString();
  assert.equal(head, '%PDF-');
});

test('robots.txt and the sitemap list exactly the public routes', async () => {
  const robots = await (await get('/robots.txt')).text();
  assert.match(robots, /Sitemap: https:\/\/ansh-66\.github\.io\/sitemap\.xml/);
  const sitemap = await (await get('/sitemap.xml')).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs.sort(), ROUTES.map((r) => 'https://ansh-66.github.io' + r).sort());
});

for (const r of [...ROUTES, '/404.html']) {
  test(`prerendered ${r}: content, metadata and assets without JavaScript`, async () => {
    const html = await (await get(r)).text();
    assert.match(html, /<title>[^<]+· Ansh Kumar Singh<\/title>|<title>Ansh Kumar Singh · AI Engineer<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{20,}"/);
    assert.match(html, /<html lang="en">/);
    if (r === '/404.html') assert.match(html, /<meta name="robots" content="noindex"/);
    else {
      assert.match(html, new RegExp(`<link rel="canonical" href="https://ansh-66\\.github\\.io${r.replace(/\//g, '\\/')}"`));
      assert.match(html, /<meta property="og:title"/);
    }
    // the words are in the HTML before any script runs: the notebook's first page, or the entry's title
    if (r.startsWith('/work/')) assert.match(html, /<h2[^>]*>[^<]{8,}<\/h2>/);
    else assert.match(html, /Ansh Kumar Singh<\/h1>/);
    // every local asset the page references exists
    const refs = [...html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)].map((m) => m[1]).filter((u) => !u.endsWith('/'));
    for (const u of new Set(refs)) assert.equal((await get(u, 'HEAD')).status, 200, `${r} references ${u}`);
  });
}

test('with JavaScript off, each page still shows its words', async () => {
  for (const r of ROUTES) {
    const page = await open(browser, null, { javaScriptEnabled: false });
    await page.goto(BASE + r);
    const text = await page.locator('body').innerText();
    assert.match(text, /Ansh Kumar Singh/, r);
    if (r.startsWith('/work/')) assert.ok(await page.locator('.overlay').count(), `${r} prerenders its entry book`);
    await page.context().close();
  }
});

test('every route hydrates with a clean console and the right state', async () => {
  for (const r of [...ROUTES, '/nope']) {
    const page = await open(browser, r);
    await page.waitForLoadState('networkidle');
    await settle(page, 1500);
    const s = await state(page);
    if (r === '/') assert.equal(s.shut, 'front', 'home opens on the shut front cover');
    if (r.startsWith('/work/')) {
      assert.ok(s.overlay, `${r} opens its entry book`);
      assert.equal(await page.title(), (await page.locator('.overlay').getAttribute('aria-label')) + ' · Ansh Kumar Singh');
    }
    if (r === '/nope') {
      assert.match(await page.locator('.notice').innerText(), /isn’t in the notebook/);
      assert.equal(await page.title(), 'Page not found · Ansh Kumar Singh');
    }
    // the browser logs the 404 page's own status; anything else is a problem
    const own404 = (p) => r === '/nope' && /status of 404/.test(p) && !/HTTP 404/.test(p);
    assert.deepEqual(page.problems().filter((p) => !own404(p)), [], `${r} console`);
    await page.context().close();
  }
});

test('query strings and index.html addresses resolve to the same page', async () => {
  for (const [url, expect] of [['/?utm_source=test#graph-rag', '#graph-rag'], ['/index.html#contact', '#contact'], ['/work/graph-rag/?ref=cv', null], ['/work/graph-rag/index.html', null]]) {
    const page = await open(browser, url, { reducedMotion: 'reduce' });
    await settle(page, 600);
    const s = await state(page);
    if (expect) assert.equal(s.hash, expect, url);
    else assert.ok(s.overlay, `${url} opens the entry`);
    assert.deepEqual(page.problems(), [], url);
    await page.context().close();
  }
  for (const e of ENTRIES) assert.equal((await get(`/work/${e}/`)).status, 200);
});

test('the Content Security Policy is in force and nothing the site does breaks it', async () => {
  for (const r of [...ROUTES, '/nope']) {
    const html = await (await get(r)).text();
    assert.match(html, /<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/, r);
    assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('<script'), `${r}: the policy comes before any script`);
  }
  const page = await open(browser, null);
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto(BASE + '/');
  await page.waitForTimeout(400);
  // the head script ran (it is allowed by its hash): it shut the cover before the app loaded
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('js')), true);
  await page.keyboard.press('ArrowRight');
  for (let i = 0; i < 3; i++) {
    await settle(page, 100);
    await page.keyboard.press('ArrowRight');
  }
  await settle(page, 100);
  await page.locator('main .book a.run').first().click();
  await page.waitForFunction(() => !!document.querySelector('.overlay'));
  await settle(page, 900);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await settle(page, 100);
  }
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.overlay'));
  await page.locator('.book-theme button').first().click();
  // an injected inline script is refused
  const ran = await page.evaluate(() => {
    window.__injected = false;
    const s = document.createElement('script');
    s.textContent = 'window.__injected = true';
    document.head.appendChild(s);
    return window.__injected;
  });
  assert.equal(ran, false, 'inline script blocked');
  const violations = await page.evaluate(() => window.__csp.filter((v) => !/^script-src(-elem)? inline$/.test(v)));
  assert.deepEqual(violations, [], 'no violations from the site itself');
  await page.context().close();
});
