import { useEffect, useRef, useState } from 'react';
import { traces, TRACE_SOURCE, TRACE_SOURCE_SHORT } from '../data/traces.js';
import { prefersReducedMotion, useInView, useIsStatic } from './ui.jsx';

const DELAY = { guest: 850, agent: 1050, tool: 620, result: 560, gate: 900 };
const WHO = { guest: 'guest', agent: 'agent', tool: 'tool', result: 'result', gate: 'gate' };

export default function TraceReplay() {
  const isStatic = useIsStatic();
  const box = useRef(null);
  const screen = useRef(null);
  const inView = useInView(box, { once: false, rootMargin: '0px' });
  const [ti, setTi] = useState(0);
  const [shown, setShown] = useState(isStatic ? traces[0].lines.length : 0);
  const [playing, setPlaying] = useState(false);
  const started = useRef(isStatic);
  const animate = useRef(false);

  const trace = traces[ti];
  const total = trace.lines.length;

  // Start once, the first time the console is on screen.
  useEffect(() => {
    if (isStatic || started.current || !inView) return;
    started.current = true;
    if (prefersReducedMotion()) {
      setShown(total);
      return;
    }
    const t = setTimeout(() => {
      animate.current = true;
      setPlaying(true);
    }, 700);
    return () => clearTimeout(t);
  }, [inView, isStatic, total]);

  // Advance while playing; pause when scrolled away.
  useEffect(() => {
    if (!playing || !inView) return;
    if (shown >= total) {
      setPlaying(false);
      return;
    }
    const next = trace.lines[shown];
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 250 : DELAY[next.who] || 700);
    return () => clearTimeout(t);
  }, [playing, inView, shown, total, trace]);

  // Keep the newest line in view inside the console only (never the page).
  useEffect(() => {
    const el = screen.current;
    if (el && !isStatic) el.scrollTop = el.scrollHeight;
  }, [shown, ti, isStatic]);

  const pick = (i) => {
    setTi(i);
    animate.current = !prefersReducedMotion();
    if (prefersReducedMotion()) {
      setShown(traces[i].lines.length);
      setPlaying(false);
    } else {
      setShown(0);
      setPlaying(true);
    }
  };
  const replay = () => pick(ti);
  const step = (d) => {
    setPlaying(false);
    animate.current = true;
    setShown((s) => Math.max(0, Math.min(total, s + d)));
  };

  return (
    <section className="console" ref={box} aria-label="Replay of a GoodFoods agent run">
      <div className="console-head">
        <span className="console-title">
          <span className={`dot${playing ? '' : ' idle'}`} aria-hidden="true" />
          Replay · GoodFoods agent
        </span>
        <button type="button" className="cbtn" onClick={replay} aria-label="Replay this run from the start">
          ↺ Replay
        </button>
      </div>
      <div className="requests" role="group" aria-label="Pick a guest request">
        {traces.map((t, i) => (
          <button key={t.id} type="button" className="req" aria-pressed={i === ti} onClick={() => pick(i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="screen" ref={screen} tabIndex={0} aria-label="Conversation and tool calls">
        {trace.lines.slice(0, shown).map((l, i) => (
          <div key={`${ti}-${i}`} className={`tl ${l.who}${animate.current ? ' enter' : ''}`}>
            <span className="who">{WHO[l.who]}</span>
            <span className="what">{l.who === 'gate' ? <span>{l.text}</span> : l.text}</span>
          </div>
        ))}
        {shown < total && (
          <div className="tl">
            <span className="who" />
            <span className="what"><span className="caret" aria-hidden="true" /></span>
          </div>
        )}
      </div>
      <div className="console-foot">
        <div className="controls">
          <button type="button" className="cbtn" onClick={() => step(-1)} disabled={shown === 0} aria-label="Previous step">◀</button>
          <span className="step" aria-live="polite">
            {shown} / {total}
          </span>
          <button type="button" className="cbtn" onClick={() => step(1)} disabled={shown >= total} aria-label="Next step">▶</button>
        </div>
        <span className="console-note">
          <span className="note-long">{TRACE_SOURCE}</span>
          <span className="note-short">{TRACE_SOURCE_SHORT}</span>
        </span>
      </div>
    </section>
  );
}
