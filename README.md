# ansh-66.github.io

My portfolio: a lab notebook of the AI systems I've built, each entry with its measured results and what still fails.

Built with React and Vite. Each page is prerendered to its own HTML file, so every link works on GitHub Pages and the content is there before JavaScript loads.

The site was built with Claude. The content and every number in it are mine, and each number traces back to an eval file in the project's own repo.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173, reloads as you edit
npm run build      # production build into dist/
npm run preview    # serve dist/ to check the build
```

## Where things live

| What | File |
|---|---|
| Home page: hero, entries, experience, skills, certifications | `src/pages/Home.jsx` |
| Case studies | `src/pages/ReservationAgent.jsx`, `GraphRag.jsx`, `RagFromScratch.jsx` |
| Page titles, descriptions, section tabs | `src/routes.jsx` |
| Agent runs replayed in the console | `src/data/traces.js` |
| Graph RAG question explorer data | `src/data/graphEval.json` (exported from `Insurance-Graph-RAG/data/eval_scoring.csv`) |
| GoodFoods eval figures | `src/components/figures.jsx` |
| Email, LinkedIn, GitHub, demo and repo links | `LINKS` in `src/components/ui.jsx` |
| Colours, fonts, layout | `src/styles.css` (tokens at the top, light and dark) |
| Resume served by the site | `public/Ansh_Kumar_Singh_Resume.pdf` (the public version: no phone, no client names) |

### Common edits

- **Change a number:** search for it in `src/pages/`. Most numbers appear on the home page and on the case study.
- **Add a red-pen note:** wrap it in `<Pen>…</Pen>` and pass it as `note` to a `<Row>`. It sits in the margin on desktop and under the content on phones.
- **Circle or underline a phrase:** `<Mark>4/4</Mark>`, `<Mark kind="under">…</Mark>` or `<Mark kind="strike">…</Mark>`.
- **Add a case study:** create a page in `src/pages/`, add it to `routes` in `src/routes.jsx` with the next `order` number, and link it from the home page. `order` decides whether the page turns forward or back.
- **Make the GoodFoods repo public:** replace the "Repo coming soon" button in `ReservationAgent.jsx` with `<Ext href="…" className="btn">Code on GitHub</Ext>`.

## Deploying

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`. One-time setup: in the repo's Settings → Pages, set **Source** to **GitHub Actions**.

## How the page turn works

`src/App.jsx`. On a link between pages, a copy of one page is drawn in a fixed layer and rotated around the notebook's binding (the left edge of the page) with the Web Animations API. Going forward, the old page turns away to reveal the new one. Going back, the new page turns in over the old one, and the scroll position you left is restored. Only `transform` is animated, so it runs on the GPU. Any click, scroll or key press finishes the turn at once. With "reduce motion" switched on, pages swap without the turn.
