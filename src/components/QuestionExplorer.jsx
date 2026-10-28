import { useEffect, useRef, useState } from 'react';
import data from '../data/graphEval.json';
import { prefersReducedMotion } from './ui.jsx';

const TYPE = {
  cross_chunk: 'Cross-article',
  same_chunk: 'Same passage',
  single_hop: 'Single lookup',
  extraction_gap: 'Extraction gap',
  unanswerable: 'Unanswerable',
};
const ARM_LABEL = { no_context: 'Model alone', vector: 'Vector RAG', graph: 'Graph RAG' };

// Citation markers come back in several shapes (【2】, 【1†L1-L2】, [3]); show them all as [n].
const clean = (s) =>
  s
    .replace(/【(\d+)(?:†[^】]*)?】/g, '[$1]')
    .replace(/\*\*/g, '')
    .replace(/\s+\./g, '.')
    .trim();

export default function QuestionExplorer() {
  const [i, setI] = useState(0);
  const q = data[i];
  // The question tabs scroll sideways between two arrows; each arrow is on while there's more that way.
  const row = useRef(null);
  const [more, setMore] = useState({ before: false, after: true });
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => {
      const before = el.scrollLeft > 1;
      const after = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((m) => (m.before === before && m.after === after ? m : { before, after }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, []);
  // A whole tab at a time: › brings the first tab cut off on the right to the left edge, ‹ brings the one cut off on
  // the left fully into view.
  const scrollRow = (dir) => {
    const el = row.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const tabs = [...el.children].map((c) => c.getBoundingClientRect());
    const cut = dir > 0 ? tabs.find((c) => c.right > box.right + 1) : tabs.reverse().find((c) => c.left < box.left - 1);
    if (!cut) return;
    const by = dir > 0 ? cut.left - box.left : cut.right - box.right;
    el.scrollBy({ left: by, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  return (
    <div>
      <div className="qx-nav">
        <button type="button" className="qx-arrow" onClick={() => scrollRow(-1)} disabled={!more.before} aria-label="Show earlier questions">
          ‹
        </button>
        <div className="qx-tabs" ref={row} role="tablist" aria-label="Evaluation questions">
          {data.map((d, k) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              id={`qx-tab-${d.id}`}
              aria-selected={k === i}
              aria-controls="qx-panel"
              tabIndex={k === i ? 0 : -1}
              className="qx-tab"
              onClick={() => setI(k)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const n = (i + (e.key === 'ArrowRight' ? 1 : data.length - 1)) % data.length;
                  setI(n);
                  document.getElementById(`qx-tab-${data[n].id}`)?.focus();
                }
              }}
            >
              {d.id.toUpperCase()}
              <small>{TYPE[d.type]}</small>
            </button>
          ))}
        </div>
        <button type="button" className="qx-arrow" onClick={() => scrollRow(1)} disabled={!more.after} aria-label="Show more questions">
          ›
        </button>
      </div>
      <div id="qx-panel" role="tabpanel" aria-labelledby={`qx-tab-${q.id}`}>
        <p className="qx-q">{q.question}</p>
        <p className="qx-gold">
          <span className="lbl inline">Correct answer</span> {q.gold}
          {q.bridge && (
            <>
              {' '}· <span className="lbl inline">bridge, never named in the question</span> {q.bridge}
            </>
          )}
        </p>
        <div className="qx-arms">
          {['no_context', 'vector', 'graph'].map((a) => {
            const r = q.arms[a];
            return (
              <div key={a} className={`arm ${r.correct ? 'ok' : 'no'}`}>
                <div className="arm-h">
                  <span className="mono">{ARM_LABEL[a]}</span>
                  <span className={`verdict ${r.correct ? 'ok' : 'no'}`}>{r.correct ? 'correct' : 'wrong'}</span>
                </div>
                <p>{clean(r.answer)}</p>
                {r.comment && <p className="note">{r.comment}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
