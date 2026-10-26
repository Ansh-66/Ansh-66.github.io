# Production release checklist

For deploying `dev` to https://ansh-66.github.io. Tick each item; anything unticked is a known gap, not a pass.
Items marked ✅ were verified in the audit on 26 Oct 2026 (`QA_REPORT.md`); ⬜ items still need a person.

## 1. Build and tests (on the commit being released)

- ✅ `npm ci` installs from the lockfile with no errors
- ✅ `npm run build` succeeds and prints `wrote` for `index.html`, the three `work/…/index.html`, `404.html`, and `robots.txt, sitemap.xml`
- ✅ `npm audit` reports 0 vulnerabilities
- ✅ `npm test` passes 47/47 against the build (with axe-core available so the accessibility scans run; see `tests/README.md`)
- ✅ `npm run test:matrix` shows no page-level scrollbar, no spilled element and no runtime error at any of the 44 viewports
- ⬜ Re-run all four after any further change before releasing

## 2. Decisions to make before release (from `QA_REPORT.md`)

- ⬜ **QA-11 resume:** fix the two resume lines that contradict the site, or accept the mismatch
  - "traced a +2 gain to 1 agent fix and 2 bugs in the eval": the eval history shows 2 agent fixes, 2 eval fixes
  - "222 names into 136 nodes": 136 are resolved entities; the graph has 126 nodes
- ⬜ QA-08 to QA-10, QA-12, QA-13: accept as known, or schedule (none blocks release)

## 3. What only a person can check

- ⬜ **Firefox** (desktop): open `/`, open the cover, turn through every spread, open and close each entry, switch theme
- ⬜ **Safari on macOS and iOS** (WebKit): the same, and in particular the 3D page turn and the cover turns (3D layering differs between engines; not testable here)
- ⬜ **A real Android phone** (Chrome) and **a real iPhone**: swipe to turn, the Contents ribbon, open an entry and close it with ×, the email and resume links
- ⬜ **LinkedIn** link opens https://www.linkedin.com/in/anshks while signed out
- ⬜ **Demo video** (Google Drive) opens for someone signed out of your Google account ("Anyone with the link")
- ⬜ GitHub links open the three public repos (verified public through the GitHub API; not clicked through)
- ⬜ Read the resume PDF once more as a stranger would: no phone number, no client names

## 4. GitHub Pages setup (one time)

- ⬜ Settings → Pages → Source: **GitHub Actions**
- ⬜ The deploy workflow (`.github/workflows/deploy.yml`) runs on pushes to **`main`**. The repo has no `main` yet: create it from the reviewed `dev` commit. (Running the workflow by hand on `dev` is possible, but the `github-pages` environment usually only accepts deployments from the default branch: check Settings → Environments → github-pages → Deployment branches.)
- ⬜ The workflow run is green (both the `build` and `deploy` jobs)

## 5. Smoke test of the live site (straight after deploying)

- ⬜ https://ansh-66.github.io/ shows the shut notebook cover; one click opens it
- ⬜ https://ansh-66.github.io/#graph-rag opens that spread with no cover
- ⬜ https://ansh-66.github.io/work/graph-rag/ opens the entry book directly; https://ansh-66.github.io/work/graph-rag (no slash) redirects to it
- ⬜ https://ansh-66.github.io/nope shows "That page isn’t in the notebook" (status 404)
- ⬜ https://ansh-66.github.io/robots.txt and `/sitemap.xml` load; the sitemap lists exactly 4 URLs
- ⬜ https://ansh-66.github.io/Ansh_Kumar_Singh_Resume.pdf downloads the current resume
- ⬜ The browser console on `/` and one `/work/` page shows no errors
- ⬜ A shared link preview (paste the URL into a chat app) shows the title and description; there is no image (QA-12)
- ⬜ Hard-refresh once: GitHub Pages caches files for 10 minutes, so an old version can show briefly

## 6. Security configuration

- ✅ No secrets, tokens or phone numbers in the source, the build, or any commit in the history
- ✅ No third-party scripts, analytics or trackers; fonts are self-hosted
- ✅ Every external link opens in a new tab with `rel="noopener noreferrer"`
- ✅ No source maps published
- ⬜ GitHub Pages serves HTTPS: Settings → Pages → **Enforce HTTPS** is ticked
- ✅ A Content Security Policy `<meta>` is on every page (scripts by hash, own origin only); `npm test` checks it. GitHub Pages can't send headers, so `frame-ancestors` (framing) can't be set

## 7. Rollback

- To undo a bad release: revert the commit on `main` and push (the workflow redeploys the previous state in about a minute), or re-run the last good deploy from the Actions tab
- There is no server, database or user data: a rollback loses nothing
- Monitoring: GitHub Pages has none built in. An optional free uptime check (pinging `/` every few minutes) would tell you if the site goes down
