import { Link } from 'react-router';
import TraceReplay from '../components/TraceReplay.jsx';
import { ArmBars, GainMini, HitDots } from '../components/figures.jsx';
import { CopyEmail, EMAIL, Ext, Fig, LINKS, Mark, Pen } from '../components/ui.jsx';

export const mainChapters = [
  { id: 'intro', label: 'Intro' },
  { id: 'experience', label: 'Experience' },
  { id: 'reservation-agent', label: 'Entry 1' },
  { id: 'graph-rag', label: 'Entry 2' },
  { id: 'rag-from-scratch', label: 'Entry 3' },
  { id: 'single-vs-multi-agent', label: 'Entry 4' },
  { id: 'contact', label: 'Contact' },
];

function RunEntry({ to }) {
  return (
    <Link className="run" to={to}>
      <span className="run-dot" aria-hidden="true" />
      Run the full entry
      <span aria-hidden="true"> →</span>
    </Link>
  );
}

function EntryMeta({ no, when }) {
  return (
    <div className="entry-meta">
      <span className="no">{no}</span>
      <span className="lbl">{when}</span>
    </div>
  );
}

function Chips({ items }) {
  return (
    <ul className="chips" aria-label="Stack">
      {items.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

// A pipeline strip: mono chips joined by arrows; the key step is ringed in red pen
function Flow({ steps, keyStep }) {
  return (
    <ol className="flow" aria-label="Flow">
      {steps.map((s, i) => (
        <li key={s} className={i === keyStep ? 'key' : undefined}>
          {i > 0 && <span className="arr" aria-hidden="true">→</span>}
          <span className="step">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function QSR({ q, s, r }) {
  return (
    <dl className="qsr">
      <dt>Question</dt>
      <dd>{q}</dd>
      <dt>Setup</dt>
      <dd>{s}</dd>
      <dt>Result</dt>
      <dd>{r}</dd>
    </dl>
  );
}

// Entry 4 is still running: predictions are written before the first run, results go beside them later
const PREDICTIONS = [
  ['Control (2 questions)', "All three arms get 2/2. B uses 2–3× A's tokens."],
  ['Comparison (3)', 'A tie, or B wins by one.'],
  ['Temporal (3)', 'B ≤ A. B loses at least one to "lost in merge".'],
  ['Verification (3)', 'C beats B on grounding on at least 2 of 3, but on correctness by at most 1.'],
  ['Aggregation (2)', 'Every arm finds at most half the required facts. B does slightly better than A.'],
];

const STATE_MARK = { done: '✓', doing: '◐', todo: '○' };
const STATE_LABEL = { done: 'Done', doing: 'In progress', todo: 'Not started' };
const PROGRESS = [
  ['done', 'Spike: tool calling on Groq, tokens per call measured'],
  ['doing', 'Tools, cache and logging'],
  ['todo', 'Arm A: the single-agent loop'],
  ['todo', 'Question set and gold answers'],
  ['todo', 'Arms B and C'],
  ['todo', 'Full run and scoring'],
  ['todo', 'Write-up'],
];

// The notebook's front cover, shown closed on a first visit to "/". The open button is a layer over the
// whole cover (the art above it lets clicks through), so the Resume link is not nested inside a button.
export const mainCover = ({ open } = {}) => (
  <>
    {open && <button type="button" className="cover-open" aria-label="Open the notebook" onClick={open} />}
    <div className="cover-art">
      <span className="lbl">Lab notebook</span>
      <span className="cover-title">Ansh Kumar Singh</span>
      <span className="cover-sub">AI Engineer · Pune, India</span>
      <p className="cover-line">LLM systems, each with its numbers and the failures behind them.</p>
      <Ext href={LINKS.resume} className="cover-resume">Resume</Ext>
      <span className="cover-foot cover-prompt" aria-hidden="true">
        <span className="by-touch">Swipe to open</span>
        <span className="by-mouse">Click to open</span>
        <span className="cover-arrow">→</span>
      </span>
    </div>
  </>
);

// The outside of the back cover. toStart is passed only where it can be used, so the address's id exists once.
export const mainBackCover = ({ toStart } = {}) => (
  <div className="cover-art back-art">
    <span className="lbl">Lab notebook · end</span>
    <span className="cover-title">Thanks for reading</span>
    <p className="cover-line">If any of this is useful to your team, I’d like to hear from you.</p>
    <span className="cover-email" id={toStart ? 'email-text-end' : undefined}>{EMAIL.split('@')[0]}<wbr />@{EMAIL.split('@')[1]}</span>
    <div className="cover-actions">
      <CopyEmail className="cover-btn" target="email-text-end" />
      <Ext href={LINKS.linkedin} className="cover-btn">LinkedIn</Ext>
      <Ext href={LINKS.github} className="cover-btn">GitHub</Ext>
      <a className="cover-btn" href={LINKS.resume} target="_blank" rel="noopener">Resume</a>
    </div>
    <button type="button" className="cover-restart" onClick={toStart}>Back to the first page</button>
  </div>
);

export const mainPages = [
  // ---- Intro ----
  {
    head: 'Lab notebook · Ansh Kumar Singh',
    render: () => (
      <div className="intro-page">
        <div className="intro">
          <span className="eyebrow">AI Engineer · Pune, India · open to relocation and remote</span>
          <h1 id="page-title">Ansh Kumar Singh</h1>
          <p className="lede">
            I build LLM systems (agents, RAG, graph retrieval) and test them on labelled question sets, so every result comes with a{' '}
            <Mark kind="under">number</Mark> and the failures behind it.
          </p>
          <div className="actions">
            <CopyEmail className="btn solid" />
            <Ext href={LINKS.linkedin} className="btn">LinkedIn</Ext>
            <Ext href={LINKS.github} className="btn">GitHub</Ext>
            <a className="btn" href={LINKS.resume} target="_blank" rel="noopener">Resume</a>
          </div>
        </div>
        {/* At the foot of the first page, like the key in a notebook; the version for the reader's device shows. */}
        <div className="howto">
          <span className="lbl">How to read this notebook</span>
          <ul className="by-mouse">
            <li><b>Turn a page:</b> scroll, swipe with two fingers, press ← →, or click a folded corner.</li>
            <li><b>Jump to a chapter:</b> pick it from Contents.</li>
            <li><b>Read a project in full:</b> “Run the full entry” opens its case study; × or Esc brings you back to the same page.</li>
          </ul>
          <ul className="by-touch">
            <li><b>Turn a page:</b> swipe sideways or tap a folded corner.</li>
            <li><b>Jump to a chapter:</b> open Contents.</li>
            <li><b>Read a project in full:</b> “Run the full entry”; tap × to come back.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    head: 'A live run',
    render: () => (
      <div className="stack">
        <Pen arrow="↓">This is a real agent loop I built. Pick a request and watch the tools fire.</Pen>
        <TraceReplay />
        <Pen className="right">Turn the page for how I measured it →</Pen>
      </div>
    ),
  },

  // ---- Experience ----
  {
    head: 'Experience',
    render: () => (
      <div>
        <span className="lbl">Experience</span>
        <h2>AI Engineer, Tata Consultancy Services</h2>
        <p className="muted small">
          AI &amp; Service Transformations · Rapid Build Team · Pune · <span className="num">Jan 2025 – present</span>
          <br />
          Designation: Assistant Systems Engineer
        </p>
        <ul>
          <li>On the Rapid Build Team, taking enterprise use cases from proof of concept to delivery on short timelines.</li>
          <li>
            Built three document-AI proofs of concept end to end as the sole engineer (Python, FastAPI, LangChain, Gemini, React):
            <ul className="sub">
              <li>
                <b>Loan and policy onboarding:</b> Gemini extraction into Pydantic schemas and rule validation, a junior → senior approval flow, decisions
                emailed through the Gmail API.
              </li>
              <li>
                <b>Licence application validator:</b> cross-checks a licence, passport and address proof against rule sets in a background job, producing a
                pass/fail decision and report.
              </li>
              <li>
                <b>Conversational intake agent:</b> a guided question flow that generates a bill of materials and a session summary PDF, with prompt-level
                guardrails; replaced manual request sheets.
              </li>
            </ul>
          </li>
          <li>Ran 4 AI enablement sessions for 35–40 board members and senior executives at two enterprise clients, including a live multi-agent demo I built.</li>
        </ul>
        <Pen>Client work stays private. Described here by what it does.</Pen>
      </div>
    ),
  },
  {
    head: 'Skills',
    render: () => (
      <div>
        <span className="lbl">Skills</span>
        <dl className="skillgrid">
          <dt>Languages</dt>
          <dd>Python, JavaScript, SQL, HTML, CSS</dd>
          <dt>AI / ML</dt>
          <dd>RAG and Graph RAG, LLM evaluation, MCP, tool calling, agentic workflows, prompt engineering; Gemini, OpenAI, Groq and Sarvam APIs</dd>
          <dt>Frameworks</dt>
          <dd>FastAPI, SQLAlchemy, LangChain, Pydantic, NumPy, sentence-transformers, React</dd>
          <dt>Tools</dt>
          <dd>Git, SQLite, Ollama</dd>
        </dl>
      </div>
    ),
  },

  // ---- Entry 1 ----
  {
    head: 'Restaurant Reservation Agent',
    render: () => (
      <div>
        <EntryMeta no="Entry 1" when="Oct 2026 · Agent" />
        <h2>Restaurant Reservation Agent</h2>
        <Chips items={['Python', 'MCP', 'Groq', 'Sarvam']} />
        <QSR
          q="A 75-outlet chain loses bookings when one outlet is full, even though a sister outlet nearby has space. Can an agent save them?"
          s="A booking agent with no agent framework: its own tool loop, 8 MCP tools, voice in 11 languages. Full outlets reroute to another time or a nearby outlet."
          r="13/16 scripted guest journeys pass, checked on tool choice, arguments and final state."
        />
        <span className="lbl">Flow</span>
        <Flow steps={['Guest', 'Agent loop', 'Gate', 'MCP server · 8 tools', 'SQLite']} keyStep={2} />
        <span className="lbl">Still fails</span>
        <Pen>Drops the area from “Green Bowl in Koramangala” and asks “which one?” instead of saying it’s full. And the prompt and the gate both ask for confirmation.</Pen>
      </div>
    ),
  },
  {
    head: 'Restaurant Reservation Agent · result',
    render: () => (
      <div className="statpage">
        <div className="stat">
          <span className="big num">13/16</span>
          <span className="what">guest journeys pass</span>
        </div>
        <Pen>+2 over the first run; only <Mark kind="ring">two</Mark> are agent fixes.</Pen>
        <Fig n={1} caption="The six journeys that changed between the first and final run, by cause.">
          <GainMini />
        </Fig>
        <span className="lbl">Decisions</span>
        <ul className="decisions">
          <li><b>Confirmation gate in code.</b> Every write is held; the server dry-runs it, and it only goes through when the model repeats the call after the guest says yes.</li>
          <li><b>Overflow routing in code.</b> A full outlet returns up to 3 other times within 2 hours and up to 3 outlets within 6 km.</li>
          <li><b>Errors come back as results,</b> so the model can correct itself, with a cap of 6 model calls per turn.</li>
          <li><b>Dates resolved in code</b> against a 14-day calendar, not by the model.</li>
        </ul>
        <div className="runrow">
          <RunEntry to="/work/reservation-agent/" />
          <Ext href={LINKS.demo}>Demo video</Ext>
        </div>
      </div>
    ),
  },

  // ---- Entry 2 ----
  {
    head: 'Graph RAG',
    render: () => (
      <div>
        <EntryMeta no="Entry 2" when="Oct 2026 · Retrieval" />
        <h2>Graph RAG for Multi-Hop Questions</h2>
        <Chips items={['Python', 'Pydantic', 'Groq', 'NumPy']} />
        <QSR
          q="When the facts for an answer sit in different news articles, does walking a knowledge graph find it where similarity search does not?"
          s="Relation extraction over 110 Indian insurance articles, with deal status and ownership periods; 222 names merged into 136 companies and people; cited answers."
          r="Graph RAG 10/11, vector RAG 9/11, the model alone 3/11."
        />
        <span className="lbl">Flow</span>
        <Flow steps={['115 articles', 'Extract', 'Resolve · 222 → 136', 'Graph · 166 edges', '2-hop walk', 'Cited answer']} keyStep={4} />
        <span className="lbl">Still fails</span>
        <Pen>Facts from the 5 articles that failed extraction are missing from the graph. And 11 questions, one run each, is a direction, not a proof.</Pen>
      </div>
    ),
  },
  {
    head: 'Graph RAG · result',
    render: () => (
      <div className="statpage">
        <div className="stat">
          <span className="big num">4/4 vs 3/4</span>
          <span className="what">cross-article questions · graph vs vector</span>
        </div>
        <Pen>One question apart. Read it as a direction, not a proof.</Pen>
        <Fig n={2} caption="Correct answers by method. Every citation was checked against its source.">
          <ArmBars />
        </Fig>
        <span className="lbl">Decisions</span>
        <ul className="decisions">
          <li><b>Every relation has a status</b> (asserted, prospective, denied), so a pending deal is never reported as done.</li>
          <li><b>No fuzzy entity matching.</b> Every alias was checked by reading the source articles.</li>
          <li><b>Round-robin evidence,</b> after one deal filled 14 of 30 context slots.</li>
          <li><b>A fair baseline:</b> vector RAG gets the same prompt, model and citation format; only retrieval differs.</li>
        </ul>
        <div className="runrow">
          <RunEntry to="/work/graph-rag/" />
          <Ext href={LINKS.graphRepo}>GitHub</Ext>
        </div>
      </div>
    ),
  },

  // ---- Entry 3 ----
  {
    head: 'RAG from Scratch',
    render: () => (
      <div>
        <EntryMeta no="Entry 3" when="Sep 2026 · Retrieval" />
        <h2>RAG from Scratch</h2>
        <Chips items={['Python', 'NumPy', 'Gemini']} />
        <QSR
          q="Can I build every stage of a RAG pipeline by hand, and measure it?"
          s="Chunking, embeddings, cosine retrieval, LLM reranking and a hit@k harness, all written by hand."
          r={
            <>
              The reranker was <Mark kind="under">silently doing nothing</Mark>. Fixing its prompt contract raised hit@1 from 13/17 to 17/17.
            </>
          }
        />
        <span className="lbl">Flow</span>
        <Flow steps={['Chunk', 'Embed', 'Cosine top 5', 'LLM rerank', 'hit@k']} keyStep={3} />
        <span className="lbl">Still fails</span>
        <Pen>17 questions over 6 chunks is a method check, not a benchmark, and paraphrased evidence counts as a miss.</Pen>
      </div>
    ),
  },
  {
    head: 'RAG from Scratch · result',
    render: () => (
      <div className="statpage">
        <div className="stat">
          <span className="big num">13 → 17/17</span>
          <span className="what">hit@1 after finding a silent reranker bug</span>
        </div>
        <Pen>A small set: 17 questions over 6 chunks.</Pen>
        <Fig n={3} caption="hit@1 before and after the fix. Red dots are the four the fix recovered.">
          <HitDots />
        </Fig>
        <span className="lbl">Decisions</span>
        <ul className="decisions">
          <li><b>No framework.</b> Lists, dicts and NumPy, so every intermediate state can be inspected.</li>
          <li><b>Embedding calls kept apart from the similarity maths,</b> so ranking is testable without the API.</li>
          <li><b>The metric named honestly:</b> hit@k, not recall@k, since each question has one answer phrase.</li>
        </ul>
        <div className="runrow">
          <RunEntry to="/work/rag-from-scratch/" />
          <Ext href={LINKS.ragRepo}>GitHub</Ext>
        </div>
      </div>
    ),
  },

  // ---- Entry 4 ----
  {
    head: 'Single vs Multi-Agent',
    render: () => (
      <div>
        <EntryMeta no="Entry 4" when="In progress · Oct 2026 · Agents" />
        <h2>Single vs Multi-Agent</h2>
        <Chips items={['Python', 'Groq', 'tool calling']} />
        <span className="lbl">Question</span>
        <p>When does a team of agents beat one agent with the same tools, and what does it cost?</p>
        <p>
          Splitting work across several agents is a popular default, but every extra agent adds model calls, tokens and new ways to fail. This measures
          whether the split earns its cost, on the same insurance knowledge graph as Entry 2.
        </p>
        <span className="lbl">Three arms</span>
        <ul>
          <li><b>A. Single agent:</b> one tool-calling loop.</li>
          <li><b>B. Orchestrator + workers:</b> a planner splits the question, workers research each part, the planner merges the findings.</li>
          <li><b>C. B + verifier:</b> checks every claim against the passage it cites; unsupported claims are revised once, then dropped.</li>
        </ul>
        <p className="muted small">
          Measured per question: correct, grounded, tokens, model and tool calls, time, and the type of every failure. Questions and gold answers are
          written before arms B and C exist.
        </p>
        <Pen>If one agent turns out good enough, that's a result, not a failure.</Pen>
        <Ext href={LINKS.agentsRepo}>GitHub</Ext>
      </div>
    ),
  },
  {
    head: 'Single vs Multi-Agent · predictions',
    render: () => (
      <div>
        <span className="lbl">Predictions · written 25 Oct 2026, before the first run</span>
        <ul className="preds">
          {PREDICTIONS.map(([type, text]) => (
            <li key={type}>
              <span className="lbl">{type}</span>
              <span className="pred">{text}</span>
            </li>
          ))}
        </ul>
        <span className="lbl">Progress</span>
        <ul className="progress">
          {PROGRESS.map(([state, text]) => (
            <li key={text} className={state}>
              <span className="st" role="img" aria-label={STATE_LABEL[state]}>{STATE_MARK[state]}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <Pen>Results go on this page, next to the predictions.</Pen>
      </div>
    ),
  },

  // ---- Contact ----
  {
    head: 'Certifications · education',
    render: () => (
      <div className="stack">
        <div>
          <span className="lbl">Certifications · Sep 2026</span>
          <ul className="certs">
            <li><span>Generative AI Engineer Associate</span><span className="muted">Databricks</span></li>
            <li><span>Machine Learning Associate</span><span className="muted">Databricks</span></li>
            <li><span>Claude Certified Developer – Foundations</span><span className="muted">Anthropic</span></li>
          </ul>
        </div>
        <div>
          <span className="lbl">Education</span>
          <p>B.E. Electronics &amp; Communication<br />The National Institute of Engineering, Mysore · <span className="num">2020–2024</span></p>
        </div>
        <Pen>All three certifications in one month, alongside the day job.</Pen>
      </div>
    ),
  },
  {
    head: 'Contact',
    render: () => (
      <div className="contact">
        <span className="lbl">Contact</span>
        <h2>Let’s talk</h2>
        {/* If the address must wrap, it wraps only at the @. */}
        <a className="big-mail" id="email-text" href={`mailto:${EMAIL}`}>{EMAIL.split('@')[0]}<wbr />@{EMAIL.split('@')[1]}</a>
        <div className="actions">
          <CopyEmail className="btn solid" />
          <Ext href={LINKS.linkedin} className="btn">LinkedIn</Ext>
          <Ext href={LINKS.github} className="btn">GitHub</Ext>
          <a className="btn" href={LINKS.resume} target="_blank" rel="noopener">Resume (PDF)</a>
        </div>
        <p className="muted small">Pune, India · open to relocation and remote</p>
        {/* <p className="colophon">Site built with Claude · content and results are mine</p> */}
      </div>
    ),
  },
];
