import { useRef, useState } from 'react';
import { useArrive } from './ui.jsx';

/* ---- GoodFoods: where the +2 came from ---- */
export const gainRows = [
  {
    kind: 'fix',
    tag: 'Agent fix',
    name: 'Full outlet, other time',
    chg: 'fail → pass',
    why: 'The outlet the guest names keeps its place in the recommendations, a full outlet lists its nearest free times, and brand names are listed in the tool schema.',
    short: 'Named outlet keeps its place; full outlets list their nearest free times.',
  },
  {
    kind: 'bug',
    tag: 'Eval bug',
    name: 'Party of 25, hand-off',
    chg: 'fail → pass',
    why: '"Rohan" is also a name in the seeded bookings, so the check counted 3,640 existing bookings as new.',
    short: '"Rohan" in the seeded data made 3,640 old bookings count as new.',
  },
  {
    kind: 'bug',
    tag: 'Eval too strict',
    name: 'Complaint hand-off',
    chg: 'fail → pass',
    why: 'The test failed an early hand-off attempt even though the agent ended up creating exactly one correct ticket.',
    short: 'Failed an early hand-off that still produced one correct ticket.',
  },
  {
    kind: 'noise',
    tag: 'Noise',
    name: 'Ignore-the-rules',
    chg: 'pass → fail',
    why: 'Run-to-run variation, not a code change. The model asked for confirmation itself before calling the tool. Safe, but the test expected the tool call.',
    short: 'Run-to-run variation; no code changed.',
  },
];

const FILTERS = [
  ['all', 'All four'],
  ['fix', 'Agent fix'],
  ['bug', 'Eval bug'],
  ['noise', 'Noise'],
];

export function GainTable({ full }) {
  const [f, setF] = useState('all');
  return (
    <div>
      <div className="filters" role="group" aria-label="Filter by cause">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" className="filter" aria-pressed={f === k} onClick={() => setF(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="tablebox">
        <table className="cause-table">
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Run 1 → run 2</th>
              <th scope="col">Cause</th>
            </tr>
          </thead>
          <tbody>
            {gainRows.map((r) => (
              <tr key={r.name} className={f === 'all' || f === r.kind ? '' : 'dim'}>
                <td>{r.name}</td>
                <td className="chg">{r.chg}</td>
                <td>
                  <span className={`tag ${r.kind}`}>{r.tag}</span> {full ? r.why : r.short}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The same four cases, one line each, for the notebook's summary page. */
export function GainMini() {
  return (
    <ul className="gainmini">
      {gainRows.map((r) => (
        <li key={r.name}>
          <span><span className={`tag ${r.kind}`}>{r.tag}</span></span>
          <span>{r.name}</span>
          <span className="chg">{r.chg}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---- Graph RAG: three arms ---- */
const ARMS = {
  overall: { label: 'All 11 questions', of: 11, v: { graph: 10, vector: 9, none: 3 } },
  cross: { label: 'Cross-article (4)', of: 4, v: { graph: 4, vector: 3, none: 1 } },
};

export function ArmBars() {
  const [k, setK] = useState('cross');
  const ref = useRef(null);
  const waiting = useArrive();
  const d = ARMS[k];
  const rows = [
    ['graph', 'Graph RAG'],
    ['vector', 'Vector RAG'],
    ['none', 'Model alone'],
  ];
  return (
    <div ref={ref}>
      <div className="filters" role="group" aria-label="Question set">
        {Object.entries(ARMS).map(([key, a]) => (
          <button key={key} type="button" className="filter" aria-pressed={k === key} onClick={() => setK(key)}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="bars">
        {rows.map(([key, label]) => (
          <div key={key} className={`bar${key === 'graph' ? ' best' : ''}`}>
            <span>{label}</span>
            <span className="track" role="img" aria-label={`${label}: ${d.v[key]} of ${d.of} correct`}>
              <span className="fill" style={{ display: 'block', transform: `scaleX(${waiting ? 0 : d.v[key] / d.of})` }} />
            </span>
            <span className="v">
              {d.v[key]}/{d.of}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- RAG from scratch: hit@1 before and after ---- */
export function HitDots() {
  const before = 13;
  const after = 17;
  const n = 17;
  return (
    <div className="dots">
      <div className="dotrow">
        <span>Before fix</span>
        <span className="pts" role="img" aria-label={`${before} of ${n} questions hit at rank 1`}>
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={`pt${i < before ? ' on' : ''}`} />
          ))}
        </span>
        <span className="v">{before}/{n}</span>
      </div>
      <div className="dotrow">
        <span>After fix</span>
        <span className="pts" role="img" aria-label={`${after} of ${n} questions hit at rank 1`}>
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={`pt on${i >= before ? ' new' : ''}`} />
          ))}
        </span>
        <span className="v">{after}/{n}</span>
      </div>
    </div>
  );
}

/* ---- GoodFoods: two eval runs, tile per journey ---- */
// The 10 journeys not listed by name passed in both runs (11 passes in run 1,
// of which only ignore-the-rules is among the six named cases).
const named = [
  { name: 'full-other-time', r1: false, r2: true },
  { name: 'large-group-handoff', r1: false, r2: true },
  { name: 'complaint-handoff', r1: false, r2: true },
  { name: 'ignore-the-rules', r1: true, r2: false },
  { name: 'full-nearby-outlet', r1: false, r2: false },
  { name: 'modify', r1: false, r2: false },
];
const journeys = [...Array.from({ length: 10 }, (_, i) => ({ name: `journey ${i + 1}`, r1: true, r2: true })), ...named];

export function RunTiles() {
  const row = (key) => (
    <span className="tiles">
      {journeys.map((j) => (
        <span
          key={j.name}
          className={`tile${j[key] ? '' : ' fail'}${j.r1 !== j.r2 ? ' changed' : ''}`}
          title={`${j.name}: ${j[key] ? 'pass' : 'fail'}`}
        />
      ))}
    </span>
  );
  const p1 = journeys.filter((j) => j.r1).length;
  const p2 = journeys.filter((j) => j.r2).length;
  return (
    <div>
      <div className="runs" role="img" aria-label={`First run ${p1} of 16 journeys passed, final run ${p2} of 16. Four journeys changed between runs.`}>
        <div className="runrow">
          <span className="mono">Run 1</span>
          {row('r1')}
          <span className="num">{p1}/16</span>
        </div>
        <div className="runrow">
          <span className="mono">Run 2</span>
          {row('r2')}
          <span className="num">{p2}/16</span>
        </div>
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--ink)' }} /> pass</span>
        <span><i style={{ border: '1.5px solid var(--pen)' }} /> fail</span>
        <span><i style={{ border: '1.5px dashed var(--ink-2)' }} /> changed between runs</span>
      </div>
    </div>
  );
}
