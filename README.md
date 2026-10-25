# ansh-66.github.io

My portfolio: a lab notebook of the AI systems I've built, each entry with its measured results and what still fails.

Built with React 18, React Router 7 and Vite 8. Each page is prerendered to its own HTML file, so every link works on GitHub Pages and the content is there before JavaScript loads.

The site was built with Claude. The content and every number in it are mine, and each number traces back to an eval file in the project's own repo.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173, reloads as you edit
npm run build      # production build into dist/
npm run preview    # serve dist/ to check the build
```

## How the site is organised

The whole site is one open notebook. Each screen is a spread: two pages side by side, or one page at a time on phones. The corner of the page turns it; so do the arrow keys, a swipe, and the tabs on the book's edge. Each project's "Run the full entry" opens a second, smaller book on top with the full case study.

| What | File |
|---|---|
| The main notebook: every page, in order (left, right, left, right…) and its chapters | `src/book/mainBook.jsx` |
| The three entry books (full case studies), one object each | `src/book/entryBooks.jsx` |
| The book itself: spreads, page turns, tabs, keys, swipe | `src/book/Book.jsx` |
| URLs, page titles and descriptions | `src/routes.jsx` |
| Main notebook vs entry book overlay | `src/App.jsx` |
| Agent runs replayed in the console | `src/data/traces.js` |
| Graph RAG question explorer data | `src/data/graphEval.json` (exported from `Insurance-Graph-RAG/data/eval_scoring.csv`) |
| GoodFoods eval figures | `src/components/figures.jsx` |
| Email, LinkedIn, GitHub, demo and repo links | `LINKS` in `src/components/ui.jsx` |
| Colours, fonts, page layout | `src/styles.css` (tokens at the top, light and dark) |
| Resume served by the site | `public/Ansh_Kumar_Singh_Resume.pdf` (the public version: no phone, no client names) |

### Common edits

- **Change a number:** search for it in `src/book/`. Most numbers appear in the main notebook and again in the entry book.
- **Edit a page:** each page is `{ head, render }`. `head` is the small running title at the top; `render` returns the page's content. Pages are paired into spreads in order, so keep the count even.
- **Pages must fit.** A page is a fixed size, like paper. If you add text, check it at a laptop size (1366×768). On short screens and phones a long page scrolls inside itself, with a shadow at the bottom.
- **Add a red-pen note:** `<Pen>…</Pen>`. Circle or underline a phrase: `<Mark>4/4</Mark>`, `<Mark kind="under">…</Mark>`, `<Mark kind="strike">…</Mark>`.
- **Add a project:** add two pages to `mainPages` and a chapter to `mainChapters`, add an entry book to `entryBooks`, and add its route to `src/routes.jsx`.
- **Link to a spread:** `https://ansh-66.github.io/#graph-rag`. Link to a full entry: `https://ansh-66.github.io/work/graph-rag/`.
- **Make the GoodFoods repo public:** replace "Repo: coming soon" on the last page of its entry book with `<Ext href="…">Code on GitHub</Ext>`.

## Deploying

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`. One-time setup: in the repo's Settings → Pages, set **Source** to **GitHub Actions**.

## How the page turn works

`src/book/Book.jsx`. A turning leaf is drawn over the half that moves, with the current page on its front and the next page on its back, and rotated around the spine with the Web Animations API. Only `transform` is animated, so it runs on the GPU. On phones a single page turns around the binding on its left edge. A click during a turn finishes it at once. With "reduce motion" switched on, pages change without the turn.
