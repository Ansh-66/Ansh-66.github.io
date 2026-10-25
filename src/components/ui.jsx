import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

// True while a page is being drawn inside the turning page layer. Components
// render their finished state there and skip observers and timers.
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

export function useInView(ref, { once = true, rootMargin = '0px 0px -12% 0px' } = {}) {
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

/**
 * For things that animate in. Returns true only while the element is still
 * below the fold, so the prerendered page (and anything already on screen)
 * shows the finished state and never flashes empty.
 */
export function useReveal(ref) {
  const isStatic = useIsStatic();
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (isStatic || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setWaiting(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setWaiting(false);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isStatic, ref]);
  return waiting;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const PATHS = {
  ring: 'M8,21 C7,9 38,3 62,4 C86,5 97,12 95,22 C93,33 70,38 46,37 C22,36 3,31 7,18 C9,12 17,8 30,6',
  under: 'M2,6 C22,3 44,8 64,5 C78,3 90,6 98,4',
  strike: 'M2,5 C30,3 66,6 98,3',
};

/** Wraps text with a hand-drawn red-pen mark that draws itself when seen. */
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

/** A red-pen note. */
export function Pen({ children, arrow }) {
  return (
    <p className="pen">
      {arrow && <span className="pen-arrow" aria-hidden="true">{arrow}</span>}
      {children}
    </p>
  );
}

/** A notebook row: margin column on the left, content on the right. */
export function Row({ note, children, wide, id, className = '' }) {
  return (
    <div className={`row ${className}`} id={id}>
      <div className="margin">{note}</div>
      <div className={`body${wide ? ' wide' : ''}`}>{children}</div>
    </div>
  );
}

export function Fig({ n, caption, children, label }) {
  return (
    <figure className="fig" aria-label={label}>
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

export function CopyEmail({ className = 'btn' }) {
  const [state, setState] = useState('idle');
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setState('done');
    } catch (e) {
      const r = document.createRange();
      const el = document.getElementById('email-text');
      if (el) {
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

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle() {
  const toggle = () => {
    const d = document.documentElement;
    const current = d.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    d.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
  };
  return (
    <button type="button" className="iconbtn" onClick={toggle} aria-label="Switch between light and dark theme" title="Light or dark">
      <ThemeIcon />
    </button>
  );
}

export function TopBar({ home }) {
  return (
    <header className="frame topbar">
      {home ? (
        <a className="brand" href="#top">Ansh Kumar Singh</a>
      ) : (
        <Link className="brand" to="/">← Ansh Kumar Singh</Link>
      )}
      <nav aria-label="Site">
        {home ? (
          <>
            <a className="navlink hide-sm" href="#work">Work</a>
            <a className="navlink hide-sm" href="#experience">Experience</a>
            <a className="navlink hide-sm" href="#contact">Contact</a>
          </>
        ) : (
          <Link className="navlink hide-sm" to="/#work">All entries</Link>
        )}
        <a className="navlink" href={LINKS.resume} target="_blank" rel="noopener">Resume</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="frame footer" id="contact">
      <span className="eyebrow">Contact</span>
      <a className="big-mail" id="email-text" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <div className="actions">
        <CopyEmail className="btn solid" />
        <Ext href={LINKS.linkedin} className="btn">LinkedIn</Ext>
        <Ext href={LINKS.github} className="btn">GitHub</Ext>
        <a className="btn" href={LINKS.resume} target="_blank" rel="noopener">Resume (PDF)</a>
      </div>
      <div className="colophon">
        <span>Pune, India · open to relocation and remote</span>
        <span>Site built with Claude · content and results are mine</span>
      </div>
    </footer>
  );
}

export function CornerIcon() {
  return (
    <svg className="corner" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 2h8l4 4v8H2z" />
      <path d="M10 2v4h4" />
    </svg>
  );
}
