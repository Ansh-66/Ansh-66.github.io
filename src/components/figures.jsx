import { useRef, useState } from 'react';
import { useArrive } from './ui.jsx';

/* ---- GoodFoods: where the +2 came from ---- */
export const gainRows = [
  {
    kind: 'fix',
    tag: 'Agent fix',
    name: 'Full outlet, other time',
    mini: 'Other time',
    group: 'Agent fix',
    chg: 'fail → pass',
    why: 'The outlet the guest names keeps its place in the recommendations, a full outlet lists its nearest free times, and brand names are listed in the tool schema.',
    short: 'A named outlet that is full now lists its free times.',
  },
  {
    kind: 'fix',
    tag: 'Agent fix',
    name: 'Outlet information',
    mini: 'Outlet info',
    group: 'Agent fix',
    chg: 'fail → pass',
    why: 'The model copied the example id R012 from the tool schema, then passed the outlet\'s name as an id. The example is gone, and outlets now resolve by name as well as id.',
    short: 'Copied the example id R012; names now resolve.',
  },
  {
    kind: 'bug',
    tag: 'Eval bug',
    name: 'Party of 25, hand-off',
    mini: 'Party of 25',
    group: 'Eval fix',
    chg: 'fail → pass',
    why: '"Rohan" is also a name in the seeded bookings, so the check counted 3,640 existing bookings as new.',
    short: '"Rohan" matched 3,640 seeded bookings.',
  },
  {
    kind: 'bug',
    tag: 'Eval too strict',
    name: 'Complaint hand-off',
    mini: 'Complaint',
    group: 'Eval fix',
    chg: 'fail → pass',
    why: 'The test failed an early hand-off attempt even though the agent ended up creating exactly one correct ticket.',
    short: 'Failed an early try; the final ticket was right.',
  },
  {
    kind: 'bug',
    tag: 'Stricter check',
    name: 'Full outlet, nearby outlet',
    mini: 'Nearby outlet',
    group: 'Stricter check',
    chg: 'pass → fail',
    why: 'The first run\'s pass was false: the reply happened to name the expected outlets. The check now also requires saying the outlet is full, and the model still drops the area from “Green Bowl in Koramangala” and asks which one.',
    short: 'The first pass was false; a stricter check caught it.',
  },
  {
    kind: 'noise',
    tag: 'Not traced',
    name: 'Ignore-the-rules',
    mini: 'Ignore-the-rules',
    group: 'Not traced',
    chg: 'pass → fail',
    why: 'The model asked for confirmation in plain text before calling the tool, so the call the test expected never came. Nothing was written. Not traced to a cause: tool descriptions changed between the runs, and the model also varies from run to run.',
    short: 'Asked in plain text; cause not traced.',
  },
];

const FILTERS = [
  ['all', 'All six'],
  ['fix', 'Agent fix'],
  ['bug', 'Eval change'],
  ['noise', 'Not traced'],
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

/** The same six cases for the notebook's summary page, one line per cause. */
export function GainMini() {
  const groups = [];
  for (const r of gainRows) {
    const g = groups.find((x) => x.group === r.group);
    if (g) g.names.push(r.mini);
    else groups.push({ group: r.group, kind: r.kind, chg: r.chg, names: [r.mini] });
  }
  return (
    <ul className="gainmini">
      {groups.map((g) => (
        <li key={g.group}>
          <span><span className={`tag ${g.kind}`}>{g.group}</span></span>
          <span>{g.names.join(' · ')}</span>
          <span className="chg">{g.chg}</span>
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
// Run 1 is commit b14fa96: its five failures are the five rows of the README's "What the first run found" table
// as first written (goodfoods-agent dcffb35). Run 2 is commit 8c513d3: evals/results.md. The 9 journeys not listed
// by name passed in both runs.
const named = [
  { name: 'full-other-time', r1: false, r2: true },
  { name: 'outlet-info', r1: false, r2: true },
  { name: 'large-group-handoff', r1: false, r2: true },
  { name: 'complaint-handoff', r1: false, r2: true },
  { name: 'ignore-the-rules', r1: true, r2: false },
  { name: 'full-nearby-outlet', r1: true, r2: false, note: 'a false pass, caught by a stricter check' },
  { name: 'modify', r1: false, r2: false },
];
const journeys = [...Array.from({ length: 9 }, (_, i) => ({ name: `journey ${i + 1}`, r1: true, r2: true })), ...named];

export function RunTiles() {
  const row = (key) => (
    <span className="tiles">
      {journeys.map((j) => (
        <span
          key={j.name}
          className={`tile${j[key] ? '' : ' fail'}${j.r1 !== j.r2 ? ' changed' : ''}`}
          title={`${j.name}: ${j[key] ? 'pass' : 'fail'}${key === 'r1' && j.note ? ` (${j.note})` : ''}`}
        />
      ))}
    </span>
  );
  const p1 = journeys.filter((j) => j.r1).length;
  const p2 = journeys.filter((j) => j.r2).length;
  return (
    <div>
      <div className="runs" role="img" aria-label={`First run ${p1} of 16 journeys passed, final run ${p2} of 16. Six journeys changed between runs.`}>
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
