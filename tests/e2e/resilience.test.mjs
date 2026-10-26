// Stress and failure injection: long sessions, a slow network, missing fonts, styles or script, going offline,
// rotating the screen with a book open, and memory across many turns and entry visits.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, open, settle, state, BASE } from './support.mjs';

let server, browser;
before(async () => {
  server = await serve();
  browser = await launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

test('fonts that fail to load: the page still reads, in fallback fonts, with no errors', async () => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  await ctx.route(/\.woff2?$/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/#intro');
  await page.waitForTimeout(800);
  assert.match(await page.locator('main .book').innerText(), /Ansh Kumar Singh/);
  await page.keyboard.press('ArrowRight');
  await settle(page);
  assert.equal((await state(page)).hash, '#experience');
  assert.deepEqual(errs, []);
  await ctx.close();
});

test('when the script fails to load, the prerendered page is still there to read', async () => {
  for (const url of ['/', '/work/graph-rag/']) {
    const ctx = await browser.newContext();
    await ctx.route(/\/assets\/index-.*\.js$/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(BASE + url);
    await page.waitForTimeout(500);
    const text = await page.locator('body').innerText();
    assert.ok(text.length > 200, `${url} is not blank`);
    // and the notebook is not left shut on its cover with nothing to open it
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cover || null), null, `${url} cover lifted`);
    await ctx.close();
  }
});

test('when the stylesheet fails to load, the words are still on the page', async () => {
  const ctx = await browser.newContext();
  await ctx.route(/\/assets\/.*\.css$/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/#graph-rag');
  await page.waitForTimeout(800);
  assert.match(await page.locator('body').innerText(), /Graph RAG/);
  assert.deepEqual(errs, []);
  await ctx.close();
});

test('on a slow connection the content is there before the script arrives', async () => {
  const ctx = await browser.newContext();
  let release;
  const gate = new Promise((r) => (release = r));
  await ctx.route(/\/assets\/index-.*\.js$/, async (r) => {
    await gate;
    r.continue();
  });
  const page = await ctx.newPage();
  // module scripts are deferred, so DOMContentLoaded waits for them: wait for the HTML itself instead
  await page.goto(BASE + '/#graph-rag', { waitUntil: 'commit' });
  await page.waitForSelector('main .book');
  // the head script already chose the spread's state: no cover flash for a deep link
  assert.equal(await page.evaluate(() => document.documentElement.dataset.cover || null), null);
  assert.match(await page.locator('body').innerText(), /Ansh Kumar Singh/);
  release();
  await page.waitForLoadState('networkidle');
  await settle(page, 600);
  assert.equal((await state(page)).hash, '#graph-rag');
  await ctx.close();
});

test('offline after loading: every page still turns and every entry still opens and closes', async () => {
  const page = await open(browser, '/#intro', { reducedMotion: 'reduce' });
  await settle(page, 500);
  await page.context().setOffline(true);
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('ArrowRight');
    await settle(page);
  }
  assert.equal((await state(page)).shut, 'back');
  await page.goto(BASE + '/#graph-rag').catch(() => {}); // a real navigation fails offline; that's the browser's page
  await page.context().setOffline(false);
  await page.goto(BASE + '/#graph-rag');
  await settle(page, 500);
  await page.context().setOffline(true);
  await page.locator('main .book a.run').first().click();
  await page.waitForFunction(() => !!document.querySelector('.overlay')); // no element handle: one would keep the overlay alive
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.overlay'));
  await page.context().setOffline(false);
  await page.context().close();
});

test('rotating the screen with an entry open, mid-turn, lands on a whole page', async () => {
  const page = await open(browser, '/work/reservation-agent/', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await settle(page, 1200);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.setViewportSize(i % 2 ? { width: 390, height: 844 } : { width: 844, height: 390 });
    await page.waitForTimeout(300);
  }
  await settle(page, 400);
  const s = await state(page);
  assert.ok(s.overlay && s.pages.length >= 1, JSON.stringify(s));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(page.problems(), []);
  await page.context().close();
});

test('a long session: 200 turns and 30 entry visits leave no growth in nodes or listeners', async () => {
  const page = await open(browser, '/#intro', { reducedMotion: 'reduce' });
  await settle(page, 600);
  const cdp = await page.context().newCDPSession(page);
  const counts = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const m = await cdp.send('Performance.getMetrics');
    const get = (n) => m.metrics.find((x) => x.name === n).value;
    return { nodes: get('Nodes'), listeners: get('JSEventListeners'), heapMB: get('JSHeapUsedSize') / 1e6 };
  };
  await cdp.send('Performance.enable');
  const turnAround = async () => {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(i < 5 ? 'ArrowRight' : 'ArrowLeft');
      await settle(page, 0);
    }
  };
  await turnAround();
  const start = await counts();
  for (let k = 0; k < 20; k++) await turnAround();
  for (let k = 0; k < 30; k++) {
    await page.goto(BASE + '/#graph-rag');
    await settle(page, 100);
    await page.locator('main .book a.run').first().click();
    await page.waitForFunction(() => !!document.querySelector('.overlay')); // no element handle: one would keep the overlay alive
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.overlay'));
  }
  await page.goto(BASE + '/#intro');
  await settle(page, 600);
  await turnAround();
  const end = await counts();
  console.log(`# memory: start ${JSON.stringify(start)} end ${JSON.stringify(end)}`);
  assert.ok(end.nodes < start.nodes * 1.3 + 200, `DOM nodes ${start.nodes} -> ${end.nodes}`);
  assert.ok(end.listeners < start.listeners * 1.3 + 50, `listeners ${start.listeners} -> ${end.listeners}`);
  assert.ok(end.heapMB < start.heapMB * 2 + 5, `heap ${start.heapMB} -> ${end.heapMB} MB`);
  assert.deepEqual(page.problems(), []);
  await page.context().close();
});

test('the same session in one page load: 30 entry visits through the app, no leaks', async () => {
  const page = await open(browser, '/#graph-rag', { reducedMotion: 'reduce' });
  await settle(page, 600);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const counts = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const m = await cdp.send('Performance.getMetrics');
    const get = (n) => m.metrics.find((x) => x.name === n).value;
    return { nodes: get('Nodes'), listeners: get('JSEventListeners'), heapMB: +(get('JSHeapUsedSize') / 1e6).toFixed(1) };
  };
  const visit = async () => {
    await page.locator('main .book a.run').first().click();
    await page.waitForFunction(() => !!document.querySelector('.overlay')); // no element handle: one would keep the overlay alive
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.overlay'));
    await settle(page, 0);
  };
  for (let i = 0; i < 3; i++) await visit();
  const start = await counts();
  for (let i = 0; i < 30; i++) await visit();
  const end = await counts();
  console.log(`# in-app memory: start ${JSON.stringify(start)} end ${JSON.stringify(end)}`);
  assert.ok(end.nodes < start.nodes * 1.2 + 100, `DOM nodes ${start.nodes} -> ${end.nodes}`);
  assert.ok(end.listeners < start.listeners * 1.2 + 30, `listeners ${start.listeners} -> ${end.listeners}`);
  assert.ok(end.heapMB < start.heapMB * 1.5 + 3, `heap ${start.heapMB} -> ${end.heapMB} MB`);
  assert.deepEqual(page.problems(), []);
  await page.context().close();
});
