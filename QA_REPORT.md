# QA report — release audit of ansh-66.github.io

**Date:** 26 Oct 2026 · **Branch:** `dev` · **Audited build:** `3170fd8` plus the test-suite commit (no further app changes)
**Verdict:** **CONDITIONAL PASS — HUMAN REVIEW REQUIRED** (see [Release verdict](#release-verdict))

## Summary

The site was built, served the way GitHub Pages serves it, and driven in a real Chromium: every route, every page of
the notebook and of the three entry books, at 44 viewports, by mouse, keyboard, wheel and touch, in both themes, with
reduced motion, offline, with fonts, styles or script missing, and over long sessions. 47 automated tests now cover it.

- **Found and fixed:** 1 P1 (fast page turns could freeze the book), 2 P2 (keyboard focus escaping the entry dialog;
  pages that couldn't be scrolled by keyboard), 4 P3. All re-tested with the check that found them.
- **Open, needing your decision:** 1 P2 (two resume lines contradict the site) and 8 P3 items. None blocks release.
- **Not testable here:** Firefox and WebKit (Safari) — the environment blocks the browser download; real devices;
  the LinkedIn and Google Drive links; the deployed site's headers.

## Environment

| | |
|---|---|
| Machine | Linux container, no GPU (Chromium renders in software, so frame times are pessimistic) |
| Runtime | Node 22.22.0, npm 10.9.4 |
| Browser | Chromium 153.0.8010.12, headless, driven by Playwright 1.56.1 (the project's own devDependency) |
| Tools added for the audit only (not project dependencies) | axe-core 4.10.3, Lighthouse 12.6.1 |
| Server | A local static server that mimics GitHub Pages: folder `index.html`, 301 to add a folder's slash, `404.html` with status 404; a second variant adds GitHub Pages' gzip and 10-minute cache for the performance runs |
| Not available | Firefox and WebKit: `playwright install firefox webkit` was refused by the network policy (host `playwright.download.prss.microsoft.com` not allowed). External hosts (LinkedIn, Google Drive, github.com pages) are also blocked |

## What the site is (discovery)

A static React 18 + React Router 7 site built with Vite 8 and prerendered to one HTML file per URL. No backend, no
API calls, no forms, no environment variables, no analytics or third-party scripts; fonts self-hosted.

| Route | Content |
|---|---|
| `/` | The notebook: 7 chapters on 14 pages (`#intro`, `#experience`, `#reservation-agent`, `#graph-rag`, `#rag-from-scratch`, `#single-vs-multi-agent`, `#contact`), a front cover (first load) and a back cover (`#end`) |
| `/work/reservation-agent/` | Entry book, 10 pages, over the notebook |
| `/work/graph-rag/` | Entry book, 12 pages |
| `/work/rag-from-scratch/` | Entry book, 6 pages |
| anything else | `404.html`: the notebook with "That page isn’t in the notebook" |
| `/Ansh_Kumar_Singh_Resume.pdf`, `/favicon.svg`, and now `/robots.txt`, `/sitemap.xml` | Static files |

Interactive parts: the covers; page turns by corner button, arrow and Page keys, mouse wheel / trackpad, touch swipe;
contents in three forms (margin on spreads, a ribbon panel on phones, a chapter picker on tablets); entry books with
four ways out (×, Escape, "Back to the notebook", browser back); the trace replay (6 conversations, play/pause, step,
replay); the cause filters, arm bars and question tabs in the entry books; copy email (with a fallback when the
clipboard is refused); the theme toggle (stored in `localStorage`); external links to GitHub, LinkedIn, a Drive video.

**Baseline before any change** (`50a07c6`): `npm ci` and `npm run build` clean (JS 267 KB / 85 KB gzipped, CSS 43 KB,
16 font files), `npm audit` 0 vulnerabilities, no source maps. No tests, no lint, no type checking existed. No
`robots.txt` or `sitemap.xml`.

## Coverage

| Area | Done | How |
|---|---|---|
| Routes, status codes, prerendered HTML, metadata, assets | ✅ | `routes.test.mjs` (11 tests) |
| Navigation, every way in and out, history, abuse | ✅ | `navigation.test.mjs` (20 tests) |
| Responsive: 44 viewports incl. every breakpoint ±1, zoom 80–200%, pixel ratio 1–3, landscape phones | ✅ | `run-matrix.mjs`: 2,120 spreads, every one screenshotted and measured |
| Accessibility: axe on every spread, both themes, desktop and phone; keyboard; focus; announcements; reduced motion | ✅ | `a11y.test.mjs` (6 tests) |
| Resilience: missing fonts/CSS/JS, slow network, offline, rotation mid-turn, long sessions and memory | ✅ | `resilience.test.mjs` (8 tests) |
| Performance: Lighthouse (mobile and desktop), INP by Event Timing, frame rate | ✅ | Scripts, results below |
| Security and privacy: secrets (source, build, full git history), sinks, links, storage, PDF | ✅ | Static scans |
| Firefox, WebKit/Safari | ❌ blocked | Browser download refused by the network policy |
| Real devices (iOS Safari, Android Chrome) | ❌ blocked | None available |
| External links resolve | ⚠️ partial | GitHub repos confirmed public through the GitHub API; LinkedIn and Drive unreachable from here |
| Deployed site headers | ❌ not done | Not deployed; GitHub Pages controls the headers anyway |
| Forms, server validation, API load, auth | n/a | The site has none |

**Automated tests: 47 run, 47 pass, 0 fail, 0 skipped** (with `AXE_PATH` set; without axe-core 1 test skips).
Before the fixes, 6 of these failed on real defects.

## Follow-up, same day

After the first report, with your decisions:

| Item | Outcome |
|---|---|
| QA-11 resume, QA-16 notes | You are fixing these yourself |
| QA-12 share image | Not wanted for now |
| QA-13 Content Security Policy | **Fixed.** A `<meta>` policy on every page: scripts only from the site and the one inline head script, by its SHA-256 hash (computed by the prerender, so it can't go stale); styles, images, fonts and connections from the site only (inline style attributes allowed: the prerendered bar charts use them); no objects, frames, forms or `<base>` changes. Tested: an injected inline script is refused, and a full journey (cover, turns, an entry, theme) causes no violation. Framing (`frame-ancestors`) still can't be set: it only works as a header, and GitHub Pages sends none |
| QA-14 slow corner clicks | **Fixed.** A turn is now drawn as a React transition, so the click or key is answered before React draws the turning page. Slowest corner click (3 sessions of 8): desktop 4× CPU 208–280 ms → 24–40 ms; desktop 1× 104–120 → 24 ms; phone 4× CPU 96–112 → 24–32 ms. The turning page also appears sooner at 4× CPU (median 88 → 36 ms after the click) and 13 ms later at normal speed (14 → 27 ms); frame times during the turn are unchanged. The frozen-turn reproduction still gives 0 of 30 |
| Trace console navigation (new request) | **Added:** ‹ › arrows either side of the request chips scroll the row a whole chip at a time; each is disabled when there's nothing more that way. On phones, a chip wider than the row wraps onto two lines instead of being cut off (desktop chips are unchanged). This makes the console about 20 px taller on phones: the console page now scrolls inside itself by 1 px at 375×812 (was 0), 54 px at 360×800 (was 34) and 349 px at 320×568 (was 286) |

## Defects

Severity follows actual impact. "Fixed" means re-tested with the check that found it.

### QA-01 · P1 · Fast page turns could freeze the book — **Fixed** (`5fe63e0`)

- **Reproduce (old build):** desktop, `/#intro`, press → four times and ← once, repeated 30 times, 15 ms apart (or click the page corner rapidly). In 3 of 12 runs a turning page stayed on screen and no key, click or swipe turned the book again until a reload.
- **Root cause:** when a turn landed, `settling` became `true`; two frames later the clean-up set `busy = false` and queued `setFlip(null)` and `setSettling(false)`. A key press or click in the instant before React applied those started a new turn — and React renders a discrete event's update ahead of updates queued from `requestAnimationFrame`. The new turn committed while `settling` was still `true`, so when it landed, `setSettling(true)` changed nothing, the settle effect never re-ran, and `busy` stayed `true`. Confirmed by instrumenting the turn life cycle in a debug build.
- **Fix:** `landed` holds the turn object that landed instead of a boolean, so every landing is a new value; the clean-up clears only that turn's leaf.
- **Retest:** 0 of 30 runs froze. Regression test "fast key presses never leave a page stuck mid-turn" fails on the old build and passes on the new one.
- **Note:** this also explains an intermittent "leaf stuck" result seen in earlier sessions and put down to test timing at the time.

### QA-02 · P2 · Keyboard focus escaped the entry dialog — **Fixed** (`3170fd8`)

- **Reproduce:** open `/work/graph-rag/`, press Tab repeatedly: focus reached Resume, Intro, Experience… in the notebook behind the dialog (marked `aria-modal="true"`), invisible to a sighted keyboard user. axe also reported `landmark-unique` on 28 views (the notebook's "Contents" navigation behind the entry's own).
- **Fix:** `inert` on `<main>` while an entry is open.
- **Retest:** 50 Tabs and 50 Shift+Tabs at desktop and phone width never leave the dialog; `landmark-unique` 0. Closing an entry still returns focus to "Run the full entry" (tested for all three entries, all four ways out).

### QA-03 · P2 · Scrolling pages and tables unreachable by keyboard — **Fixed** (`3170fd8`)

- **Reproduce:** at phone width, pages whose text scrolls inside them (32 views) and the cause table that scrolls sideways (2 views) had no keyboard way to scroll (axe `scrollable-region-focusable`, serious; WCAG 2.1.1).
- **Fix:** while one of them overflows, it takes a Tab stop (checked with a `ResizeObserver`), so ↑/↓ (or ←/→ in a table) scroll it; ← → on a page still turn pages.
- **Retest:** axe 0 on every spread.

### QA-04 · P3 · A failed script load left the home page shut — **Fixed** (`3170fd8`)

- **Reproduce:** block `/assets/index-*.js` and load `/`. The head script had already shut the cover, and only the app can open it: the notebook was unreachable. (With JavaScript off entirely, the head script doesn't run either, so that case was fine.)
- **Fix:** the head script lifts the cover when a script fails to load.
- **Retest:** `resilience.test.mjs` passes for `/` and `/work/graph-rag/`.

### QA-05 · P3 · No robots.txt or sitemap — **Fixed** (`3170fd8`)

The prerender now writes both from the route list; the sitemap lists exactly the 4 public URLs and the 404 page stays `noindex`.

### QA-06 · P3 · Contact email link was a small tap target — **Fixed** (`3170fd8`)

18 px tall at 360 wide (under WCAG 2.5.8's 24 px and the site's 44 px rule). An invisible layer around it makes it
44–57 px; every element's position is identical to before (diffed at 1440, 1024, 390 and 360) and no button loses any
tappable area.

### QA-07 · P3 · Nested landmark in the reading guide — **Fixed** (`3170fd8`)

The guide added on 26 Oct was an `<aside>` inside `<main>` (axe `landmark-complementary-is-top-level`). Now a `<div>`; unchanged on screen.

### Open items (not changed: they need a decision)

| ID | Sev | Finding | Why it's open | Options |
|---|---|---|---|---|
| QA-11 | **P2** | The public resume says the GoodFoods +2 came from "1 agent fix and 2 bugs in the eval" (the eval history shows 2 agent fixes and 2 eval fixes, the site now says so) and "222 names into 136 nodes" (136 are resolved entities; the graph has 126 nodes, 7 of the entities are people) | The PDF comes from your LaTeX source; recruiters read both | Correct the two lines and rebuild the PDF |
| QA-08 | P3 | No `<h1>` on the shut cover, the entry books, or spreads other than Intro (axe best practice, not WCAG) | Fixing it changes heading styles or duplicates your name | A visually hidden `<h1>` per route, or entry titles as `<h1>` |
| QA-09 | P3 | Text under the site's own 14 px rule: running heads and footers (~9.5 px on laptops), cause tags (~9 px), the question tabs' small labels (8–10 px), some `dt` labels (~10 px). Not a WCAG failure (no minimum size), but tiny | A visible design change | Raise them with `max(14px, …)` as was done for the console |
| QA-10 | P3 | Touch targets under the site's 44 px rule (all pass WCAG's 24 px): console buttons and request chips (36 px), cause filters, question tabs, the margin "Resume" link (40–42 px wide) | The console design was explicitly to stay as it is | Raise `min-height` to 44 px |
| QA-12 | P3 | No social-share image (`og:image`, Twitter card): shared links show no picture | Needs a new image | Add a 1200×630 image of the cover |
| QA-13 | P3 | **Policy fixed in the follow-up.** No Content Security Policy; the site can be framed by other sites (no `frame-ancestors`/`X-Frame-Options`; GitHub Pages can't send headers) | Hardening; low impact for a static site with no actions or user data | A `<meta>` CSP (`default-src 'self'`, plus a hash for the head script and `'unsafe-inline'` for style attributes) |
| QA-14 | P3 | **Fixed in the follow-up.** INP: a corner click that starts a two-page turn takes 112–128 ms at normal CPU (good) but 216–272 ms at 4× CPU slowdown (needs improvement) — React drawing four pages for the turn | Architectural; the turn engine was just fixed | Defer the turning leaf's content, or accept |
| QA-16 | P3 | `CLAUDE.md` lists the chapters in the old order and lacks Entry 4; `README.md` describes the footer from before the phone footer change | Your instructions file | Update the docs |
| QA-17 | P3 | The deploy workflow pins actions to tags (`@v4`), not commit SHAs | Supply-chain hardening | Pin to SHAs |

## Accessibility (WCAG 2.2 AA target)

**Automated (axe-core 4.10.3, every spread of every book; light and dark at 1440×900, light at 390×844 touch):**
before the fixes, 4 rules failed (`scrollable-region-focusable` serious; `landmark-unique`,
`landmark-complementary-is-top-level`, `page-has-heading-one` moderate). After: **0 WCAG violations**; 1 best-practice
note (`page-has-heading-one`, QA-08). Colour contrast passed in both themes.

**Checked by hand / scripted beyond axe:** a keyboard-only journey (Tab to the cover, Enter, arrows, Tab to "Run the
full entry", Enter, focus lands on ×, Escape returns focus); a visible focus ring on every Tab stop (45 stops on the
notebook and an entry); focus contained in the entry dialog; the live region announces "Experience, 2 of 7" after a
turn; nothing on a hidden page is focusable; reduced motion swaps pages with no turn and shows the trace in full;
Escape closes the phone contents panel and returns focus to the ribbon. Zoom 200% (720×450 CSS px) and 320 px width
reflow with no horizontal scrolling (matrix). Not done: a real screen reader (NVDA/VoiceOver) session.

## Performance

Lighthouse 12.6.1, Chromium 153, local server with GitHub Pages' gzip and cache; 3 runs each, median shown.
Mobile = Lighthouse default (Moto G Power, slow 4G: 150 ms RTT, 1.6 Mbps, 4× CPU). Lab numbers, not field data.

| Page | Preset | Perf | LCP | FCP | CLS | TBT |
|---|---|---|---|---|---|---|
| `/` | mobile | 97 | 2.3 s | 1.9 s | 0 | 10 ms |
| `/work/graph-rag/` | mobile | 96 | 2.3 s | 2.0 s | 0 | 60 ms |
| `/` | desktop | 100 | 0.5 s | 0.4 s | 0 | 0 ms |
| `/work/graph-rag/` | desktop | 100 | 0.5 s | 0.5 s | 0.002 | 0 ms |

Accessibility, Best Practices and SEO: 100 in every run that measured them (the desktop runs above, and one uncompressed mobile run per page; the compressed mobile runs measured performance only). Without compression (a plain static server), mobile drops to
84–85 (LCP 3.4–3.7 s): GitHub Pages compresses, so the table above is the realistic one. LCP has little headroom on
mobile (2.3–2.4 s against 2.5 s); the CSS and fonts are the critical path.

**INP (Event Timing, real clicks and keys):** worst interaction 112–128 ms (desktop), 136 ms (phone, 4× CPU), 216–272 ms
(desktop, 4× CPU) — QA-14. **Frame rate:** page turns run at 60 fps (median 16.7 ms) on phones even at 4× CPU; desktop
cover turns drop about 11–13 frames per turn in this GPU-less browser (9–11 before the 26 Oct cover change).
**Memory:** 30 entry visits in one session: DOM nodes 420 → 420, listeners 187 → 187, heap 3.4 → 3.8 MB; 200 turns plus
30 visits: nodes 435 → 532 (different spreads), no growth trend. (An apparent leak in the first measurement was the
test's own Playwright element handles keeping nodes alive — found with a heap snapshot and fixed in the test.)
**Bundle:** one JS file (267 KB, 85 KB gzipped), one CSS file (43 KB, 10 KB gzipped), fonts preloaded for the three
faces above the fold; no layout shift as fonts load (CLS 0).

## Security and privacy

- No secrets, tokens, keys or phone numbers in the source, the build output, or any commit in the git history (pattern scan of `git log --all -p`).
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function`; prerendered titles and descriptions are escaped.
- No third-party scripts, analytics or trackers; fonts self-hosted; no source maps published; no mixed content.
- External links: all `https`, `target="_blank"`, `rel="noopener noreferrer"`.
- Storage: only the theme choice in `localStorage`; the site works when storage throws.
- The resume PDF: no JavaScript, no author metadata, no phone number, no client names.
- `npm audit`: 0 vulnerabilities. Dependencies: 7 runtime, 3 dev.
- The one `http://localhost` string in the bundle is React Router's internal base URL for parsing, not a link.
- Content Security Policy on every page (follow-up). Still open: the site can be framed (needs a header), QA-17 (actions pinned to tags). Runtime headers of the deployed site not checked.

## SEO and metadata

Every route has a unique `<title>`, description, canonical URL, Open Graph title/description/URL, `lang="en"`, a
favicon and `theme-color`; the 404 page is `noindex`; content is in the HTML before JavaScript runs. Lighthouse SEO 100.
Added: `robots.txt` and `sitemap.xml`. Open: no share image (QA-12), no `<h1>` beyond the intro (QA-08).

## Responsive

44 viewports (`TEST_MATRIX.md`): 3440×1440 down to 320×568, phones sideways down to 568×320, short screens,
1 px either side of every breakpoint in `styles.css` (420, 600, 900 wide; 500 tall; aspect 11/10), browser zoom 80–200 %
(as the CSS viewport and pixel ratio a 1440×900 window gets), pixel ratios 1, 2 and 3, touch on tablets and phones.
Every page of every book was turned to and measured, and screenshotted (2,120 screenshots in `screenshots/matrix/`).

**44 of 44 viewports pass every hard check:** no page-level scrollbar, nothing sticking out of a page, no clipped
text, no running head or footer under a button, no tap target under 24 px, no errors. Pages whose words don't fit
scroll inside themselves, as `CLAUDE.md` allows (most on landscape phones and at 200 % zoom). Still under the site's
own stricter rules: text under 14 px (QA-09) and targets under 44 px (QA-10).

## Release verdict

**CONDITIONAL PASS — HUMAN REVIEW REQUIRED.**

The production build succeeds, every critical journey passes, and no P0 or P1 defect remains (the one P1 is fixed and
covered by a regression test). It is not a full PASS because:

1. **Firefox and Safari/WebKit were not tested** (environment limitation). The 3D page and cover turns are the most
   engine-sensitive part of the site; check them by hand (`PRODUCTION_RELEASE_CHECKLIST.md` §3).
2. **No real devices** were used; touch was emulated.
3. **The LinkedIn and demo-video links** could not be reached from here.
4. **QA-11 (P2)**: two resume lines contradict the site.

A passing audit doesn't prove the absence of bugs: it covers what is listed above, in one browser engine.

## Commands used

```bash
npm ci && npm run build && npm audit
PW_CHROMIUM=/opt/pw-browsers/chromium AXE_PATH=…/axe-core/axe.min.js npm test
PW_CHROMIUM=/opt/pw-browsers/chromium npm run test:matrix
CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse http://localhost:4325/ --only-categories=performance,accessibility,best-practices,seo [--preset=desktop]
```
