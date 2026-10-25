import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StaticContext, prefersReducedMotion } from '../components/ui.jsx';

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Single-page mode: phones, and any screen too narrow or tall for a spread.
// Must match the media query in styles.css.
export const SINGLE_MQ = '(max-width: 899px), (max-aspect-ratio: 11/10)';
const isSingle = () => typeof window !== 'undefined' && window.matchMedia(SINGLE_MQ).matches;

export const BookContext = createContext({ go: () => {}, active: true });
export const useBook = () => useContext(BookContext);

/**
 * A two-page notebook.
 *
 * pages:    [{ head, render }]  — pages[2s] is the left page of spread s, pages[2s + 1] the right.
 * chapters: [{ id, label }]     — one per spread, used for tabs and the status line.
 * spread:   current spread (controlled).
 * onSpread: called with the new spread after a turn has finished.
 * cover:    optional render() for a cover that opens when the book first appears.
 */
export default function Book({ pages, chapters, spread, onSpread, cover, variant = 'main', active = true, tabs = true, title, onClose }) {
  const [side, setSide] = useState(0); // single-page mode: 0 = left page of the spread, 1 = right
  const [flip, setFlip] = useState(null);
  const [opening, setOpening] = useState(!!cover);
  const leaf = useRef(null);
  const shadeA = useRef(null);
  const shadeB = useRef(null);
  const anim = useRef(null);
  const nSpreads = Math.ceil(pages.length / 2);

  // An outside change of spread (hash, route) lands on the left page, without a turn.
  const lastSpread = useRef(spread);
  useEffect(() => {
    if (lastSpread.current !== spread) {
      lastSpread.current = spread;
      setSide(0);
    }
  }, [spread]);

  const pageIndex = spread * 2 + side;

  const commit = useCallback(
    (f) => {
      setFlip(null);
      if (f.kind === 'open') {
        setOpening(false);
        return;
      }
      if (f.toSpread !== spread) {
        lastSpread.current = f.toSpread;
        onSpread(f.toSpread);
      }
      setSide(f.toSide);
    },
    [onSpread, spread]
  );

  /** Turn to a page. Spread mode turns a whole leaf; single mode turns one page. */
  const turnTo = useCallback(
    (toSpread, toSide = 0) => {
      if (flip) {
        anim.current?.finish();
        return;
      }
      toSpread = Math.max(0, Math.min(nSpreads - 1, toSpread));
      const single = isSingle();
      if (!single) toSide = 0;
      const from = single ? pageIndex : spread * 2;
      const to = toSpread * 2 + toSide;
      if (to === from || (!single && toSpread === spread)) return;
      const f = { kind: single ? 'single' : 'spread', dir: to > from ? 1 : -1, fromSpread: spread, fromSide: side, toSpread, toSide, from, to };
      if (prefersReducedMotion() || typeof Element === 'undefined' || !('animate' in Element.prototype)) {
        commit(f);
        return;
      }
      setFlip(f);
    },
    [flip, nSpreads, pageIndex, spread, side, commit]
  );

  const next = useCallback(() => {
    if (isSingle() && side === 0 && spread * 2 + 1 < pages.length) turnTo(spread, 1);
    else turnTo(spread + 1, 0);
  }, [side, spread, pages.length, turnTo]);
  const prev = useCallback(() => {
    if (isSingle()) {
      if (side === 1) turnTo(spread, 0);
      else if (spread > 0) turnTo(spread - 1, 1);
    } else turnTo(spread - 1, 0);
  }, [side, spread, turnTo]);
  const go = useCallback((id) => {
    const i = chapters.findIndex((c) => c.id === id);
    if (i >= 0) turnTo(i, 0);
  }, [chapters, turnTo]);

  // The cover opens once, when a book with a cover first appears.
  useEffect(() => {
    if (!opening) return;
    if (prefersReducedMotion()) {
      setOpening(false);
      return;
    }
    const t = setTimeout(() => setFlip({ kind: isSingle() ? 'open-single' : 'open', dir: 1, toSpread: 0, toSide: 0 }), 260);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Run the turn.
  useIso(() => {
    if (!flip || !leaf.current) return;
    const single = flip.kind === 'single' || flip.kind === 'open-single';
    const forward = flip.dir > 0;
    let a, b;
    if (single) [a, b] = forward ? [0, -180] : [-180, 0];
    else [a, b] = forward ? [0, -180] : [0, 180];
    const duration = single ? 460 : 720;
    const easing = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
    const k = leaf.current.animate([{ transform: `rotateY(${a}deg)` }, { transform: `rotateY(${b}deg)` }], { duration, easing, fill: 'forwards' });
    const shades = [shadeA.current, shadeB.current].filter(Boolean).map((el) =>
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration, easing })
    );
    anim.current = k;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const kind = flip.kind.startsWith('open') ? 'open' : flip.kind;
      commit({ ...flip, kind });
    };
    k.onfinish = finish;
    k.oncancel = finish;
    return () => shades.forEach((s) => s.cancel());
  }, [flip]);

  // Arrow keys, when this book is the one in front.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [role="tablist"], [contenteditable="true"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev, onClose]);

  // Swipe on touch screens.
  const swipe = useRef(null);
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse') return;
    if (e.target.closest('.requests, .tablebox, .qx-tabs, .screen, pre, .scrollx')) return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? next : prev)();
  };

  // ---- what is drawn where ----
  const renderPage = (i, sideClass, { blank = false } = {}) => {
    if (i === -1) return <CoverFace render={cover} sideClass={sideClass} title={title} />;
    if (blank || i < 0 || i >= pages.length) return <div className={`page ${sideClass} blank`} />;
    const p = pages[i];
    return (
      <div className={`page ${sideClass}`} aria-label={`Page ${i + 1}`}>
        <div className="page-head" aria-hidden="true">
          <span>{p.head}</span>
        </div>
        <div className="page-body">{p.render()}</div>
        <div className="page-foot" aria-hidden="true">{i + 1}</div>
      </div>
    );
  };

  let base;
  let leafEl = null;
  const showSide = flip && flip.kind === 'single' ? flip.toSide : side;
  if (opening && !flip) {
    // Closed: just the cover, on the right.
    base = [renderPage(-2, 'left', { blank: true }), renderPage(-1, 'right')];
  } else if (flip && (flip.kind === 'open' || flip.kind === 'open-single')) {
    const single = flip.kind === 'open-single';
    base = [renderPage(0, 'left'), renderPage(1, 'right')];
    if (!single) base[0] = <div key="l" className="page left blank" />;
    leafEl = (
      <div className={`leaf ${single ? 'leaf-single' : 'leaf-right'}`} ref={leaf}>
        <div className="face front">{renderPage(-1, single ? 'left' : 'right')}<span className="shade" ref={shadeA} /></div>
        <div className="face back">{single ? <div className="page left blank" /> : renderPage(0, 'left')}<span className="shade" ref={shadeB} /></div>
      </div>
    );
  } else if (flip && flip.kind === 'spread') {
    const f = flip;
    const L = (s) => s * 2;
    if (f.dir > 0) {
      base = [renderPage(L(f.fromSpread), 'left'), renderPage(L(f.toSpread) + 1, 'right')];
      leafEl = (
        <div className="leaf leaf-right" ref={leaf}>
          <div className="face front">{renderPage(L(f.fromSpread) + 1, 'right')}<span className="shade" ref={shadeA} /></div>
          <div className="face back">{renderPage(L(f.toSpread), 'left')}<span className="shade" ref={shadeB} /></div>
        </div>
      );
    } else {
      base = [renderPage(L(f.toSpread), 'left'), renderPage(L(f.fromSpread) + 1, 'right')];
      leafEl = (
        <div className="leaf leaf-left" ref={leaf}>
          <div className="face front">{renderPage(L(f.fromSpread), 'left')}<span className="shade" ref={shadeA} /></div>
          <div className="face back">{renderPage(L(f.toSpread) + 1, 'right')}<span className="shade" ref={shadeB} /></div>
        </div>
      );
    }
  } else if (flip && flip.kind === 'single') {
    const f = flip;
    // Forward: the current page lifts away to reveal the next. Back: the previous page comes down over the current one.
    const under = f.dir > 0 ? f.to : f.from;
    const over = f.dir > 0 ? f.from : f.to;
    const u = renderPage(under, under % 2 ? 'right' : 'left');
    base = under % 2 ? [<div key="l" className="page left blank" />, u] : [u, <div key="r" className="page right blank" />];
    leafEl = (
      <div className="leaf leaf-single" ref={leaf} style={{ transform: f.dir > 0 ? 'none' : 'rotateY(-180deg)' }}>
        <div className="face front">{renderPage(over, 'left')}<span className="shade" ref={shadeA} /></div>
        <div className="face back"><div className="page left blank" /><span className="shade" ref={shadeB} /></div>
      </div>
    );
  } else {
    base = [renderPage(spread * 2, 'left'), renderPage(spread * 2 + 1, 'right')];
  }
  const baseSide = flip && flip.kind === 'single' ? (flip.dir > 0 ? flip.to : flip.from) % 2 : showSide;

  const ch = chapters[flip && flip.toSpread != null ? flip.toSpread : spread];
  const atStart = spread === 0 && side === 0;
  const atEnd = spread === nSpreads - 1 && (side === 1 || spread * 2 + 1 >= pages.length);

  return (
    <BookContext.Provider value={{ go, active }}>
      <div className={`book-wrap ${variant}`}>
        <div
          className={`book${opening && !flip ? ' closed' : ''}${flip && flip.kind === 'open' ? ' opening' : ''}`}
          data-side={baseSide ? 'right' : 'left'}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          role="region"
          aria-roledescription="book"
          aria-label={title}
        >
          <div className="spine" aria-hidden="true" />
          <div className="pages">
            {base.map((el, i) => (
              <div key={i} className="slot">{el}</div>
            ))}
          </div>
          {leafEl && <StaticContext.Provider value={true}><div className="leaves" aria-hidden="true">{leafEl}</div></StaticContext.Provider>}
          {!(opening && !flip) && (
            <>
              <button type="button" className="corner prev" onClick={prev} disabled={atStart} aria-label="Previous page">
                <span aria-hidden="true">‹</span>
              </button>
              <button type="button" className="corner next" onClick={next} disabled={atEnd} aria-label="Next page">
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
          {onClose && (
            <button type="button" className="close" onClick={onClose} aria-label="Close this entry and return to the notebook">
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        {tabs && chapters.length > 1 && (
          <nav className="book-tabs" aria-label="Chapters">
            {chapters.map((c, i) => (
              <a
                key={c.id}
                href={c.href || `#${c.id}`}
                className="btab"
                aria-current={i === spread ? 'true' : undefined}
                onClick={(e) => {
                  if (c.href) return;
                  e.preventDefault();
                  turnTo(i, 0);
                }}
              >
                {c.label}
              </a>
            ))}
          </nav>
        )}

        <div className="book-bar">
          <button type="button" className="barbtn" onClick={prev} disabled={atStart} aria-label="Previous page">‹ <span className="bt">Back</span></button>
          {variant === 'main' && (
            <label className="toc">
              <span className="sr">Go to chapter</span>
              <select value={flip?.toSpread ?? spread} onChange={(e) => turnTo(Number(e.target.value), 0)}>
                {chapters.map((c, i) => (
                  <option key={c.id} value={i}>{c.label}</option>
                ))}
              </select>
            </label>
          )}
          <span className="status" aria-live="polite">
            <span className="ch">{ch?.label}</span>
            <span className="pos num">
              {variant === 'main' ? `${(flip?.toSpread ?? spread) + 1} / ${nSpreads}` : `Spread ${(flip?.toSpread ?? spread) + 1} of ${nSpreads}`}
            </span>
          </span>
          <button type="button" className="barbtn" onClick={next} disabled={atEnd} aria-label="Next page"><span className="bt">Turn</span> ›</button>
        </div>
      </div>
    </BookContext.Provider>
  );
}

function CoverFace({ render, sideClass }) {
  return <div className={`page ${sideClass} cover`}>{render && render()}</div>;
}
