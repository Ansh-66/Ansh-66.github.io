# CLAUDE.md

Ansh Kumar Singh's portfolio site, published at https://ansh-66.github.io. Recruiters and hiring managers read it, and it goes on his resume, so treat every change as a production change. A broken link, a clipped page or a wrong number costs him credibility.

## What the site is

One open, side-bound notebook on a desk. Each screen is a two-page spread, and the pages turn around the spine. Every project spread has a **Run the full entry** button that opens a second, smaller book over the notebook with the full case study. On phones, and on screens too narrow or too tall for a spread, the book shows one page at a time.

- Stack: React 18, React Router 7, Vite 8. No other runtime dependencies. Fonts are self-hosted through `@fontsource`.
- Every URL is prerendered to its own HTML file by `scripts/prerender.js`, so links work on GitHub Pages and content exists before JavaScript runs.
- URLs:
  - `/` is the notebook. `/#<chapter>` opens a spread: `intro`, `reservation-agent`, `graph-rag`, `rag-from-scratch`, `single-vs-multi-agent`, `experience`, `contact`.
  - `/work/<slug>/` opens that entry's book over the notebook.

## Commands

```bash
npm install
npm run dev       # dev server, reloads on save
npm run build     # client build + SSR build + prerender. Must end with five "wrote …" lines
npm run preview   # serve dist/ exactly as GitHub Pages will
npm audit         # must report 0 vulnerabilities
```

Deploys happen automatically: every push to `main` runs `.github/workflows/deploy.yml`.

## Where things live

| What | File |
|---|---|
| Main notebook pages (in order: left, right, left, right…) and chapters | `src/book/mainBook.jsx` |
| The three entry books | `src/book/entryBooks.jsx` |
| Book engine: spreads, page turns, keys, swipe, contents | `src/book/Book.jsx` |
| URLs, titles, meta descriptions | `src/routes.jsx` |
| Notebook vs entry overlay, hash ↔ spread sync | `src/App.jsx` |
| Shared bits: `Pen`, `Mark`, `Fig`, `Ext`, `LINKS`, theme toggle | `src/components/ui.jsx` |
| Figures: GoodFoods tables, run tiles, Graph RAG bars, hit@1 dots | `src/components/figures.jsx` |
| Graph RAG question explorer and its data | `src/components/QuestionExplorer.jsx`, `src/data/graphEval.json` |
| Trace replay console and its runs | `src/components/TraceReplay.jsx`, `src/data/traces.js` |
| Design tokens, both themes, all layout | `src/styles.css` |
| Public resume served by the site | `public/Ansh_Kumar_Singh_Resume.pdf` |

## Rules that must not break

### Content
- **Every number must trace to a source.** Each figure comes from an eval file or README in the project's own repo (goodfoods-agent, Insurance-Graph-RAG, rag-from-scratch). Never invent, round up or "improve" a number, and never turn a count into a percentage (write `13/16`, not `81%`). If a number changes, ask Ansh where the new one comes from.
- **Public-profile rule:** no phone number, no client names, and no client descriptors such as "a large Indian bank" or "a UK transport authority". Client work is described only by what it does ("document AI"). The resume in `public/` is the public version and must stay that way.
- **Honest framing:** show what still fails next to what works. Don't present one-question margins or run-to-run noise as wins.
- `src/data/traces.js` holds **placeholder** agent runs until Ansh supplies the logged ones. While it is a placeholder, `TRACE_SOURCE` must keep saying so. Never relabel invented runs as real.
- Keep the footer line "Site built with Claude · content and results are mine".

### Code
- **No new dependencies** without asking. In particular, no animation or page-flip libraries.
- **SSR-safe rendering:** never read `window`, `document`, `localStorage` or `matchMedia` during render; only inside effects. The prerendered HTML must match the first client render. A hydration warning counts as a bug.
- **Motion:** animate only `transform` and `opacity`. The page turn uses the Web Animations API in `Book.jsx`. Respect `prefers-reduced-motion`: pages swap with no turn and the trace shows in full.
- **Pages are paper.** Each page has a fixed size set by the screen. Size everything inside a page in `em`, so it scales with the page's font size. Never let text drop below 14px to make content fit; let the page scroll inside itself (the bottom shadow shows), and tell Ansh which page and screen size need it.
- **Themes:** every colour is a token on `:root` and is redefined in both dark blocks. No hard-coded colours in components.
- **Accessibility:** real `<button>` and `<a href>` elements, touch targets of at least 44px, a visible focus ring, `aria-label` on icon-only buttons, and arrow keys plus Escape working on the book in front.
- Internal links use React Router's `<Link>`, or `BookContext.go(id)` to turn to a spread. External links use `<Ext>` (opens in a new tab with `rel="noopener noreferrer"`).

## Stress-test everything before calling it done

The site goes live. After building or changing any component, test it properly before reporting the work finished. "It builds" is not "it works". For every change, run through what applies:

1. **Build and audit:** `npm run build` with no errors and five `wrote …` lines. `npm audit` reports 0 vulnerabilities.
2. **Every screen size, both themes.** In `npm run preview`, check 1920×1080, 1440×900, 1366×768, 1280×720, an 820×1180 tablet, a 390×844 phone and a 360×740 phone, each in light and dark:
   - no page-level horizontal or vertical scrollbar;
   - nothing clipped or overlapping;
   - body text at least 14px;
   - the component looks right in both themes.
3. **Every page of every book.** Turn through all spreads of the main notebook and all three entry books. On each page, check that the content fits, or scrolls inside the page with the bottom shadow showing.
4. **Every way in and out:**
   - turning: corner buttons, arrow keys, PageUp/PageDown, swipe (touch emulation), the contents links, the phone Contents picker;
   - entry books: open with "Run the full entry"; close with ×, Escape, "Back to the notebook" and the browser back button;
   - on every close, you land on the same spread you left from.
5. **Every link:**
   - each internal link resolves;
   - each `/#chapter` opens the right spread;
   - each `/work/<slug>/` loads directly, not just when clicked through;
   - external links open in a new tab;
   - the resume PDF downloads;
   - an unknown URL shows the not-found notice.
6. **Abuse it:**
   - click turn buttons rapidly and mash the arrow keys mid-turn;
   - resize the window during a turn, and cross the spread/single-page breakpoint while a book is open;
   - open an entry, then use browser back and forward several times;
   - reload on a `/#chapter` URL and on a `/work/` URL;
   - switch theme mid-turn.

   Nothing should freeze, show a blank page, land on the wrong spread or throw an error.
7. **Console clean:** no errors, warnings or hydration mismatches on `/`, the three `/work/` routes and `/404.html`.
8. **Smoothness:**
   - scrolling inside a page and the page turn hold 60 fps (check with the Performance panel, ideally with 4× CPU throttling);
   - there are no long tasks during a turn;
   - nothing visibly shifts as the page and fonts load.
9. **Reduced motion and keyboard-only:** turn on reduced motion and confirm the swap works with no turn. Then go through the whole site with only Tab, Enter, the arrow keys and Escape.

When reporting back, say what you tested, what passed, and anything that failed or that you couldn't check. Don't report success on checks you didn't run.

## Git

- Small commits with clear messages, on `main`, unless told otherwise.
- Don't commit `dist/`, `dist-ssr/` or `node_modules/`.
- Never force-push, and never rewrite published history.
