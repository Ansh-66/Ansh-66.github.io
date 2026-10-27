import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

// True while a page is being drawn on a turning leaf. Components render their
// finished state there and skip observers and timers.
export const StaticContext = createContext(false);
export const useIsStatic = () => useContext(StaticContext);

export const EMAIL = 'anshkumarsingh107@gmail.com';
export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/anshks',
  github: 'https://github.com/Ansh-66',
  resume: '/Ansh_Kumar_Singh_Resume.pdf',
  demo: 'https://drive.google.com/file/d/19X58cKDnBxULvZTbs0d39nogYVOV5TLf/view?usp=sharing',
  graphRepo: 'https://github.com/Ansh-66/Insurance-Graph-RAG',
  ragRepo: 'https://github.com/Ansh-66/rag-from-scratch',
  agentsRepo: 'https://github.com/Ansh-66/single-vs-multi-agent',
};

// A layout effect in the browser, a plain effect on the server (where layout effects warn).
export const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useInView(ref, { once = true, rootMargin = '0px' } = {}) {
  const isStatic = useIsStatic();
  const [inView, setInView] = useState(isStatic);
  useEffect(() => {
    if (isStatic) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isStatic, once, rootMargin, ref]);
  return inView;
}

// Set once the first render has hydrated; pages mounted after that may animate in.
export const hydration = { done: false };

/** True for one moment after a page appears (never on first load), so figures can grow from empty. */
export function useArrive() {
  const isStatic = useIsStatic();
  const [fresh, setFresh] = useState(() => hydration.done && !isStatic && !prefersReducedMotion());
  useEffect(() => {
    if (!fresh) return;
    let r2;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setFresh(false));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [fresh]);
  return fresh;
}

const PATHS = {
  ring: 'M8,21 C7,9 38,3 62,4 C86,5 97,12 95,22 C93,33 70,38 46,37 C22,36 3,31 7,18 C9,12 17,8 30,6',
  under: 'M2,6 C22,3 44,8 64,5 C78,3 90,6 98,4',
  strike: 'M2,5 C30,3 66,6 98,3',
};

/** Wraps text with a hand-drawn red-pen mark that draws itself when the page appears. */
export function Mark({ kind = 'ring', children }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <span className="mark-wrap" ref={ref}>
      {children}
      <svg className={`mark ${kind}${inView ? ' in' : ''}`} viewBox={kind === 'ring' ? '0 0 100 40' : '0 0 100 10'} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={PATHS[kind]} pathLength="1" />
      </svg>
    </span>
  );
}

export function Pen({ children, arrow, className = '' }) {
  return (
    <p className={`pen ${className}`}>
      {arrow && <span className="pen-arrow" aria-hidden="true">{arrow} </span>}
      {children}
    </p>
  );
}

export function Fig({ n, caption, children }) {
  return (
    <figure className="fig">
      {children}
      {caption && (
        <figcaption>
          <b>Fig. {n}</b>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function Ext({ href, children, className = 'ext' }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr"> (opens in a new tab)</span>
    </a>
  );
}

/** target: the id of the address shown as text, selected for the reader when the clipboard is refused. */
export function CopyEmail({ className = 'btn', target = 'email-text' }) {
  const [state, setState] = useState('idle');
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setState('done');
    } catch (e) {
      const el = document.getElementById(target);
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
      setState('select');
    }
    setTimeout(() => setState('idle'), 2200);
  };
  return (
    <button type="button" className={className} onClick={onClick} aria-live="polite">
      {state === 'done' ? 'Email copied' : state === 'select' ? 'Selected, press Ctrl+C' : 'Copy email'}
    </button>
  );
}

export function ThemeToggle() {
  const toggle = () => {
    const d = document.documentElement;
    const current = d.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    d.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
  };
  return (
    <button type="button" className="iconbtn" onClick={toggle} aria-label="Switch between light and dark theme" title="Light or dark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" />
      </svg>
    </button>
  );
}
