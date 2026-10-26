# Test matrix — release audit, 26 Oct 2026

Everything below was run, not planned: on the final build of `dev`, in Chromium 153 (headless, no GPU), against a
local server that behaves like GitHub Pages. ✅ = run and passed, ❌ = could not be run here (reason given). Nothing
is marked passed because it was in a plan.

## Browser engines

| Engine | Status |
|---|---|
| Chromium 153 | ✅ Everything in this file |
| Firefox | ❌ Not run: the network policy refused the browser download (`playwright.download.prss.microsoft.com`) |
| WebKit (Safari) | ❌ Not run: same reason. No real iOS or Android device either; touch was emulated in Chromium |

## Routes × interactions (Chromium)

Test references are `file › test name` in `tests/e2e/`; all 45 tests passed in the final run (`npm test`, 228 s).

| Route | Interaction | Viewports | Result | Test |
|---|---|---|---|---|
| all 4 + `/nope` + `/404.html` | Status codes, 301 for a missing slash, 404 page | — | ✅ | routes › status codes match GitHub Pages |
| all 4 + 404 | Prerendered words, title, description, canonical, OG tags, every referenced asset 200 | — | ✅ | routes › prerendered … |
| all 4 | Words present with JavaScript off | 1440×900 | ✅ | routes › with JavaScript off… |
| all 4 + `/nope` | Hydrates with no console errors or warnings; right state (cover / entry / notice); title | 1440×900 | ✅ | routes › every route hydrates… |
| `/?utm…`, `/index.html#…`, `/work/…/?ref`, `/work/…/index.html` | Same page as the clean URL | 1440×900 | ✅ | routes › query strings… |
| `/robots.txt`, `/sitemap.xml`, resume PDF | Present, correct, a real PDF | — | ✅ | routes › robots… / the resume… |
| `/` | Front cover opens by click, Enter, → and wheel | 1440×900 | ✅ | navigation › the front cover opens… |
| `/` | Every chapter in order → back cover → "Back to the first page" → ← shuts the cover | 1440×900 | ✅ | navigation › turning forward visits… |
| `/#<each of 7 chapters>`, `/#end` | Opens the right spread, and again after a reload | 1440×900 | ✅ | navigation › every chapter link… |
| `/#no-such-chapter` | First spread, no errors | 1440×900 | ✅ | navigation › an unknown hash… |
| `/` | Margin contents → each chapter, current one marked | 1440×900 | ✅ | navigation › the margin contents… |
| `/` | Phone contents ribbon: open, Escape (focus returns), pick a chapter | 390×844 touch | ✅ | navigation › the phone contents ribbon… |
| `/`, `/work/graph-rag/` | Tablet chapter picker; "← Back to the notebook" closes an entry | 820×1180 | ✅ | navigation › the tablet chapter picker… |
| `/#<each entry>` → `/work/<each>/` | Open with "Run the full entry"; close with ×, Escape, "Back to the notebook", browser back; lands on the same spread; focus returns | 1440×900 | ✅ (12 combinations) | navigation › an entry opened from its spread closes with … |
| `/work/graph-rag/` | Back/forward ×4: no stale or duplicate overlay | 1440×900 | ✅ | navigation › back and forward… |
| `/work/<each>/` | Turn through every page to the back cover | 1440×900 | ✅ | navigation › an entry book turns through… |
| `/#experience` | Touch swipe both ways | 390×844 touch | ✅ | navigation › touch swipes… |
| `/` | 30 mashed keys, 8 rapid clicks, theme switch and resize across the breakpoint mid-turn | 1440×900, 390×844 | ✅ | navigation › abuse… |
| `/` | Fast key bursts never freeze a turn (QA-01 regression) | 1440×900, 390×844 | ✅ | navigation › fast key presses… |
| `/#intro`, `/#contact` | Copy email, and the fallback when the clipboard is refused | 1440×900 | ✅ | navigation › copy email… |
| `/#intro` | Theme toggle, survives reload; storage that throws breaks nothing | 1440×900 | ✅ | navigation › the theme toggle… |
| `/work/reservation-agent/`, `/work/graph-rag/`, `/#intro` | Cause filters; question tabs by click and ←/→; trace play/pause and requests | 1440×900 | ✅ | navigation › figures… |
| every page of every book | Every link: internal ones 200, `mailto` correct, external https + new tab + `noopener` | 1440×900 | ✅ | navigation › every link on every page… |
| every spread of every book, the cover, 404 | axe-core WCAG 2.0–2.2 A/AA + best practice: 0 WCAG violations | 1440×900 light & dark, 390×844 | ✅ | a11y › axe… |
| `/` → entry | Keyboard only: Tab, Enter, arrows, Escape; focus placement | 1440×900 | ✅ | a11y › keyboard only… |
| `/#intro`, `/work/graph-rag/` | Visible focus ring on 45 Tab stops each | 1440×900 | ✅ | a11y › every focusable thing… |
| `/work/graph-rag/` | Tab and Shift+Tab ×50 never leave the dialog (QA-02) | 1440×900, 390×844 | ✅ | a11y › Tab stays inside… |
| `/#intro` | Live region announces the chapter; hidden pages not focusable | 1440×900 | ✅ | a11y › screen readers hear… |
| `/` | Reduced motion: no cover, no turn, trace in full | 1440×900 | ✅ | a11y › reduced motion… |
| `/#intro` | Fonts blocked: fallback fonts, turns work | 1280×720 | ✅ | resilience › fonts… |
| `/`, `/work/graph-rag/` | App script blocked: prerendered pages readable, cover lifted (QA-04) | 1280×720 | ✅ | resilience › when the script fails… |
| `/#graph-rag` | Stylesheet blocked: words still there | 1280×720 | ✅ | resilience › when the stylesheet fails… |
| `/#graph-rag` | Script held back: content and no cover flash before it arrives | 1280×720 | ✅ | resilience › on a slow connection… |
| `/` → entry | Offline after load: every turn, entry open/close | 1440×900 | ✅ | resilience › offline after loading… |
| `/work/reservation-agent/` | Rotate portrait ↔ landscape mid-turn ×4 | 390×844 ↔ 844×390 | ✅ | resilience › rotating the screen… |
| `/` | 200 turns + 30 entry visits: nodes 431→532, listeners 183→199 (no trend) | 1440×900 | ✅ | resilience › a long session… |
| `/#graph-rag` | 30 entry visits in one session: nodes 420→420, listeners 188→188 | 1440×900 | ✅ | resilience › the same session… |

## Viewports × every spread (Chromium)

Generated from `screenshots/matrix/results.json` by `npm run test:matrix` on the final build. 44 viewports, 2120 spreads (every page of the notebook from the first spread to the back cover, every page of each of the three entry books, and the 404 page), Chromium 153, reduced motion, light theme.

Columns: **Scrollbar** = the page itself scrolls (px; must be 0). **Spill** = elements sticking out sideways past their page. **Clipped** = text cut off by its own box (screen-reader-only text and intended ellipses excluded). **Overlap** = running head or footer under a corner button or the theme/close buttons. **Scrolls inside** = pages whose words scroll inside the page (allowed by CLAUDE.md, with the shadow). **Smallest text** = smallest font in px on any page (the site's rule is 14; see QA-09). **Targets <24** = interactive elements under WCAG 2.5.8's 24 px. **Errors** = uncaught exceptions or console errors.

| Viewport | Spreads | Scrollbar | Spill | Clipped | Overlap | Scrolls inside | Smallest text | Targets <24 px | Errors | Result | Screenshots |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3440x1440 | 31 | 0 | 0 | 0 | 0 | 0 | 11.5 (small.) | 0 | 0 | pass | `screenshots/matrix/3440x1440/` |
| 2560x1440 | 31 | 0 | 0 | 0 | 0 | 0 | 11.5 (small.) | 0 | 0 | pass | `screenshots/matrix/2560x1440/` |
| 1920x1080 | 31 | 0 | 0 | 0 | 0 | 1 | 11.3 (small.) | 0 | 0 | pass | `screenshots/matrix/1920x1080/` |
| 1680x1050 | 31 | 0 | 0 | 0 | 0 | 2 | 11.0 (small.) | 0 | 0 | pass | `screenshots/matrix/1680x1050/` |
| 1600x900 | 31 | 0 | 0 | 0 | 0 | 3 | 9.4 (small.) | 0 | 0 | pass | `screenshots/matrix/1600x900/` |
| 1440x900 | 31 | 0 | 0 | 0 | 0 | 5 | 9.4 (small.) | 0 | 0 | pass | `screenshots/matrix/1440x900/` |
| 1366x768 | 31 | 0 | 0 | 0 | 0 | 6 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/1366x768/` |
| 1280x720 | 31 | 0 | 0 | 0 | 0 | 13 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/1280x720/` |
| 1024x768 | 31 | 0 | 0 | 0 | 0 | 14 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/1024x768/` |
| 1024x600 | 31 | 0 | 0 | 0 | 0 | 27 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/1024x600/` |
| 912x1368 | 59 | 0 | 0 | 0 | 0 | 0 | 11.5 (small.) | 0 | 0 | pass | `screenshots/matrix/912x1368/` |
| 834x1194 | 59 | 0 | 0 | 0 | 0 | 0 | 11.5 (small.) | 0 | 0 | pass | `screenshots/matrix/834x1194/` |
| 800x1280 | 59 | 0 | 0 | 0 | 0 | 0 | 11.5 (small.) | 0 | 0 | pass | `screenshots/matrix/800x1280/` |
| 768x1024 | 59 | 0 | 0 | 0 | 0 | 3 | 10.2 (small.) | 0 | 0 | pass | `screenshots/matrix/768x1024/` |
| 600x960 | 59 | 0 | 0 | 0 | 0 | 6 | 9.5 (small.) | 0 | 0 | pass | `screenshots/matrix/600x960/` |
| 480x854 | 59 | 0 | 0 | 0 | 0 | 12 | 9.7 (small.) | 0 | 0 | pass | `screenshots/matrix/480x854/` |
| 430x932 | 59 | 0 | 0 | 0 | 0 | 14 | 9.6 (small.) | 0 | 0 | pass | `screenshots/matrix/430x932/` |
| 414x896 | 59 | 0 | 0 | 0 | 0 | 14 | 9.3 (small.) | 0 | 0 | pass | `screenshots/matrix/414x896/` |
| 393x873 | 59 | 0 | 0 | 0 | 0 | 14 | 8.8 (small.) | 0 | 0 | pass | `screenshots/matrix/393x873/` |
| 390x844 | 59 | 0 | 0 | 0 | 0 | 16 | 8.7 (small.) | 0 | 0 | pass | `screenshots/matrix/390x844/` |
| 375x812 | 59 | 0 | 0 | 0 | 0 | 18 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/375x812/` |
| 360x800 | 59 | 0 | 0 | 0 | 0 | 22 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/360x800/` |
| 320x568 | 59 | 0 | 0 | 0 | 0 | 46 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/320x568/` |
| 844x390 landscape | 59 | 0 | 0 | 0 | 0 | 50 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/844x390_landscape/` |
| 740x360 landscape | 59 | 0 | 0 | 0 | 0 | 53 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/740x360_landscape/` |
| 568x320 landscape | 59 | 0 | 0 | 0 | 0 | 54 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/568x320_landscape/` |
| 1280x500 short | 59 | 0 | 0 | 0 | 0 | 34 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/1280x500_short/` |
| 420x800 | 59 | 0 | 0 | 0 | 0 | 19 | 9.1 (small.) | 0 | 0 | pass | `screenshots/matrix/420x800/` |
| 421x800 | 59 | 0 | 0 | 0 | 0 | 19 | 9.1 (small.) | 0 | 0 | pass | `screenshots/matrix/421x800/` |
| 599x900 | 59 | 0 | 0 | 0 | 0 | 5 | 10.2 (small.) | 0 | 0 | pass | `screenshots/matrix/599x900/` |
| 601x900 | 59 | 0 | 0 | 0 | 0 | 5 | 8.8 (small.) | 0 | 0 | pass | `screenshots/matrix/601x900/` |
| 899x700 | 59 | 0 | 0 | 0 | 0 | 16 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/899x700/` |
| 900x700 | 31 | 0 | 0 | 0 | 0 | 23 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/900x700/` |
| 901x780 | 31 | 0 | 0 | 0 | 0 | 15 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/901x780/` |
| 1100x1000 aspect 1.1 | 59 | 0 | 0 | 0 | 0 | 4 | 9.9 (small.) | 0 | 0 | pass | `screenshots/matrix/1100x1000_aspect_1_1/` |
| 1100x1001 aspect <1.1 | 59 | 0 | 0 | 0 | 0 | 4 | 9.9 (small.) | 0 | 0 | pass | `screenshots/matrix/1100x1001_aspect_1_1/` |
| 1200x500 | 59 | 0 | 0 | 0 | 0 | 34 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/1200x500/` |
| 1200x501 | 31 | 0 | 0 | 0 | 0 | 33 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/1200x501/` |
| zoom 80% (1800x1125) | 31 | 0 | 0 | 0 | 0 | 0 | 11.5 (small.) | 0 | 0 | pass | `screenshots/matrix/zoom_80_1800x1125_/` |
| zoom 125% (1152x720) | 31 | 0 | 0 | 0 | 0 | 17 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/zoom_125_1152x720_/` |
| zoom 150% (960x600) | 31 | 0 | 0 | 0 | 0 | 27 | 8.0 (small.) | 0 | 0 | pass | `screenshots/matrix/zoom_150_960x600_/` |
| zoom 200% (720x450) | 59 | 0 | 0 | 0 | 0 | 41 | 8.6 (small.) | 0 | 0 | pass | `screenshots/matrix/zoom_200_720x450_/` |
| 390x844 @3x | 59 | 0 | 0 | 0 | 0 | 16 | 8.7 (small.) | 0 | 0 | pass | `screenshots/matrix/390x844_3x/` |
| 1440x900 @2x | 31 | 0 | 0 | 0 | 0 | 5 | 9.4 (small.) | 0 | 0 | pass | `screenshots/matrix/1440x900_2x/` |

**44 of 44 viewports pass** every hard check (no page scrollbar, nothing spilling, clipped or overlapping, no tap target under 24 px, no errors). The smallest-text column is the open design item QA-09, not a pass/fail check.

Tap targets between 24 and 44 px (the site's own 44 px rule; QA-10), with the number of viewports where each occurs: `button.cbtn` (44), `button.req` (44), `button.filter` (44), `button.qx-tab` (32), `a.mlink` (9).


## Other measurements (not in the automated suite)

| What | Conditions | Result |
|---|---|---|
| Lighthouse mobile, `/` and `/work/graph-rag/` | Lighthouse 12.6.1 default mobile (slow 4G, 4× CPU), gzip like GitHub Pages, 3 runs each | Performance 96–97, LCP 2.3–2.4 s, CLS 0, TBT ≤ 70 ms |
| Lighthouse desktop, same pages | Desktop preset, gzip, 3 runs each | 100 / 100 / 100 / 100, LCP 0.5 s, CLS ≤ 0.002 |
| INP (Event Timing on real clicks and keys) | Desktop 1×, desktop 4× CPU, phone 4× CPU; 2 runs | Worst 112–128 ms, 216–272 ms (QA-14), 136 ms |
| Frozen-turn reproduction (QA-01) | 30 mashed keys at 15 ms, desktop and phone | Before 3/12 frozen, after 0/30 |
| Heap snapshot | 12 entry visits | No detached DOM retained by the app (the retention seen at first was the test's own element handles) |
| Contact email tap area (QA-06) | `elementFromPoint` scan at 360, 390, 1440 | 44, 46, 57 px tall; all positions identical to before; no button tap points lost |
| Secrets scan | Source, build output, full git history | Nothing found |
| External links | HTTP from this environment | GitHub repos public (GitHub API); LinkedIn and Google Drive unreachable from here: ❌ not verified |
