// Every way through the books: the covers, page turns by button, key, wheel and swipe, the contents in each of
// its three forms, deep links, the entry books' four ways out, browser history, and abuse (mashing, resizing and
// switching theme mid-turn).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, open, settle, state, BASE, CHAPTERS, ENTRIES } from './support.mjs';

let server, browser;
before(async () => {
  server = await serve();
  browser = await launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});
const still = { reducedMotion: 'reduce' };
const done = async (page) => {
  assert.deepEqual(page.problems(), []);
  await page.context().close();
};

test('the front cover opens by click, Enter, arrow key and a sideways swipe', async () => {
  for (const how of ['click', 'enter', 'key', 'wheel']) {
    const page = await open(browser, '/');
    await page.waitForTimeout(400);
    assert.equal((await state(page)).shut, 'front');
    if (how === 'click') await page.click('.cover-open');
    if (how === 'enter') {
      await page.focus('.cover-open');
      await page.keyboard.press('Enter');
    }
    if (how === 'key') await page.keyboard.press('ArrowRight');
    if (how === 'wheel') {
      await page.mouse.move(700, 450);
      // up and down never turn a page or open the cover
      for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 40);
      await settle(page, 300);
      assert.equal((await state(page)).shut, 'front', 'a vertical wheel leaves the cover shut');
      await page.waitForTimeout(200);
      for (let i = 0; i < 10; i++) await page.mouse.wheel(40, 0);
    }
    await settle(page, 300);
    const s = await state(page);
    assert.equal(s.shut, false, how);
    assert.deepEqual(s.pages, ['Page 1', 'Page 2'], how);
    await done(page);
  }
});

test('turning forward visits every chapter in order, closes on the back cover, and comes back to the start', async () => {
  // with reduced motion the notebook skips its cover and opens on the first spread
  const page = await open(browser, '/', still);
  await page.waitForTimeout(300);
  const seen = [(await state(page)).hash || '#intro'];
  for (let i = 0; i < 12; i++) {
    await page.click('.book .corner.next');
    await settle(page);
    const s = await state(page);
    seen.push(s.shut === 'back' ? '#end' : s.hash || '#intro');
    if (s.shut === 'back') break;
  }
  assert.deepEqual(seen, [...CHAPTERS.map((c) => '#' + c), '#end']);
  await page.click('.cover-restart');
  await settle(page);
  const s = await state(page);
  assert.equal(s.shut, false);
  assert.deepEqual(s.pages, ['Page 1', 'Page 2']);
  // back from the first spread shuts the front cover again
  await page.keyboard.press('ArrowLeft');
  await settle(page);
  assert.equal((await state(page)).shut, 'front');
  await done(page);
});

test('every chapter link opens its spread, directly and after a reload', async () => {
  for (const [k, id] of CHAPTERS.entries()) {
    const page = await open(browser, `/#${id}`, still);
    await settle(page, 300);
    const want = [`Page ${2 * k + 1}`, `Page ${2 * k + 2}`];
    assert.deepEqual((await state(page)).pages, want, id);
    await page.reload();
    await settle(page, 300);
    assert.deepEqual((await state(page)).pages, want, `${id} after reload`);
    await done(page);
  }
  const page = await open(browser, '/#end', still);
  await settle(page, 300);
  assert.equal((await state(page)).shut, 'back');
  await done(page);
});

test('an unknown hash opens the first spread without errors', async () => {
  const page = await open(browser, '/#no-such-chapter', still);
  await settle(page, 300);
  assert.deepEqual((await state(page)).pages, ['Page 1', 'Page 2']);
  await done(page);
});

test('the margin contents turns to each chapter (desktop)', async () => {
  const page = await open(browser, '/#intro', still);
  await settle(page, 300);
  for (const [k, id] of CHAPTERS.entries()) {
    await page.locator('.book .page.left .margin nav a').nth(k).click();
    await settle(page);
    assert.ok(k === 0 ? ['', '#intro'].includes((await state(page)).hash) : (await state(page)).hash === `#${id}`, id);
    assert.equal(await page.locator('.book .page.left .margin nav a[aria-current="true"]').count(), 1);
  }
  await done(page);
});

test('the phone contents ribbon opens, turns to a chapter, closes on Escape and returns focus', async () => {
  const page = await open(browser, '/#intro', { ...still, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await settle(page, 300);
  const ribbon = page.locator('.book .ribbon');
  await ribbon.click();
  assert.equal(await ribbon.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await ribbon.getAttribute('aria-expanded'), 'false');
  assert.ok(await ribbon.evaluate((el) => el === document.activeElement), 'focus back on the ribbon');
  await ribbon.click();
  await page.locator('.toc-panel.open nav a', { hasText: 'Entry 2' }).click();
  await settle(page);
  const s = await state(page);
  assert.equal(s.hash, '#graph-rag');
  assert.deepEqual(s.pages, ['Page 7']);
  assert.equal(await ribbon.getAttribute('aria-expanded'), 'false');
  await done(page);
});

test('the tablet chapter picker turns to a chapter and closes an entry', async () => {
  const page = await open(browser, '/#intro', { ...still, viewport: { width: 820, height: 1180 } });
  await settle(page, 300);
  await page.locator('main .book-bar select').selectOption({ label: 'Contact' });
  await settle(page);
  assert.equal((await state(page)).hash, '#contact');
  await page.goto(BASE + '/work/graph-rag/');
  await settle(page, 500);
  await page.locator('.overlay .book-bar select').selectOption({ label: '← Back to the notebook' });
  await page.waitForTimeout(500);
  const s = await state(page);
  assert.equal(s.overlay, false);
  assert.equal(s.hash, '#graph-rag');
  await done(page);
});

for (const way of ['×', 'Escape', 'Back to the notebook', 'browser back']) {
  test(`an entry opened from its spread closes with ${way} onto the same spread`, async () => {
    for (const id of ENTRIES) {
      const page = await open(browser, `/#${id}`);
      await settle(page, 400);
      await page.locator('.book a.run').first().click();
      await page.waitForURL(`**/work/${id}/`);
      await settle(page, 900);
      assert.ok((await state(page)).overlay);
      if (way === '×') await page.click('.overlay .close');
      if (way === 'Escape') await page.keyboard.press('Escape');
      if (way === 'Back to the notebook') await page.click('.overlay .page.left .mback');
      if (way === 'browser back') await page.goBack();
      await page.waitForFunction(() => !document.querySelector('.overlay'));
      await settle(page, 200);
      const s = await state(page);
      assert.equal(s.path, '/', `${id} ${way}`);
      assert.equal(s.hash, `#${id}`, `${id} ${way}`);
      const k = CHAPTERS.indexOf(id);
      assert.deepEqual(s.pages, [`Page ${2 * k + 1}`, `Page ${2 * k + 2}`], `${id} ${way}`);
      if (way !== 'browser back') {
        const focused = await page.evaluate(() => document.activeElement?.className);
        assert.match(String(focused), /run/, `${id} ${way}: focus returns to "Run the full entry"`);
      }
      await done(page);
    }
  });
}

test('back and forward through an entry, several times, never leaves a stale overlay', async () => {
  const page = await open(browser, '/#graph-rag');
  await settle(page, 400);
  await page.locator('.book a.run').first().click();
  await page.waitForURL('**/work/graph-rag/');
  for (let i = 0; i < 4; i++) {
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('.overlay'));
    await page.goForward();
    await page.waitForSelector('.overlay');
  }
  await settle(page, 900);
  assert.equal(await page.locator('.overlay').count(), 1);
  await page.goBack();
  await page.waitForFunction(() => !document.querySelector('.overlay'));
  assert.equal((await state(page)).hash, '#graph-rag');
  await done(page);
});

test('an entry book turns through every page and shuts on its back cover', async () => {
  for (const id of ENTRIES) {
    const page = await open(browser, `/work/${id}/`, still);
    await settle(page, 600);
    let turns = 0;
    // the corners go once the book is shut on its back cover
    while ((await state(page)).shut !== 'back' && turns < 20) {
      await page.keyboard.press('ArrowRight');
      await settle(page);
      turns++;
    }
    assert.equal((await state(page)).shut, 'back', id);
    assert.ok(turns >= 3, `${id} has pages`);
    await done(page);
  }
});

test('touch swipes turn pages both ways on a phone', async () => {
  const page = await open(browser, '/#experience', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await settle(page, 400);
  const box = await page.locator('main .book').boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const swipe = async (x0, x1) => {
    const y = box.y + 80;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / 6, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(100);
    await settle(page, 200);
  };
  const before = (await state(page)).pages;
  await swipe(box.x + box.width * 0.8, box.x + box.width * 0.2);
  const after1 = (await state(page)).pages;
  assert.notDeepEqual(after1, before);
  await swipe(box.x + box.width * 0.2, box.x + box.width * 0.8);
  assert.deepEqual((await state(page)).pages, before);
  await done(page);
});

test('abuse: mashed keys and clicks, theme switches and resizes mid-turn leave a settled, correct book', async () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await open(browser, '/#intro', { viewport: vp });
    await settle(page, 400);
    for (let i = 0; i < 30; i++) await page.keyboard.press(i % 5 === 4 ? 'ArrowLeft' : 'ArrowRight', { delay: 15 });
    await settle(page, 300);
    for (let i = 0; i < 8; i++) await page.locator('main .book .corner.prev').click({ force: true }).catch(() => {});
    await settle(page, 300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.evaluate(() => document.querySelector('.book-theme button, .book-bar .iconbtn')?.click());
    await page.setViewportSize(vp.width > 900 ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.waitForTimeout(150);
    await page.setViewportSize(vp);
    await settle(page, 400);
    const s = await state(page);
    assert.ok(s.pages.length >= 1 || s.shut, `book shows something (${JSON.stringify(s)})`);
    const words = await page.locator('main .book').innerText();
    assert.ok(words.length > 30, 'not blank');
    await done(page);
  }
});

test('copy email: copies when allowed, selects the address when the clipboard is refused', async () => {
  const ok = await open(browser, '/#intro', { ...still, permissions: ['clipboard-read', 'clipboard-write'] });
  await settle(ok, 300);
  const btn = ok.locator('.intro .btn.solid');
  await btn.click();
  await ok.waitForTimeout(100);
  assert.equal(await btn.innerText(), 'Email copied');
  assert.equal(await ok.evaluate(() => navigator.clipboard.readText()), 'anshkumarsingh107@gmail.com');
  await done(ok);
  const no = await open(browser, '/#contact', still);
  await settle(no, 300);
  await no.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await no.locator('.contact button', { hasText: 'Copy email' }).click();
  await no.waitForTimeout(100);
  assert.match(await no.locator('.contact button.btn').first().innerText(), /Selected/);
  assert.equal(await no.evaluate(() => String(getSelection()).replace(/​/g, '')), 'anshkumarsingh107@gmail.com');
  await done(no);
});

test('the theme toggle switches and survives a reload; broken storage does not break the page', async () => {
  // light by default, even on a system set to dark
  const page = await open(browser, '/#intro', { ...still, colorScheme: 'dark' });
  await settle(page, 300);
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim().toUpperCase()), '#F5F8F0');
  await page.locator('.book-theme button').first().click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await page.reload();
  await settle(page, 300);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await done(page);
  const ctx = await browser.newContext(still);
  await ctx.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage disabled'); } });
  });
  const p2 = await ctx.newPage();
  const errs = [];
  p2.on('pageerror', (e) => errs.push(e.message));
  await p2.goto(BASE + '/#intro');
  await p2.waitForTimeout(800);
  await p2.locator('.book-theme button').first().click();
  assert.equal(await p2.evaluate(() => document.documentElement.dataset.theme === 'dark' || document.documentElement.dataset.theme === 'light'), true);
  assert.deepEqual(errs, []);
  await ctx.close();
});

test('figures: filters, tabs and the trace console respond, by mouse and keyboard', async () => {
  const page = await open(browser, '/work/reservation-agent/', still);
  await settle(page, 600);
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await settle(page);
  const filters = page.locator('.overlay .filters .filter');
  assert.ok((await filters.count()) >= 4, 'cause filters');
  await filters.nth(1).click();
  assert.equal(await filters.nth(1).getAttribute('aria-pressed'), 'true');
  assert.ok((await page.locator('.overlay .cause-table tr.dim').count()) > 0, 'other causes dim');
  await done(page);

  const g = await open(browser, '/work/graph-rag/', still);
  await settle(g, 600);
  for (let i = 0; i < 6 && !(await g.locator('.overlay .qx-tab').count()); i++) {
    await g.keyboard.press('ArrowRight');
    await settle(g);
  }
  const tabs = g.locator('.overlay .qx-tab');
  assert.ok((await tabs.count()) >= 5, 'question tabs');
  await tabs.nth(2).click();
  assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true');
  await g.keyboard.press('ArrowRight'); // inside the tablist this moves between tabs, not pages
  assert.equal(await tabs.nth(3).getAttribute('aria-selected'), 'true');
  assert.equal(await g.evaluate(() => document.activeElement.id), await tabs.nth(3).getAttribute('id'));
  await done(g);

  const t = await open(browser, '/#intro');
  await settle(t, 300);
  const play = t.locator('.console .console-play .cbtn').first();
  await t.waitForTimeout(1500);
  assert.equal(await play.innerText(), 'Pause');
  await play.click();
  const step = await t.locator('.console .step').innerText();
  await t.waitForTimeout(2500);
  assert.equal(await t.locator('.console .step').innerText(), step, 'paused');
  await t.locator('.console .req').nth(3).click();
  assert.equal(await t.locator('.console .req').nth(3).getAttribute('aria-pressed'), 'true');
  await done(t);
});

test('every link on every page: internal ones resolve, external ones open safely in a new tab', async () => {
  const seen = new Map();
  const collect = async (page, where) => {
    for (const a of await page.evaluate(() =>
      [...document.querySelectorAll('.book a[href], .overlay a[href]')]
        .filter((a) => a.getClientRects().length)
        .map((a) => ({ href: a.getAttribute('href'), abs: a.href, target: a.target, rel: a.rel, text: a.textContent.trim().slice(0, 50) }))
    ))
      if (!seen.has(a.abs)) seen.set(a.abs, { ...a, where });
  };
  const walk = async (url) => {
    const page = await open(browser, url, still);
    await settle(page, 600);
    for (let i = 0; i < 25; i++) {
      await collect(page, `${url} ${JSON.stringify((await state(page)).pages)}`);
      const next = page.locator('.overlay .corner.next, main:not(.behind) .book .corner.next').first();
      if (await next.isDisabled()) break;
      await next.click();
      await settle(page);
    }
    await collect(page, `${url} back cover`);
    await page.context().close();
  };
  await walk('/#intro');
  for (const e of ENTRIES) await walk(`/work/${e}/`);
  assert.ok(seen.size > 10, 'links found');
  for (const [abs, a] of seen) {
    assert.ok(a.href && a.href !== '#', `empty link in ${a.where}`);
    if (abs.startsWith('mailto:')) assert.equal(abs, 'mailto:anshkumarsingh107@gmail.com');
    else if (abs.startsWith(BASE)) {
      const res = await fetch(abs, { method: 'HEAD' });
      assert.equal(res.status, 200, `${abs} from ${a.where}`);
    } else {
      assert.match(abs, /^https:\/\//, `${abs} is https`);
      assert.equal(a.target, '_blank', `${abs} opens in a new tab`);
      assert.match(a.rel, /noopener/, `${abs} has rel=noopener`);
    }
  }
});

// Regression: a turn started in the moment between one turn landing and React applying its clean-up used to
// leave the book frozen with a leaf on screen (about 1 in 4 bursts of fast key presses). Ten bursts, each must settle.
test('fast key presses never leave a page stuck mid-turn', async () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await open(browser, '/#intro', { viewport: vp });
    await settle(page, 400);
    for (let burst = 0; burst < 5; burst++) {
      for (let i = 0; i < 30; i++) await page.keyboard.press(i % 5 === 4 ? 'ArrowLeft' : 'ArrowRight', { delay: 15 });
      await settle(page, 100); // throws if a leaf is still there after 5s
      const before = await state(page);
      await page.keyboard.press(before.shut === 'back' ? 'ArrowLeft' : 'ArrowRight');
      await settle(page, 100);
      assert.notDeepEqual(await state(page), before, `the book still turns after burst ${burst}`);
    }
    await done(page);
  }
});

test('the trace console arrows reach every request a whole chip at a time; phones swipe instead', async () => {
  const page = await open(browser, '/#intro', still);
  await settle(page, 300);
  const c = page.locator('.console:visible').first();
  const [back, more] = [c.locator('.req-arrow').nth(0), c.locator('.req-arrow').nth(1)];
  assert.equal(await back.isDisabled(), true, 'nothing before the first request');
  const seen = new Set();
  const fully = () => c.evaluate((el) => {
    const r = el.querySelector('.requests').getBoundingClientRect();
    return [...el.querySelectorAll('.req')].map((q, i) => [i, q.getBoundingClientRect()]).filter(([, b]) => b.left >= r.left - 1 && b.right <= r.right + 1).map(([i]) => i);
  });
  for (let i = 0; i < 12 && !(await more.isDisabled()); i++) {
    (await fully()).forEach((k) => seen.add(k));
    await more.click();
    await page.waitForTimeout(100);
  }
  (await fully()).forEach((k) => seen.add(k));
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4, 5], 'every request seen whole');
  assert.equal(await back.isDisabled(), false);
  await c.locator('.req').nth(5).click();
  assert.equal(await c.locator('.req').nth(5).getAttribute('aria-pressed'), 'true');
  await done(page);

  // on a phone there are no arrows: a sideways swipe on the chips scrolls them, and doesn't turn the page
  const phone = await open(browser, '/#intro', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await settle(phone, 300);
  if (!(await phone.locator('.console:visible').count())) {
    await phone.keyboard.press('ArrowRight');
    await settle(phone, 300);
  }
  const pc = phone.locator('.console:visible').first();
  assert.equal(await pc.locator('.req-arrow:visible').count(), 0, 'no arrows on a phone');
  const row = pc.locator('.requests');
  const box = await row.boundingBox();
  const before = await state(phone);
  const cdp = await phone.context().newCDPSession(phone);
  const y = box.y + box.height / 2;
  const [x0, x1] = [box.x + box.width * 0.85, box.x + box.width * 0.15];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / 8, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await phone.waitForTimeout(600);
  assert.ok((await row.evaluate((e) => e.scrollLeft)) > 50, 'the chips scrolled');
  assert.deepEqual(await state(phone), before, 'the page did not turn');
  await done(phone);
});
