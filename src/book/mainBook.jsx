import { Link } from 'react-router';
import TraceReplay from '../components/TraceReplay.jsx';
import { ArmBars, GainMini, HitDots } from '../components/figures.jsx';
import { CopyEmail, EMAIL, Ext, Fig, LINKS, Mark, Pen } from '../components/ui.jsx';
import { useBook } from './Book.jsx';

export const mainChapters = [
  { id: 'intro', label: 'Intro' },
  { id: 'reservation-agent', label: 'Entry 3' },
  { id: 'graph-rag', label: 'Entry 2' },
  { id: 'rag-from-scratch', label: 'Entry 1' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

function GoTo({ id, children }) {
  const { go } = useBook();
  return (
    <a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault();
        go(id);
      }}
    >
      {children}
    </a>
  );
}

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

export const mainPages = [
  // ---- Intro ----
  {
    head: 'Lab notebook · Ansh Kumar Singh',
    render: () => (
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
        <div className="contents">
          <span className="lbl">In this notebook</span>
          <ol>
            <li><GoTo id="reservation-agent">Restaurant Reservation Agent</GoTo><span className="dots" /><span className="num">Entry 3</span></li>
            <li><GoTo id="graph-rag">Graph RAG for Multi-Hop Questions</GoTo><span className="dots" /><span className="num">Entry 2</span></li>
            <li><GoTo id="rag-from-scratch">RAG from Scratch</GoTo><span className="dots" /><span className="num">Entry 1</span></li>
            <li><GoTo id="experience">Experience and skills</GoTo><span className="dots" /><span className="num">p. 9</span></li>
            <li><GoTo id="contact">Contact</GoTo><span className="dots" /><span className="num">p. 11</span></li>
          </ol>
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

  // ---- Entry 3 ----
  {
    head: 'Restaurant Reservation Agent',
    render: () => (
      <div>
        <EntryMeta no="Entry 3" when="Oct 2026 · Agent" />
        <h2>Restaurant Reservation Agent</h2>
        <Chips items={['Python', 'MCP', 'Groq', 'Sarvam']} />
        <QSR
          q="A 75-outlet chain loses bookings when one outlet is full, even though a sister outlet nearby has space. Can an agent save them?"
          s="A booking agent with no agent framework: its own tool loop, 8 MCP tools, voice in 11 languages. Full outlets reroute to another time or a nearby outlet."
          r="13/16 scripted guest journeys pass, checked on tool choice, arguments and final state."
        />
        <Pen>The rule that nothing is written without a yes lives in code. The model can’t talk past it.</Pen>
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
        <Pen>+2 over the first run, and only <Mark kind="ring">one</Mark> of those is real.</Pen>
        <Fig n={1} caption="The four journeys that changed between the first and final run.">
          <GainMini />
        </Fig>
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
          s="Relation extraction over 110 Indian insurance articles, with deal status and ownership periods; 222 names merged into 136 companies; cited answers."
          r="Graph RAG 10/11, vector RAG 9/11, the model alone 3/11."
        />
        <Pen>Without retrieval the model invented an acquisition that never happened.</Pen>
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
        <div className="runrow">
          <RunEntry to="/work/graph-rag/" />
          <Ext href={LINKS.graphRepo}>GitHub</Ext>
        </div>
      </div>
    ),
  },

  // ---- Entry 1 ----
  {
    head: 'RAG from Scratch',
    render: () => (
      <div>
        <EntryMeta no="Entry 1" when="Sep 2026 · Retrieval" />
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
        <Pen>“Identical to the baseline” was the clue, not the verdict.</Pen>
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
        <div className="runrow">
          <RunEntry to="/work/rag-from-scratch/" />
          <Ext href={LINKS.ragRepo}>GitHub</Ext>
        </div>
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
        <p className="muted small">AI &amp; Service Transformations · Rapid Build Team · Pune · <span className="num">Jan 2025 – present</span></p>
        <ul>
          <li>Taking enterprise use cases from proof of concept to delivery on short timelines.</li>
          <li>
            Built three document-AI proofs of concept end to end: onboarding with LLM extraction and rule validation, a multi-document application
            validator, and a conversational intake agent that produces a bill of materials.
          </li>
          <li>Ran 4 AI enablement sessions for 35–40 board members and senior executives at two enterprise clients, including a live multi-agent demo I built.</li>
        </ul>
        <Pen>Client work stays private. Described here by what it does.</Pen>
      </div>
    ),
  },
  {
    head: 'Skills · next entry',
    render: () => (
      <div className="stack">
        <div className="next-entry">
          <EntryMeta no="Entry 4" when="In progress" />
          <h3>Single vs Multi-Agent</h3>
          <p>A from-scratch agent loop over an insurance knowledge base, measuring whether splitting the work across several agents beats one agent. Results to come.</p>
          <Ext href={LINKS.agentsRepo}>GitHub</Ext>
        </div>
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
        <a className="big-mail" id="email-text" href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <div className="actions">
          <CopyEmail className="btn solid" />
          <Ext href={LINKS.linkedin} className="btn">LinkedIn</Ext>
          <Ext href={LINKS.github} className="btn">GitHub</Ext>
          <a className="btn" href={LINKS.resume} target="_blank" rel="noopener">Resume (PDF)</a>
        </div>
        <p className="muted small">Pune, India · open to relocation and remote</p>
        <p className="colophon">Site built with Claude · content and results are mine</p>
      </div>
    ),
  },
];
