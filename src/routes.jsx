import Home from './pages/Home.jsx';
import ReservationAgent from './pages/ReservationAgent.jsx';
import GraphRag from './pages/GraphRag.jsx';
import RagFromScratch from './pages/RagFromScratch.jsx';
import NotFound from './pages/NotFound.jsx';

// `order` is the page's position in the notebook. Moving to a higher order
// turns the page forward; moving to a lower one turns it back.
export const routes = [
  {
    path: '/',
    order: 0,
    Component: Home,
    tabs: [['work', 'Entries'], ['experience', 'Experience'], ['skills', 'Skills'], ['contact', 'Contact']],
    title: 'Ansh Kumar Singh · AI Engineer',
    description:
      'AI Engineer building LLM systems (agents, RAG, graph retrieval) and testing them on labelled question sets, with every result tied to a number and the failures behind it.',
  },
  {
    path: '/work/reservation-agent/',
    order: 1,
    Component: ReservationAgent,
    tabs: [['problem', 'Question'], ['built', 'Setup'], ['decision', 'Decision'], ['eval', 'Result'], ['numbers', 'Numbers'], ['fails', 'Fails'], ['demo', 'Demo']],
    title: 'Restaurant Reservation Agent · Ansh Kumar Singh',
    description:
      'A from-scratch booking agent for a 75-outlet restaurant chain: own tool loop, 8 MCP tools, voice in 11 languages, writes gated in code. 13/16 eval journeys pass.',
  },
  {
    path: '/work/graph-rag/',
    order: 2,
    Component: GraphRag,
    tabs: [['question', 'Question'], ['built', 'Setup'], ['result', 'Result'], ['questions', 'Answers'], ['bug', 'Bug'], ['tests', 'Tests']],
    title: 'Graph RAG for Multi-Hop Questions · Ansh Kumar Singh',
    description:
      'A knowledge graph over 110 Indian insurance news articles, measured against vector RAG: 4/4 vs 3/4 on questions whose answer spans several articles.',
  },
  {
    path: '/work/rag-from-scratch/',
    order: 3,
    Component: RagFromScratch,
    tabs: [['question', 'Question'], ['built', 'Setup'], ['story', 'Debugging'], ['result', 'Result']],
    title: 'RAG from Scratch · Ansh Kumar Singh',
    description:
      'A hand-built RAG pipeline in Python and NumPy, and the silent reranker bug that kept hit@1 at 13/17 until it was found.',
  },
];

export const notFound = {
  path: '*',
  order: 0,
  Component: NotFound,
  tabs: [],
  title: 'Page not found · Ansh Kumar Singh',
  description: 'This page is not in the notebook.',
};

export function normalise(pathname) {
  if (!pathname) return '/';
  return pathname.endsWith('/') ? pathname : pathname + '/';
}

export function findRoute(pathname) {
  const p = normalise(pathname);
  return routes.find((r) => r.path === p) || notFound;
}

export const entries = [
  { path: '/work/reservation-agent/', short: 'Reservation Agent' },
  { path: '/work/graph-rag/', short: 'Graph RAG' },
  { path: '/work/rag-from-scratch/', short: 'RAG from Scratch' },
];
