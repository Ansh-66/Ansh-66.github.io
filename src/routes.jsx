// Every URL the site serves. Each one is prerendered to its own HTML file.
// The home page is the notebook; each /work/<slug>/ opens that entry's book
// on top of it. Spreads of the main notebook are linked by hash (#graph-rag).
export const routes = [
  {
    path: '/',
    entry: null,
    title: 'Ansh Kumar Singh · AI Engineer',
    description:
      'AI Engineer building LLM systems (agents, RAG, graph retrieval) and testing them on labelled question sets, with every result tied to a number and the failures behind it.',
  },
  {
    path: '/work/reservation-agent/',
    entry: 'reservation-agent',
    title: 'Restaurant Reservation Agent · Ansh Kumar Singh',
    description:
      'A from-scratch booking agent for a 75-outlet restaurant chain: own tool loop, 8 MCP tools, voice in 11 languages, writes gated in code. 13/16 eval journeys pass.',
  },
  {
    path: '/work/graph-rag/',
    entry: 'graph-rag',
    title: 'Graph RAG for Multi-Hop Questions · Ansh Kumar Singh',
    description:
      'A knowledge graph over 110 Indian insurance news articles, measured against vector RAG: 4/4 vs 3/4 on questions whose answer spans several articles.',
  },
  {
    path: '/work/rag-from-scratch/',
    entry: 'rag-from-scratch',
    title: 'RAG from Scratch · Ansh Kumar Singh',
    description: 'A hand-built RAG pipeline in Python and NumPy, and the silent reranker bug that kept hit@1 at 13/17 until it was found.',
  },
];

export const notFound = {
  path: '*',
  entry: null,
  missing: true,
  title: 'Page not found · Ansh Kumar Singh',
  description: 'This page is not in the notebook.',
};

export function normalise(pathname) {
  if (!pathname) return '/';
  if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -10);
  return pathname.endsWith('/') ? pathname : pathname + '/';
}

export function findRoute(pathname) {
  const p = normalise(pathname);
  return routes.find((r) => r.path === p) || notFound;
}
