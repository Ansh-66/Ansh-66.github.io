# Tests

End-to-end tests of the built site in a real Chromium, served the way GitHub Pages serves it (folder `index.html`,
a 301 to add a folder's trailing slash, `404.html` with status 404 for anything else). No new dependencies: they use
Node's own test runner and the `playwright` package already in `devDependencies`.

## Run them

```bash
npm ci
npx playwright install chromium      # once per machine: the browser the tests drive
npm run build                        # the tests check the production build in dist/, not the dev server
npm test                             # 47 tests, about 6 minutes
```

Optional:

```bash
npm i --no-save axe-core@4.10.3      # turns on the axe accessibility scans (skipped without it)
npm run test:matrix                  # every page of every book at 44 viewports, with screenshots
npm run test:matrix -- --quick       # 10 key viewports, about a minute
```

The matrix writes `screenshots/matrix/<viewport>/*.png` and `screenshots/matrix/results.json` (both git-ignored).

Environment variables, all optional:

| Variable | What it does |
|---|---|
| `PW_CHROMIUM` | Path to a Chromium binary, if Playwright's own download isn't installed |
| `AXE_PATH` | Path to `axe.min.js`, if axe-core isn't in `node_modules` |
| `PORT` | Port for the local server (default 4321) |
| `DIST` | Build folder to test (default `dist`) |

## What each file covers

| File | Covers |
|---|---|
| `e2e/routes.test.mjs` | Status codes as GitHub Pages returns them; the resume PDF; robots.txt and the sitemap; each page's prerendered content, metadata and assets with JavaScript off; a clean console and the right state after hydration; query strings and `index.html` addresses |
| `e2e/navigation.test.mjs` | The cover by click, Enter, key and wheel; every chapter in order to the back cover and back; deep links and reloads; the margin contents and the contents ribbon on phones and tablets; each entry's four ways out landing on the same spread with focus restored; back/forward; touch swipes; mashing, resizing and theme switching mid-turn; the frozen-turn regression; copy email; the theme toggle and broken storage; filters, tabs and the trace console; every link on every page |
| `e2e/a11y.test.mjs` | axe (WCAG 2.0-2.2 A/AA and best practice) on every spread in both themes and at phone width; a keyboard-only journey; visible focus rings; focus kept inside an open entry; live announcements; reduced motion |
| `e2e/resilience.test.mjs` | Missing fonts, styles or script; a slow network; going offline; rotating mid-turn with an entry open; memory, DOM nodes and listeners over 200 turns and 30 entry visits |
| `matrix/run-matrix.mjs` | Not a pass/fail test: measures page-level scrollbars, things spilling out of a page, clipped text, text under 14px, small tap targets and overlaps, and saves a screenshot of every spread |

Firefox and WebKit aren't covered: the tests drive Chromium only.
