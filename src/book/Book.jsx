import { createContext, startTransition, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LINKS, Mark, StaticContext, ThemeToggle, prefersReducedMotion, useIso } from '../components/ui.jsx';

// Single-page mode: phones (upright or sideways), and any screen too narrow or tall for a spread.
// Must match the media query in styles.css.
export const SINGLE_MQ = '(max-width: 899px), (max-aspect-ratio: 11/10), (max-height: 500px)';
const isSingle = () => typeof window !== 'undefined' && window.matchMedia(SINGLE_MQ).matches;
const canAnimate = () => !prefersReducedMotion() && typeof Element !== 'undefined' && 'animate' in Element.prototype;
const parity = (i) => ((i % 2) + 2) % 2;
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);

/** Whether something between el and the book can still scroll further in this direction. */
function scrollsFurther(el, dir, sideways, stop) {
  for (; el && el !== stop && el.nodeType === 1; el = el.parentElement) {
    const cs = getComputedStyle(el);
    const ov = sideways ? cs.overflowX : cs.overflowY;
    if (ov !== 'auto' && ov !== 'scroll') continue;
    const max = sideways ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    if (max < 2) continue;
    const at = sideways ? el.scrollLeft : el.scrollTop;
    if (dir > 0 ? at < max - 1 : at > 1) return true;
  }
  return false;
}

export const BookContext = createContext({ go: () => {}, active: true });
export const useBook = () => useContext(BookContext);

/**
 * A two-page notebook between a front and a back cover.
 *
 * pages:     [{ head, render }]  — pages[2s] is the left page of spread s, pages[2s + 1] the right.
 * chapters:  [{ id, label }]     — one per spread, listed in the left page's margin and named in the right page's footer.
 * spread:    current spread (controlled).
 * onSpread:  called with the new spread after a turn has finished.
 * cover, backCover: render({ open }) / render({ toStart }) for the outside of the two covers.
 * shut, onShut: the main notebook's covers, controlled: false, 'front' or 'back'. Without onShut the book
 *            keeps its own: it opens by itself when it first appears, and closing either cover calls onClose.
 */
export default function Book({ pages, chapters, spread, onSpread, cover, backCover, shut: shutProp, onShut, variant = 'main', active = true, title, onClose }) {
  const [side, setSide] = useState(0); // single-page mode: 0 = left page of the spread, 1 = right
  const [flip, setFlip] = useState(null);
  // The turn that has landed: the pages underneath already show where it ends, and its leaf goes on the next frame.
  // It names the turn rather than being true or false, so every landing is a change the settle effect sees, even
  // when a new turn has started before React applied the last one's clean-up (a key press outranks those updates).
  const [landed, setLanded] = useState(null);
  const held = !!onShut;
  const [ownShut, setOwnShut] = useState(cover ? 'front' : false);
  const shut = held ? shutProp : ownShut;
  // Phones only: the contents, slid out from the bookmark ribbon.
  const [tocOpen, setTocOpen] = useState(false);
  const ribbon = useRef(null);
  const panel = useRef(null);
  const bookEl = useRef(null);
  const leaf = useRef(null);
  const shadeA = useRef(null);
  const shadeB = useRef(null);
  const anim = useRef(null);
  // Set the moment a turn starts and cleared once its leaf is gone, so a second request in the same frame sees it.
  const busy = useRef(false);
  // When the last turn ended, and the wheel gesture under way: a trackpad swipe or a run of wheel clicks.
  const lastTurnEnd = useRef(0);
  const gesture = useRef({ last: 0, start: 0, total: 0, used: false, speeds: [] });
  const N = pages.length;
  const nSpreads = Math.ceil(N / 2);

  // An outside change of spread (hash, route) lands on the left page, without a turn.
  const lastSpread = useRef(spread);
  useEffect(() => {
    if (lastSpread.current !== spread) {
      lastSpread.current = spread;
      setSide(0);
    }
  }, [spread]);

  const setShut = useCallback(
    (s) => {
      if (held) onShut(s);
      else {
        setOwnShut(s);
        if (s && onClose) onClose();
      }
    },
    [held, onShut, onClose]
  );

  /** Where a turn ends: -1 is the front cover, N the back cover, anything between a page. */
  const land = useCallback(
    (to) => {
      if (to === -1) return setShut('front');
      if (to === N) return setShut('back');
      const s = Math.floor(to / 2);
      if (shut) setShut(false);
      // Opening always reports the spread, so the URL gets its chapter back.
      if (s !== spread || shut) {
        lastSpread.current = s;
        onSpread(s);
      }
      setSide(parity(to));
    },
    [N, shut, spread, setShut, onSpread]
  );

  /** Turn to a position. Spread mode turns a whole leaf; single mode turns one page. */
  const turn = useCallback(
    (to) => {
      // A turn asked for while one runs finishes that one at once; turns never queue or overlap.
      if (busy.current) {
        anim.current?.finish();
        return;
      }
      const single = isSingle();
      const from = shut === 'front' ? -1 : shut === 'back' ? N : single ? spread * 2 + side : spread * 2;
      to = Math.max(cover ? -1 : 0, Math.min(backCover ? N : N - 1, to));
      if (!single && to >= 0 && to < N) to -= to % 2;
      if (to === from || (from === -1 && to === N) || (from === N && to === -1)) return;
      setTocOpen(false);
      if (!canAnimate()) {
        lastTurnEnd.current = performance.now();
        return land(to);
      }
      const kind = single ? 'single' : from === -1 || to === -1 ? 'cover' : from === N || to === N ? 'back-cover' : 'spread';
      busy.current = true;
      // Drawing the turning leaf and the pages under it is the heavy part of a turn. As a transition it doesn't hold
      // up the click or key press that asked for it: the browser answers the input first, React draws in slices.
      // `busy` is already set, so a second request still finishes this turn rather than starting another.
      startTransition(() => setFlip({ kind, dir: to > from ? 1 : -1, from, to }));
    },
    [shut, N, spread, side, cover, backCover, land]
  );

  // Positions one step on: one page in single mode, one spread (or a cover) in spread mode.
  const step = useCallback(
    (d) => {
      if (busy.current) return turn(0);
      if (isSingle()) {
        const p = shut === 'front' ? -1 : shut === 'back' ? N : spread * 2 + side;
        return turn(p + d);
      }
      const s = (shut === 'front' ? -1 : shut === 'back' ? nSpreads : spread) + d;
      turn(s < 0 ? -1 : s >= nSpreads ? N : s * 2);
    },
    [turn, shut, N, nSpreads, spread, side]
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);
  const go = useCallback((id) => {
    const i = chapters.findIndex((c) => c.id === id);
    if (i >= 0) turn(i * 2);
  }, [chapters, turn]);

  /** The cover button and the mouse wheel: they ask again and again for one gesture, so a turn under way wins. */
  const openCover = useCallback(() => {
    if (!busy.current) turn(0);
  }, [turn]);
  const turnRef = useRef(turn);
  turnRef.current = turn;

  /** Close the phone contents panel and hand focus back to the ribbon. */
  const closeToc = useCallback(() => {
    setTocOpen(false);
    ribbon.current?.focus({ preventScroll: true });
  }, []);

  // An entry's cover opens once, by itself, when the book first appears.
  useEffect(() => {
    if (held || !cover) return;
    if (!canAnimate()) {
      setOwnShut(false);
      return;
    }
    const t = setTimeout(() => turnRef.current(0), 260);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Run the turn.
  useIso(() => {
    if (!flip || !leaf.current) return;
    const single = flip.kind === 'single';
    const forward = flip.dir > 0;
    let a, b;
    if (flip.kind === 'spread') [a, b] = forward ? [0, -180] : [0, 180];
    else [a, b] = forward ? [0, -180] : [-180, 0];
    const covers = flip.kind === 'cover' || flip.kind === 'back-cover';
    const duration = single ? 1100 : covers ? (held ? 640 : 520) : 720;
    const easing = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
    let k, extra;
    if (single) {
      // One page swings a full half-turn on its left edge: it lifts from the right, comes edge-on at the hinge and folds
      // over off the screen's left. A back turn plays the same frames in reverse.
      const timing = { duration, easing, fill: 'both', direction: forward ? 'normal' : 'reverse' };
      k = leaf.current.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], timing);
      // Each face shows only on its own half of the turn and swaps exactly at edge-on, on the same easing as the
      // rotation, so nothing shows through the hidden side (Safari). Opacity on the faces, not the leaf: on the leaf
      // it would flatten its 3D.
      const [front, back] = [...leaf.current.querySelectorAll('.face')];
      const swap = (from, to) => [{ opacity: from }, { opacity: from, offset: 0.5 }, { opacity: to, offset: 0.5 }, { opacity: to }];
      const faces = [front.animate(swap(1, 0), timing), back.animate(swap(0, 1), timing)];
      // the shade sweeps across the page, darkest as it stands edge-on
      const shades = [shadeA.current, shadeB.current].filter(Boolean).map((el) => el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], timing));
      extra = [...faces, ...shades];
    } else {
      k = leaf.current.animate([{ transform: `rotateY(${a}deg)` }, { transform: `rotateY(${b}deg)` }], { duration, easing, fill: 'forwards' });
      extra = [shadeA.current, shadeB.current].filter(Boolean).map((el) =>
        el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration, easing })
      );
    }
    // The main notebook sits centred while shut on either cover: the book slides with the cover as it turns.
    if (covers && held) {
      const shutAt = flip.kind === 'cover' ? 'translateX(-25%)' : 'translateX(25%)';
      const [p, q] = (flip.kind === 'cover') === forward ? [shutAt, 'none'] : ['none', shutAt];
      extra.push(bookEl.current.animate([{ transform: p }, { transform: q }], { duration, easing, fill: 'forwards' }));
    }
    anim.current = k;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      land(flip.to);
      setLanded(flip);
    };
    k.onfinish = finish;
    k.oncancel = finish;
    return () => extra.forEach((s) => s.cancel());
  }, [flip]);

  // One painted frame with the new pages under the finished leaf, then the leaf goes: never a frame with neither.
  useIso(() => {
    if (!landed) return;
    let r2;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        busy.current = false;
        lastTurnEnd.current = performance.now();
        // only this turn's leaf: a turn started in the meantime keeps its own
        setFlip((f) => (f === landed ? null : f));
        setLanded(null);
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [landed]);

  // Arrow keys, when this book is the one in front.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [role="tablist"], [contenteditable="true"]')) return;
      // The panel exists only on phones; if the screen grew past that while it was open, keys turn pages again.
      if (tocOpen && panel.current?.getClientRects().length) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeToc();
        }
        return;
      }
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
    // The mouse wheel and the trackpad turn pages too, one page per gesture. Events arrive in streams, and a pause of
    // over 140ms starts a new gesture. A gesture turns at most one page, and only if it began after the last turn
    // ended, so trackpad momentum never turns a second page and nothing queues during a turn. A clearly harder push in
    // the middle of a long stream counts as a new gesture, for wheels that never pause.
    const onWheel = (e) => {
      if (e.ctrlKey) return; // pinch to zoom
      if (tocOpen && panel.current?.getClientRects().length) return;
      const g = gesture.current;
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      let d = sideways ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      if (!d) return;
      const now = performance.now();
      if (now - g.last > 140) Object.assign(g, { start: now, total: 0, used: false, speeds: [] });
      g.last = now;
      g.speeds.push(Math.abs(d));
      if (g.speeds.length > 60) g.speeds.shift();
      g.total += Math.abs(d);
      const dir = Math.sign(d);
      // Whatever scrolls under the pointer (the page's text, the trace, a row of tabs) scrolls first, and a gesture
      // that scrolled anything never also turns the page.
      if (scrollsFurther(e.target, dir, sideways, bookEl.current)) {
        g.used = true;
        return;
      }
      // Ours from here: a sideways swipe must not reach the browser, where it would go back a page.
      e.preventDefault();
      if (busy.current) {
        g.used = true;
        return;
      }
      const fresh = !g.used && g.start >= lastTurnEnd.current && g.total >= 15;
      const recent = mean(g.speeds.slice(-6));
      const push = g.speeds.length >= 30 && recent > 12 && recent > mean(g.speeds.slice(-30, -6)) * 1.8 && now - lastTurnEnd.current > 300;
      if (!fresh && !push) return;
      g.used = true;
      g.speeds = [];
      // A shut front cover opens to the wheel either way.
      if (shut === 'front') openCover();
      else (dir > 0 ? next : prev)();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [active, next, prev, onClose, shut, openCover, tocOpen, closeToc]);

  // A page whose words don't fit scrolls inside itself, and a wide table scrolls sideways; while one does, it takes
  // focus so the keyboard can scroll it (on a page, left and right still turn pages). Checked whenever a scroller or
  // its contents change size.
  useEffect(() => {
    const book = bookEl.current;
    if (!book || typeof ResizeObserver === 'undefined') return;
    const scrollers = () => book.querySelectorAll('.pages .page-body, .pages .tablebox, .pages pre.code');
    const check = () =>
      scrollers().forEach((b) => {
        const over = b.matches('.page-body') ? b.scrollHeight > b.clientHeight + 1 : b.scrollWidth > b.clientWidth + 1;
        if (over) b.setAttribute('tabindex', '0');
        else b.removeAttribute('tabindex');
      });
    const ro = new ResizeObserver(check);
    scrollers().forEach((b) => {
      ro.observe(b);
      if (b.firstElementChild) ro.observe(b.firstElementChild);
    });
    check();
    return () => ro.disconnect();
  }, [spread, side, flip, shut]);

  // The contents panel takes focus as it opens; the panel focuses its first link.
  useEffect(() => {
    if (tocOpen) panel.current?.querySelector('a, button')?.focus({ preventScroll: true });
  }, [tocOpen]);

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
    if (Math.abs(dx) <= 50 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    // The shut front cover opens to a swipe either way.
    if (shut === 'front' && !busy.current) turn(0);
    else (dx < 0 ? next : prev)();
  };
  // The browser took the gesture over (a vertical scroll inside the page): not a swipe.
  const onPointerCancel = () => {
    swipe.current = null;
  };

  // ---- what is drawn where ----
  // i is a page number, or 'front' / 'back' for the outside of a cover.
  const renderPage = (i, sideClass, hidden) => {
    if (i === 'front') return <CoverFace render={cover} sideClass={sideClass} />;
    if (i === 'back') return <CoverFace render={backCover} sideClass={sideClass} back />;
    if (i == null || i < 0 || i >= N) return <div className={`page ${sideClass} blank${hidden ? ' pre' : ''}`} />;
    const p = pages[i];
    // Derived from the page itself, not the current spread, so a page on a turning leaf already shows what it will show once the turn lands.
    const s = Math.floor(i / 2);
    const isLeft = i % 2 === 0;
    return (
      <div className={`page ${sideClass}${isLeft ? ' with-margin' : ' with-theme'}${hidden ? ' pre' : ''}`} aria-label={`Page ${i + 1}`}>
        {isLeft && <Margin chapters={chapters} current={s} onGo={(k) => turn(k * 2)} onClose={onClose} />}
        <div className="page-head" aria-hidden="true">
          <span>{p.head}</span>
        </div>
        <div className="page-body">{p.render()}</div>
        <div className="page-foot" aria-hidden="true">
          {/* A spread names its chapter on the left page; one page at a time, on the right page. */}
          {chapters[s] && (
            <span className="foot-label">
              <span className="foot-ch">{chapters[s].label}</span>
              <span className="num">{s + 1} / {nSpreads}</span>
            </span>
          )}
          <span className="pno">{i + 1}</span>
          {/* One page at a time: just the page number out of the book's pages. */}
          <span className="foot-phone">{i + 1} / {N}</span>
        </div>
      </div>
    );
  };

  // The pages underneath, keyed by page number so a page keeps its state when it moves from "about to show" to "shown".
  // A page that first appears on the leaf is mounted here too, hidden and already drawn (static), so it never draws twice.
  const slots = [[], []];
  const put = (i, hidden = false, still = false) => slots[parity(i === 'back' ? N : i)].push({ i, hidden, still });
  // Positions -1 and N are the covers.
  const at = (p) => (p === -1 ? 'front' : p === N ? 'back' : p);
  const live = flip && flip !== landed ? flip : null;
  let leafEl = null;
  let baseSide = side;
  const face = (which, i, sideClass) => (
    <div className={`face ${which}`}>
      {renderPage(i, sideClass)}
      <span className="shade" ref={which === 'front' ? shadeA : shadeB} />
    </div>
  );
  if (flip) {
    const f = flip;
    if (f.kind === 'single') {
      // Forward: the current page lifts away to reveal the next. Back: the previous page comes down over the current one.
      const under = f.dir > 0 ? f.to : f.from;
      const over = f.dir > 0 ? f.from : f.to;
      leafEl = (
        <div className="leaf leaf-single" ref={leaf} style={{ transform: f.dir > 0 ? 'none' : 'rotateY(-180deg)' }}>
          {face('front', at(over), 'left')}
          {face('back', null, 'left')}
        </div>
      );
      if (live) {
        put(at(under));
        if (f.dir < 0 && f.to >= 0) put(f.to, true, true);
        baseSide = parity(under);
      }
    } else if (f.kind === 'spread') {
      const [l, r] = f.dir > 0 ? [f.from + 1, f.to] : [f.from, f.to + 1];
      leafEl = (
        <div className={`leaf ${f.dir > 0 ? 'leaf-right' : 'leaf-left'}`} ref={leaf}>
          {face('front', l, f.dir > 0 ? 'right' : 'left')}
          {face('back', r, f.dir > 0 ? 'left' : 'right')}
        </div>
      );
      if (live) {
        if (f.dir > 0) {
          put(f.from);
          put(f.to, true, true);
          put(f.to + 1);
        } else {
          put(f.to);
          put(f.from + 1);
          put(f.to + 1, true, true);
        }
      }
    } else {
      // A cover turns on the right half: the front cover over the first page, or the last right page onto the back cover.
      const front = f.kind === 'cover';
      const open = front ? (f.dir > 0 ? f.to : f.from) : f.dir > 0 ? f.from : f.to;
      const opening = front === f.dir > 0;
      // The leaf is a cover board: it carries its own board edge, so the board travels with it instead of standing bare.
      leafEl = (
        <div className="leaf leaf-right leaf-cover" ref={leaf}>
          <div className="leaf-board" />
          {face('front', front ? 'front' : open + 1, 'right')}
          {face('back', front ? open : 'back', 'left')}
        </div>
      );
      if (live) {
        // The half the cover has left shows the bare board; the page that comes with the turning leaf waits there, hidden.
        put(open, front, front && opening);
        put(open + 1, !front, !front && opening);
      }
    }
  }
  if (!live) {
    put(spread * 2);
    put(spread * 2 + 1);
  }

  const coverShut = !!shut && !live;
  const pos = live ? live.to : shut === 'front' ? -1 : shut === 'back' ? N : spread * 2 + side;
  const shownSpread = Math.max(0, Math.min(nSpreads - 1, Math.floor(pos / 2)));
  const ch = chapters[shownSpread];
  const turning = live && (live.kind === 'cover' || live.kind === 'back-cover') ? ` turning-${live.kind === 'cover' ? 'front' : 'back'}` : '';
  // The covers carry no page chrome: it fades while a cover turns and while the book is shut.
  const covering = live && [-1, N].some((p) => p === live.from || p === live.to);

  return (
    <BookContext.Provider value={{ go, active }}>
      <div className={`book-wrap ${variant}${coverShut ? ' shut' : ''}`}>
        <div
          ref={bookEl}
          className={`book${coverShut ? ' closed' : ''}${coverShut && shut === 'back' ? ' at-back' : ''}${turning}${covering ? ' covering' : ''}`}
          data-side={baseSide ? 'right' : 'left'}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          role="region"
          aria-roledescription="book"
          aria-label={title}
        >
          <div className="spine" aria-hidden="true" />
          <div className="pages">
            {slots.map((list, k) => (
              <div key={k} className="slot">
                {list.map(({ i, hidden, still }) => (
                  <StaticContext.Provider key={i} value={still}>
                    {renderPage(i, k ? 'right' : 'left', hidden)}
                  </StaticContext.Provider>
                ))}
              </div>
            ))}
          </div>
          {leafEl && <StaticContext.Provider value={true}><div className="leaves" aria-hidden="true">{leafEl}</div></StaticContext.Provider>}
          {coverShut && (
            <>
              <div className="cover-layer front">
                <CoverFace render={cover} sideClass="right" open={openCover} />
              </div>
              {backCover && (
                <div className="cover-layer back">
                  <CoverFace render={backCover} sideClass="left" back toStart={() => turn(0)} />
                </div>
              )}
            </>
          )}
          {(!coverShut || held) && (
            <>
              <button type="button" className="corner prev" onClick={prev} disabled={shut === 'front'} aria-label={shut === 'back' ? 'Open the back cover' : 'Previous page'}>
                <span className="ear" aria-hidden="true">‹</span>
                <span className="tip" aria-hidden="true">{shut === 'back' ? 'Open' : 'Previous page'}</span>
              </button>
              <button type="button" className="corner next" onClick={next} disabled={shut === 'back'} aria-label="Next page">
                <span className="ear" aria-hidden="true">›</span>
                <span className="tip" aria-hidden="true">Next page</span>
              </button>
            </>
          )}
          {/* The book's own chrome, above the pages and the turning leaf, so it stays still while the paper turns under it. */}
          <div className="chrome">
            <div className="book-theme">
              <ThemeToggle />
            </div>
            <button
              type="button"
              className="ribbon"
              ref={ribbon}
              aria-expanded={tocOpen}
              aria-controls={`${variant}-contents`}
              onClick={() => (tocOpen ? closeToc() : setTocOpen(true))}
            >
              Contents
            </button>
            <div className={`toc-panel${tocOpen ? ' open' : ''}`} id={`${variant}-contents`}>
              <div className="toc-scrim" onClick={closeToc} />
              <div className="toc-sheet" ref={panel}>
                <Margin
                  chapters={chapters}
                  current={shownSpread}
                  onGo={(k) => {
                    closeToc();
                    turn(k * 2);
                  }}
                  onClose={onClose}
                />
              </div>
            </div>
          </div>
          {onClose && (
            <button type="button" className="close" onClick={onClose} aria-label="Close this entry and return to the notebook">
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        {/* Phones and tall screens only: there is no room for the margin contents (or its theme toggle) there. */}
        <div className="book-bar">
          <button type="button" className="barbtn bar-turn" onClick={prev} disabled={shut === 'front'} aria-label="Previous page">‹ <span className="bt">Back</span></button>
          <label className="toc">
            <span className="sr">Go to chapter</span>
            <select
              value={held && shut ? shut : shownSpread}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'close') onClose();
                else turn(v === 'front' ? -1 : v === 'back' ? N : Number(v) * 2);
              }}
            >
              {held && cover && <option value="front">Cover</option>}
              {chapters.map((c, i) => (
                <option key={c.id} value={i}>{c.label}</option>
              ))}
              {held && backCover && <option value="back">Back cover</option>}
              {/* the margin's "Back to the notebook" has no room on one-page screens */}
              {onClose && <option value="close">← Back to the notebook</option>}
            </select>
          </label>
          <button type="button" className="barbtn bar-turn" onClick={next} disabled={shut === 'back'} aria-label="Next page"><span className="bt">Turn</span> ›</button>
          <ThemeToggle />
        </div>
        <span className="sr" aria-live="polite">{shut === 'front' ? 'Cover' : shut === 'back' ? 'Back cover' : `${ch?.label}, ${shownSpread + 1} of ${nSpreads}`}</span>
      </div>
    </BookContext.Provider>
  );
}

/** The left page's outer margin: resume and the book's contents with the current chapter underlined in red pen. */
function Margin({ chapters, current, onGo, onClose }) {
  return (
    <div className="margin">
      <div className="margin-top">
        <a className="mlink" href={LINKS.resume} target="_blank" rel="noopener">Resume</a>
      </div>
      <nav aria-label="Contents">
        <span className="lbl">Contents</span>
        <ol>
          {chapters.map((c, k) => (
            <li key={c.id}>
              <a
                href={c.href || `#${c.id}`}
                aria-current={k === current ? 'true' : undefined}
                onClick={(e) => {
                  if (c.href) return;
                  e.preventDefault();
                  onGo(k);
                }}
              >
                {/* Drawn already, so the underline doesn't redraw when the turning leaf hands over to the page beneath. */}
                {k === current ? <StaticContext.Provider value={true}><Mark kind="under">{c.label}</Mark></StaticContext.Provider> : c.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {onClose && (
        <button type="button" className="mback" onClick={onClose}>
          <span aria-hidden="true">← </span>Back to the notebook
        </button>
      )}
    </div>
  );
}

function CoverFace({ render, sideClass, back, open, toStart }) {
  return <div className={`page ${sideClass} cover${back ? ' back-cover' : ''}`}>{render && render({ open, toStart })}</div>;
}
