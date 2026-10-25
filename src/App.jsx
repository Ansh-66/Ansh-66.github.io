import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { findRoute, normalise } from './routes.jsx';
import { StaticContext, prefersReducedMotion } from './components/ui.jsx';

const isBrowser = typeof window !== 'undefined';
const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

function Page({ location }) {
  const { Component } = findRoute(location.pathname);
  return <Component />;
}

function scrollToHash(hash) {
  if (!hash) return false;
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return false;
  el.scrollIntoView({ block: 'start' });
  return true;
}

function focusTitle() {
  const h = document.getElementById('page-title');
  if (h) h.focus({ preventScroll: true });
}

/** Divider tabs on the page edge: one per section, the current one marked. */
function Tabs({ location }) {
  const { tabs } = findRoute(location.pathname);
  const [current, setCurrent] = useState(null);
  useEffect(() => {
    if (!tabs.length || typeof IntersectionObserver === 'undefined') return;
    const els = tabs.map(([id]) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (list) => {
        const vis = list.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setCurrent(vis[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [location.pathname, tabs]);
  // Show the tabs only once the notebook page is on screen, so they never sit over the desk.
  const [on, setOn] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const s = document.querySelector('.sheet');
      setOn(!!s && s.getBoundingClientRect().top < 160);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [location.pathname]);
  if (!tabs.length) return null;
  return (
    <nav className={`tabs${on ? ' on' : ''}`} aria-label="Sections on this page">
      {tabs.map(([id, label]) => (
        <a key={id} className="tab" href={`#${id}`} aria-current={current === id ? 'true' : undefined}>
          {label}
        </a>
      ))}
    </nav>
  );
}

/**
 * The turning page. A copy of one page is drawn in a fixed layer and rotated
 * about the notebook's binding (the left edge of the page column).
 *  forward: the old page turns away, revealing the new page underneath.
 *  back:    the new page turns in from the left, covering the old one.
 */
function TurnLayer({ turn, onDone }) {
  const leaf = useRef(null);
  const inner = useRef(null);
  const shade = useRef(null);

  useIsoLayoutEffect(() => {
    let y = turn.y;
    if (turn.hash && inner.current) {
      const el = inner.current.querySelector(`[id="${CSS.escape(decodeURIComponent(turn.hash.slice(1)))}"]`);
      if (el) y = el.getBoundingClientRect().top - inner.current.getBoundingClientRect().top;
    }
    inner.current.style.transform = `translate3d(0, ${-y}px, 0)`;
    const phone = window.matchMedia('(max-width: 700px)').matches;
    const duration = phone ? 450 : 600;
    const easing = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
    const [a, b] = turn.dir === 'fwd' ? [0, -180] : [-180, 0];
    const anim = leaf.current.animate([{ transform: `rotateY(${a}deg)` }, { transform: `rotateY(${b}deg)` }], {
      duration,
      easing,
      fill: 'forwards',
    });
    const shadeAnim = shade.current.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration, easing });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone(y);
    };
    anim.onfinish = finish;
    anim.oncancel = finish;
    // Any input during the turn completes it at once rather than queueing.
    const skip = () => {
      try {
        anim.finish();
        shadeAnim.finish();
      } catch (e) {
        finish();
      }
    };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  return (
    <div className="turn" aria-hidden="true" style={{ perspectiveOrigin: `${turn.x}px 50%` }}>
      <div className="turn-leaf" ref={leaf} style={{ transformOrigin: `${turn.x}px 50%`, transform: turn.dir === 'fwd' ? 'none' : 'rotateY(-180deg)' }}>
        <div className="turn-front">
          <div ref={inner}>
            <StaticContext.Provider value={true}>
              <Page location={turn.layer} />
            </StaticContext.Provider>
          </div>
        </div>
        <div className="turn-back" style={{ left: turn.x, width: turn.w }} />
      </div>
      <div className="turn-shade" ref={shade} />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const [turn, setTurn] = useState(null);
  const scrolls = useRef({});
  const pending = useRef(null);
  const mounted = useRef(false);

  // Title and description follow the page on screen.
  useEffect(() => {
    const r = findRoute(shown.pathname);
    document.title = r.title;
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', r.description);
  }, [shown.pathname]);

  // A direct link with a hash lands on that section.
  useEffect(() => {
    if (location.hash) requestAnimationFrame(() => scrollToHash(location.hash));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply the scroll position a navigation asked for, once its page is drawn.
  useIsoLayoutEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    if (!(p.hash && scrollToHash(p.hash))) window.scrollTo(0, p.y || 0);
    if (p.focus) focusTitle();
  }, [shown]);

  const finishBack = useCallback((to, y) => {
    pending.current = { y, hash: null, focus: true };
    setShown(to);
    // Remove the layer on the next frame, after the page underneath has swapped.
    requestAnimationFrame(() => setTurn(null));
  }, []);

  useIsoLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const from = shown;
    const to = location;
    if (normalise(from.pathname) === normalise(to.pathname)) {
      setShown(to);
      if (to.hash) scrollToHash(to.hash);
      return;
    }
    scrolls.current[normalise(from.pathname)] = window.scrollY;
    const forward = findRoute(to.pathname).order > findRoute(from.pathname).order;
    const targetY = forward ? 0 : scrolls.current[normalise(to.pathname)] || 0;
    const frame = document.querySelector('.sheet');
    const rect = frame ? frame.getBoundingClientRect() : { left: 0, width: window.innerWidth };
    const canTurn = !prefersReducedMotion() && typeof Element !== 'undefined' && 'animate' in Element.prototype;

    if (!canTurn) {
      pending.current = { y: targetY, hash: to.hash, focus: true };
      setShown(to);
      return;
    }
    if (forward) {
      setTurn({ key: to.key, dir: 'fwd', layer: from, y: window.scrollY, hash: null, x: rect.left, w: rect.width });
      pending.current = { y: 0, hash: to.hash, focus: true };
      setShown(to);
    } else {
      setTurn({ key: to.key, dir: 'back', layer: to, from, y: targetY, hash: to.hash, x: rect.left, w: rect.width });
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTurnDone = (y) => {
    if (!turn) return;
    if (turn.dir === 'back') finishBack(turn.layer, y);
    else setTurn(null);
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Page location={shown} />
      <Tabs location={shown} />
      {turn && <TurnLayer key={turn.key} turn={turn} onDone={onTurnDone} />}
    </>
  );
}
