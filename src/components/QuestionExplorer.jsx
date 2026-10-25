import { useState } from 'react';
import data from '../data/graphEval.json';

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
  return (
    <div>
      <div className="qx-tabs" role="tablist" aria-label="Evaluation questions">
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
