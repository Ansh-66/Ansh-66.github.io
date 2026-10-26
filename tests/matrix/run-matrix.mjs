// The viewport matrix: walks every page of the notebook and of each entry book at each viewport, saves a
// screenshot of every spread, and measures what a screenshot can hide. Writes screenshots/matrix/<viewport>/ and
// screenshots/matrix/results.json. Run after "npm run build":  node tests/matrix/run-matrix.mjs [--quick]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, BASE, ENTRIES } from '../e2e/support.mjs';

const QUICK = process.argv.includes('--quick');
const SHOTS = !process.argv.includes('--no-shots');
const OUT = path.resolve('screenshots/matrix');

// [label, width, height, extra context options]
const VIEWPORTS = [
  // desktop and large
  ['3440x1440', 3440, 1440], ['2560x1440', 2560, 1440], ['1920x1080', 1920, 1080], ['1680x1050', 1680, 1050], ['1600x900', 1600, 900],
  ['1440x900', 1440, 900], ['1366x768', 1366, 768], ['1280x720', 1280, 720], ['1024x768', 1024, 768],
  // tablets and compact laptops
  ['1024x600', 1024, 600], ['912x1368', 912, 1368, { hasTouch: true }], ['834x1194', 834, 1194, { hasTouch: true }], ['800x1280', 800, 1280, { hasTouch: true }],
  ['768x1024', 768, 1024, { hasTouch: true }], ['600x960', 600, 960, { hasTouch: true }],
  // phones (touch, mobile)
  ['480x854', 480, 854, { mobile: true }], ['430x932', 430, 932, { mobile: true }], ['414x896', 414, 896, { mobile: true }], ['393x873', 393, 873, { mobile: true }],
  ['390x844', 390, 844, { mobile: true }], ['375x812', 375, 812, { mobile: true }], ['360x800', 360, 800, { mobile: true }], ['320x568', 320, 568, { mobile: true }],
  // phones sideways and very short screens
  ['844x390 landscape', 844, 390, { mobile: true }], ['740x360 landscape', 740, 360, { mobile: true }], ['568x320 landscape', 568, 320, { mobile: true }], ['1280x500 short', 1280, 500],
  // either side of every breakpoint in styles.css: 420/421, 599/600, 899/900 wide, 500/501 tall, aspect 11/10
  ['420x800', 420, 800, { mobile: true }], ['421x800', 421, 800, { mobile: true }], ['599x900', 599, 900], ['601x900', 601, 900],
  ['899x700', 899, 700], ['900x700', 900, 700], ['901x780', 901, 780], ['1100x1000 aspect 1.1', 1100, 1000], ['1100x1001 aspect <1.1', 1100, 1001],
  ['1200x500', 1200, 500], ['1200x501', 1200, 501],
  // browser zoom on a 1440x900 window: 80%, 125%, 150%, 200% (zoom divides the CSS viewport and multiplies the pixel ratio)
  ['zoom 80% (1800x1125)', 1800, 1125, { dpr: 0.8 }], ['zoom 125% (1152x720)', 1152, 720, { dpr: 1.25 }], ['zoom 150% (960x600)', 960, 600, { dpr: 1.5 }], ['zoom 200% (720x450)', 720, 450, { dpr: 2 }],
  // pixel ratios
  ['390x844 @3x', 390, 844, { mobile: true, dpr: 3 }], ['1440x900 @2x', 1440, 900, { dpr: 2 }],
];
const pick = QUICK ? VIEWPORTS.filter(([l]) => /^(1440x900|1366x768|1280x720|820|390x844|360x800|320x568|768x1024|1024x768)/.test(l)) : VIEWPORTS;

const SCROLLERS = '.tablebox, .requests, .qx-tabs, .screen, pre, .scrollx, .page-body, .toc-sheet';

function measure(SCROLLERS) {
  const out = { docOverflowX: document.documentElement.scrollWidth - innerWidth, docOverflowY: document.documentElement.scrollHeight - innerHeight, pages: [] };
  const books = [...document.querySelectorAll('.book')];
  const book = books[books.length - 1];
  const vis = (el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  const pages = [...book.querySelectorAll('.pages .page')].filter((p) => vis(p) && !p.classList.contains('pre'));
  const corners = [...book.querySelectorAll(':scope > .corner, :scope > .chrome button, :scope > .close')].filter((c) => vis(c) && getComputedStyle(c).opacity !== '0');
  for (const p of pages) {
    const pr = p.getBoundingClientRect();
    const res = { page: p.getAttribute('aria-label') || 'cover', overflowPx: 0, spill: [], clipped: [], minFont: 99, minFontAt: '', small: [], overlap: [] };
    const body = p.querySelector('.page-body');
    if (body) res.overflowPx = body.scrollHeight - body.clientHeight;
    for (const el of p.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const inScroller = el.closest(SCROLLERS) && el.closest(SCROLLERS) !== el;
      // spills sideways out of the page (things inside a scroller may extend; the scroller itself may not)
      if (!inScroller && (r.right > pr.right + 1 || r.left < pr.left - 1) && !el.closest('.mark-wrap'))
        res.spill.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} by ${Math.round(Math.max(r.right - pr.right, pr.left - r.left))}px`);
      // text cut off by its own box (an ellipsis on a running head is meant)
      if (cs.overflow !== 'visible' && el.scrollWidth > el.clientWidth + 1 && !el.matches(SCROLLERS) && !el.matches('.sr') && cs.textOverflow !== 'ellipsis' && el.children.length === 0)
        res.clipped.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 30)}"`);
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText && !el.closest('svg')) {
        const fs = parseFloat(cs.fontSize);
        if (fs < res.minFont) { res.minFont = fs; res.minFontAt = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`; }
      }
      if (el.matches('a[href], button, select, [role="tab"]')) {
        // an absolutely placed ::after layer is part of the tap target (the Contact email link has one)
        let tw = r.width, th = r.height;
        const af = getComputedStyle(el, '::after');
        if (af.content !== 'none' && af.position === 'absolute') {
          tw = Math.max(tw, r.width - parseFloat(af.left || 0) - parseFloat(af.right || 0));
          th = Math.max(th, r.height - parseFloat(af.top || 0) - parseFloat(af.bottom || 0));
        }
        const m = Math.min(tw, th);
        const inline = el.matches('a') && cs.display === 'inline';
        if (m < 24 && !inline) res.small.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(tw)}x${Math.round(th)} (<24)`);
        else if (m < 44 && !inline) res.small.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(tw)}x${Math.round(th)} (<44)`);
      }
    }
    // the running head and footer text against the book's own buttons
    for (const t of p.querySelectorAll('.page-head > span, .page-foot > *')) {
      if (!vis(t) || getComputedStyle(t).display === 'none') continue;
      const a = t.getBoundingClientRect();
      for (const c of corners) {
        // the visible dog-ear, not the button's larger transparent hit area
        const b = (c.querySelector('.ear') || c).getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) res.overlap.push(`${t.className || 'head'} under ${c.className.split(' ').slice(0, 2).join('.')}`);
      }
    }
    res.small = [...new Set(res.small)];
    out.pages.push(res);
  }
  return out;
}

async function walk(page, url, label, dir, results) {
  await page.goto(BASE + url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const m = await page.evaluate(measure, SCROLLERS);
    const key = m.pages.map((p) => p.page).join('+') || 'cover';
    if (!seen.has(key)) {
      seen.add(key);
      const shot = `${dir}/${url.replace(/[/#]+/g, '_') || 'home'}-${key.replace(/\W+/g, '_')}.png`;
      if (SHOTS) await page.screenshot({ path: path.join(OUT, shot) });
      results.push({ viewport: label, url, spread: key, shot: SHOTS ? `screenshots/matrix/${shot}` : null, ...m });
    }
    const front = url.startsWith('/work/') ? '.overlay .book' : 'main .book';
    const next = page.locator(`${front} > .corner.next`);
    if (!(await next.count()) || (await next.isDisabled())) break;
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => !document.querySelector('.leaf'));
    await page.waitForTimeout(60);
  }
}

const server = await serve();
const browser = await launch();
const results = [];
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
for (const [label, width, height, o = {}] of pick) {
  const dir = label.replace(/\W+/g, '_');
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: o.dpr || 1, isMobile: !!o.mobile, hasTouch: !!(o.mobile || o.hasTouch), reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errors.push(m.text()));
  for (const url of ['/#intro', ...ENTRIES.map((e) => `/work/${e}/`), '/nope/']) await walk(page, url, label, dir, results);
  if (errors.length) results.push({ viewport: label, url: '*', errors });
  await ctx.close();
  process.stdout.write(`${label} `);
}
await browser.close();
server.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
console.log(`\n${results.length} spreads in ${Math.round((Date.now() - t0) / 1000)}s -> ${path.relative(process.cwd(), OUT)}/results.json`);
