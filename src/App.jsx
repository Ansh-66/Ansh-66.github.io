import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Book from './book/Book.jsx';
import { mainBackCover, mainChapters, mainCover, mainPages } from './book/mainBook.jsx';
import { entryBooks } from './book/entryBooks.jsx';
import { findRoute } from './routes.jsx';
import { hydration, prefersReducedMotion, useIso } from './components/ui.jsx';

const chapterIndex = (id) => Math.max(0, mainChapters.findIndex((c) => c.id === id));
const hashChapter = (hash) => {
  const id = (hash || '').replace(/^#/, '');
  const i = mainChapters.findIndex((c) => c.id === id);
  return i;
};

function EntryBook({ entry, onClose }) {
  const [spread, setSpread] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef(null);
  const close = useCallback(() => {
    if (leaving) return;
    if (prefersReducedMotion()) return onClose();
    setLeaving(true);
    setTimeout(onClose, 240);
  }, [leaving, onClose]);
  useEffect(() => {
    const prevFocus = document.activeElement;
    const t = setTimeout(() => document.querySelector('.overlay .close')?.focus({ preventScroll: true }), 50);
    return () => {
      clearTimeout(t);
      if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
    };
  }, []);
  const pagesWithHead = entry.pages.map((p) => ({ ...p, head: `${entry.no} · ${entry.title}` }));
  const cover = () => (
    <div className="cover-art">
      <span className="lbl">{entry.no} · full entry</span>
      <span className="cover-title">{entry.title}</span>
      <span className="cover-foot">Ansh Kumar Singh · lab notebook</span>
    </div>
  );
  // the entry's own back cover: its number and title only
  const backCover = () => (
    <div className="cover-art">
      <span className="lbl">{entry.no}</span>
      <span className="cover-title">{entry.title}</span>
    </div>
  );
  return (
    <div className={`overlay tone-${entry.tone}${leaving ? ' leaving' : ''}`} role="dialog" aria-modal="true" aria-label={entry.title} ref={closeRef}>
      <div className="overlay-dim" onClick={close} />
      <Book
        variant="entry"
        title={`${entry.no}: ${entry.title}`}
        pages={pagesWithHead}
        chapters={entry.chapters}
        spread={spread}
        onSpread={setSpread}
        cover={cover}
        backCover={backCover}
        onClose={close}
      />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = findRoute(location.pathname);
  const entry = route.entry ? entryBooks[route.entry] : null;

  // The notebook's spread: the entry's own spread under an open entry, else from the hash.
  const [spread, setSpread] = useState(() => (route.entry ? chapterIndex(route.entry) : 0));

  useEffect(() => {
    hydration.done = true;
  }, []);

  // The notebook's covers: false (open), 'front' or 'back'. "/" opens shut on its front cover on every load,
  // "/#end" on its back cover. The prerendered page is the shut front cover over the first spread; which
  // cover shows, if any, is decided here, after hydration (the head script in index.html makes the same call
  // before the first paint, so a deep link never flashes a cover).
  const isHome = route.path === '/';
  const [closed, setClosed] = useState(isHome ? 'front' : false);
  useIso(() => {
    if (closed !== 'front') return;
    if (location.hash === '#end') setClosed('back');
    else if (location.hash || prefersReducedMotion()) setClosed(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useIso(() => {
    if (closed) document.documentElement.dataset.cover = closed;
    else delete document.documentElement.dataset.cover;
  }, [closed]);
  // Shutting a cover gives the URL "/" (front) or "/#end" (back); opening hands it back to onSpread.
  const onCover = useCallback((state) => {
    setClosed(state);
    if (state) window.history.replaceState(window.history.state, '', state === 'back' ? '/#end' : '/');
  }, []);

  useEffect(() => {
    if (route.entry) setSpread(chapterIndex(route.entry));
    else if (location.hash === '#end') setClosed('back');
    else {
      const i = hashChapter(location.hash);
      if (i >= 0) {
        setSpread(i);
        setClosed(false);
      }
    }
  }, [location.pathname, location.hash]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = route.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', route.description);
  }, [route]);

  const onSpread = useCallback(
    (s) => {
      setSpread(s);
      if (!route.entry && typeof window !== 'undefined') {
        const id = mainChapters[s].id;
        window.history.replaceState(window.history.state, '', s === 0 ? '/' : `/#${id}`);
      }
    },
    [route.entry]
  );

  return (
    <div className="desk">
      {route.missing && (
        <p className="notice" role="status">
          That page isn’t in the notebook. Here’s the first page instead.
        </p>
      )}
      {/* Behind an open entry the notebook is inert: Tab can't reach it and screen readers skip it. */}
      <main id="main" className={entry ? 'behind' : ''} inert={entry ? '' : undefined}>
        <Book
          variant="main"
          title="Ansh Kumar Singh, lab notebook"
          pages={mainPages}
          chapters={mainChapters}
          spread={spread}
          onSpread={onSpread}
          cover={mainCover}
          backCover={mainBackCover}
          shut={closed}
          onShut={onCover}
          active={!entry}
        />
      </main>
      {entry && <EntryBook key={route.entry} entry={entry} onClose={() => navigate(`/#${route.entry}`)} />}
    </div>
  );
}
