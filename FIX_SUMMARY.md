# Fix summary — release audit, 26 Oct 2026

Fixes made during the audit in `QA_REPORT.md`. Each was reproduced first, fixed at its root, and re-tested with the
same check that found it. The design, copy and content are unchanged: no fix moves anything on screen.

## Commits

| Commit | What |
|---|---|
| `5fe63e0` | QA-01: fast page turns could freeze the book |
| `3170fd8` | QA-02 to QA-07: dialog focus, keyboard scrolling, nested landmark, script failure, robots/sitemap, email tap target |
| `324d415` | The test suite (`tests/`), `npm test` / `npm run test:matrix`, and these reports |

## Files changed

| File | Change | Why |
|---|---|---|
| `src/book/Book.jsx` | `settling` (true/false) became `landed` (the turn that landed); the clean-up clears only that turn's leaf | QA-01 |
| `src/book/Book.jsx` | An effect gives a page body, wide table or code block a Tab stop while it overflows, via `ResizeObserver` | QA-03 |
| `src/App.jsx` | `inert` on `<main>` while an entry book is open | QA-02 |
| `src/book/mainBook.jsx` | The reading guide is a `<div>`, not an `<aside>` | QA-07 |
| `index.html` | The head script lifts the shut cover if a script fails to load | QA-04 |
| `scripts/prerender.js` | Writes `robots.txt` and `sitemap.xml` from the route list | QA-05 |
| `src/styles.css` | An invisible `::after` layer around the Contact email link | QA-06 |
| `package.json` | Scripts `test` and `test:matrix` only. No dependency added or changed | Test suite |
| `tests/` | New: `e2e/*.test.mjs` (45 tests), `matrix/run-matrix.mjs`, `README.md` | Test suite |

## Defects fixed, with before and after

| ID | Defect | Before | After | Regression test |
|---|---|---|---|---|
| QA-01 (P1) | A key press or click in the instant between one turn landing and React applying its clean-up started a new turn that could never settle: the leaf stayed on screen and every later turn was ignored until a reload | Mashing arrow keys: frozen in 3 of 12 runs | 0 of 30 runs | `navigation.test.mjs` › "fast key presses never leave a page stuck mid-turn": fails on the old build, passes now |
| QA-02 (P2) | Tab walked out of an open entry book into the notebook behind it; that notebook's landmarks stayed in the accessibility tree (axe `landmark-unique`) | Tab reached Resume, Intro, Experience… behind the dialog; `landmark-unique` on 28 views | Focus never leaves the dialog; 0 views | `a11y.test.mjs` › "Tab stays inside an open entry book…" and the axe scan |
| QA-03 (P2) | Pages whose text scrolls inside them, and sideways-scrolling tables, couldn't be scrolled from the keyboard (axe `scrollable-region-focusable`, serious) | 32 views (pages) + 2 (table) | 0 | axe scan |
| QA-04 (P3) | If the app's script failed to load, the home page stayed shut on its cover with nothing able to open it | Blank notebook behind a cover | The cover lifts and the prerendered pages show | `resilience.test.mjs` › "when the script fails to load…" |
| QA-05 (P3) | No `robots.txt` or `sitemap.xml` | 404 for both | Both served, the sitemap listing exactly the 4 public routes | `routes.test.mjs` › "robots.txt and the sitemap…" |
| QA-06 (P3) | The Contact page's email link was an 18–31px tall target (under WCAG 2.5.8's 24px on phones, and the site's own 44px rule) | 18px at 360 wide | 44px at 360, 57px at 1440; every element's position identical to before; no button loses any of its tap area | Measured by script (positions diffed against the old build) |
| QA-07 (P3) | The reading guide added on 26 Oct was an `<aside>` inside `<main>` (axe `landmark-complementary-is-top-level`) | 6 views | 0 | axe scan |

## Commands re-run after the fixes

```bash
npm ci && npm run build            # clean install and production build: 5 pages + robots.txt + sitemap.xml
npm audit                          # 0 vulnerabilities
npm test                           # 45/45 pass (with AXE_PATH set, so the axe scans ran)
npm run test:matrix                # 44 viewports, every spread: see TEST_MATRIX.md
```

| Check | Before fixes | After fixes |
|---|---|---|
| `npm test` | 6 tests failing on real defects (2 routes, 1 navigation, 2 accessibility, 1 resilience). Another 12 first-run failures were mistakes in the new tests themselves (5 routes, 3 navigation, 1 accessibility, 3 resilience: wrong expectations about reduced motion, entry pages' headings and the 404 page's own status, focus leaving to the browser toolbar, deferred module scripts, and Playwright element handles keeping nodes alive); each was diagnosed and the test corrected, not loosened to hide a defect | 45/45 |
| axe WCAG violations (all spreads, both themes, desktop and phone) | 4 rules (1 serious) | 0 (1 best-practice note, QA-08) |
| Frozen-turn reproduction | 3/12 | 0/30 |

## Deliberately not changed

These need a decision from you, because they change the design or the content. Each is in `QA_REPORT.md` with options.

- **QA-08** No `<h1>` on the shut cover, the entry books, or spreads other than Intro (axe best practice, not WCAG).
- **QA-09** Text under the site's 14px rule: running heads and footers (about 9.5px on laptops), cause tags, the question tabs' small labels (down to 8px).
- **QA-10** Touch targets under the site's 44px rule: console buttons and chips (36px), filters, question tabs. All pass WCAG's 24px. The console is the design you asked me not to change.
- **QA-11** Two resume lines contradict the corrected site (the +2 split; 136 vs 126 nodes). The PDF is built from your LaTeX source.
- **QA-12** No social-share image (`og:image`).
- **QA-13** No Content Security Policy (GitHub Pages can't send headers; a `<meta>` CSP is possible).
- **QA-16/17** Stale notes in `CLAUDE.md` and `README.md`; the deploy workflow's actions are pinned to tags, not commits.

## Follow-up (same day, with your decisions)

| Change | Files | Before → after | Test |
|---|---|---|---|
| Content Security Policy (QA-13) | `scripts/prerender.js` | No policy → `<meta>` policy on every page, the inline head script allowed by a hash computed at build time | `routes.test.mjs` › "the Content Security Policy…" |
| Corner clicks (QA-14) | `src/book/Book.jsx` (`setFlip` inside `startTransition`) | Slowest click at 4× CPU 208–280 ms → 24–40 ms; the turn appears sooner at 4× CPU, 13 ms later at 1× | The whole navigation suite and the frozen-turn regression (0/30) |
| Trace console arrows (new) | `src/components/TraceReplay.jsx`, `src/styles.css` | Only the first 2–3 requests were visible → ‹ › step through all six, a whole chip at a time; long chips wrap on phones | `navigation.test.mjs` › "the trace console arrows…" |
| Test helper | `tests/e2e/support.mjs` | `settle()` waits for 10 still frames, since a turn's leaf can now appear a frame or two after the key press | — |
| axe scan | `tests/e2e/a11y.test.mjs` | The scan's contexts bypass the policy (axe is injected inline); every other test keeps it | — |

`npm test`: 47/47. Quick matrix (10 viewports): all pass.
