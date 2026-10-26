// Accessibility: axe-core on every spread of every book in both themes and at phone width, then the things a
// scanner can't judge: keyboard-only use, focus visibility, focus inside the entry dialog, announcements, reduced motion.
// axe-core is not a dependency of the site: set AXE_PATH to axe.min.js, or "npm i --no-save axe-core@4.10.3".
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { serve, launch, open, settle, state, BASE, CHAPTERS, ENTRIES } from './support.mjs';

let axeSource = null;
try {
  axeSource = fs.readFileSync(process.env.AXE_PATH || createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
} catch {}

let server, browser;
before(async () => {
  server = await serve();
  browser = await launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
async function axe(page) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async (tags) => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, wcag: v.tags.some((t) => /^wcag\d/.test(t)), nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 4), count: v.nodes.length }));
  }, TAGS);
  return r;
}

test('axe: every spread of every book, light and dark, desktop and phone', { skip: !axeSource && 'axe-core not installed' }, async () => {
  const found = new Map();
  const note = (where, vs) => {
    for (const v of vs) {
      const k = `${v.id} (${v.impact})`;
      if (!found.has(k)) found.set(k, { ...v, where: [] });
      found.get(k).where.push(where);
    }
  };
  for (const [scheme, vp] of [['light', { width: 1440, height: 900 }], ['dark', { width: 1440, height: 900 }], ['light', { width: 390, height: 844 }]]) {
    const opts = { reducedMotion: 'reduce', colorScheme: scheme, viewport: vp, ...(vp.width < 500 ? { isMobile: true, hasTouch: true } : {}) };
    // the shut cover, as a first visit sees it
    const cover = await open(browser, '/', { ...opts, reducedMotion: 'no-preference' });
    await cover.waitForTimeout(600);
    note(`${scheme} ${vp.width} cover`, await axe(cover));
    await cover.context().close();
    for (const url of ['/#intro', ...ENTRIES.map((e) => `/work/${e}/`), '/nope/']) {
      const page = await open(browser, url, opts);
      await settle(page, 700);
      for (let i = 0; i < 25; i++) {
        const s = await state(page);
        note(`${scheme} ${vp.width} ${url} ${s.shut || s.pages.join('+')}`, await axe(page));
        const next = page.locator(url.startsWith('/work/') ? '.overlay .book > .corner.next' : 'main .book > .corner.next');
        if (!(await next.count()) || (await next.isDisabled())) break;
        await page.keyboard.press('ArrowRight');
        await settle(page, 80);
      }
      await page.context().close();
    }
  }
  const line = (v) => `${v.id} [${v.impact}] ${v.help} — e.g. ${v.nodes[0]} — on ${v.where.length} views, first: ${v.where[0]}`;
  if (process.env.A11Y_REPORT) fs.writeFileSync(process.env.A11Y_REPORT, JSON.stringify([...found.values()], null, 1));
  // best-practice findings are reported, not failed: see QA_REPORT.md for the ones left open on purpose
  for (const v of found.values()) if (!v.wcag) console.log(`# axe best practice (not a WCAG failure): ${line(v)}`);
  assert.deepEqual([...found.values()].filter((v) => v.wcag).map(line), [], 'axe WCAG violations');
});

test('keyboard only: open the notebook, turn pages, open and close an entry', async () => {
  const page = await open(browser, '/');
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Open the notebook', 'first Tab stop');
  await page.keyboard.press('Enter');
  await settle(page, 300);
  assert.equal((await state(page)).shut, false);
  // a second press during a turn finishes that turn, so wait for each
  await page.keyboard.press('ArrowRight');
  await settle(page, 100);
  await page.keyboard.press('ArrowRight');
  await settle(page, 300);
  assert.equal((await state(page)).hash, '#reservation-agent');
  // Tab until "Run the full entry" has focus, then Enter
  let found = false;
  for (let i = 0; i < 40 && !found; i++) {
    await page.keyboard.press('Tab');
    found = await page.evaluate(() => document.activeElement.classList.contains('run'));
  }
  assert.ok(found, '"Run the full entry" is reachable by Tab');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/work/reservation-agent/');
  await settle(page, 900);
  assert.equal(await page.evaluate(() => document.activeElement.className), 'close', 'focus moves into the entry, on its close button');
  await page.keyboard.press('ArrowRight');
  await settle(page, 300);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.overlay'));
  assert.match(await page.evaluate(() => document.activeElement.className), /run/, 'focus returns to where the entry was opened');
  assert.deepEqual(page.problems(), []);
  await page.context().close();
});

test('every focusable thing shows a visible focus ring', async () => {
  for (const url of ['/#intro', '/work/graph-rag/']) {
    const page = await open(browser, url, { reducedMotion: 'reduce' });
    await settle(page, 700);
    const missing = [];
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1;
        return { ring, name: `${el.tagName.toLowerCase()}.${el.className} ${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 25)}` };
      });
      if (f && !f.ring) missing.push(f.name);
    }
    assert.deepEqual([...new Set(missing)], [], `${url}: focus without a visible ring`);
    await page.context().close();
  }
});

test('Tab stays inside an open entry book and never reaches the notebook behind it', async () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await open(browser, '/work/graph-rag/', { reducedMotion: 'reduce', viewport: vp });
    await settle(page, 800);
    const escaped = [];
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press(key);
        const where = await page.evaluate(() => {
          const el = document.activeElement;
          // Tab moving on to the browser's own toolbar passes through <body>; that's allowed
          if (!el || el === document.body) return null;
          return el.closest('.overlay') ? null : `${el.tagName.toLowerCase()}.${el.className} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}"`;
        });
        if (where) escaped.push(`${key}: ${where}`);
      }
    }
    assert.deepEqual([...new Set(escaped)], [], `${vp.width}: focus left the dialog`);
    await page.context().close();
  }
});

test('screen readers hear where they are after a turn, and only the visible pages', async () => {
  const page = await open(browser, '/#intro', { reducedMotion: 'reduce' });
  await settle(page, 400);
  const live = page.locator('main .book-wrap > .sr[aria-live="polite"]');
  assert.match(await live.innerText(), /Intro, 1 of 7/);
  await page.keyboard.press('ArrowRight');
  await settle(page);
  assert.match(await live.innerText(), /Experience, 2 of 7/);
  // nothing on a page the reader can't see is focusable or in the accessibility tree
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('main .pages .page a, main .pages .page button')].filter((el) => !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden').filter((el) => el.tabIndex >= 0 && getComputedStyle(el).visibility !== 'hidden').length
  );
  assert.equal(hidden, 0);
  await page.context().close();
});

test('reduced motion: pages swap without a turn, the trace shows in full', async () => {
  const page = await open(browser, '/', { reducedMotion: 'reduce' });
  await settle(page, 400);
  assert.equal((await state(page)).shut, false, 'no cover to open');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => !!document.querySelector('.leaf')), false, 'no leaf');
  await page.goto(BASE + '/#intro');
  await page.waitForTimeout(800);
  const step = await page.locator('.console .step').innerText();
  const [a, b] = step.split(' / ');
  assert.equal(a, b, 'whole run shown');
  await page.context().close();
});
