import { Link } from 'react-router-dom';
import TraceReplay from '../components/TraceReplay.jsx';
import { ArmBars, GainTable, HitDots } from '../components/figures.jsx';
import { CopyEmail, CornerIcon, Ext, Fig, Footer, LINKS, Mark, Pen, Row, TopBar } from '../components/ui.jsx';

export default function Home() {
  return (
    <div className="view" id="top">
      <TopBar home />

      <main id="main">
        <section className="frame hero" aria-labelledby="page-title">
          <div>
            <span className="eyebrow">AI Engineer · Pune, India</span>
            <h1 id="page-title" tabIndex={-1}>Ansh Kumar Singh</h1>
            <p className="lede">
              I build LLM systems (agents, RAG, graph retrieval) and test them on labelled question sets, so every result comes
              with a <Mark kind="under">number</Mark> and the failures behind it.
            </p>
            <div className="actions">
              <a className="btn solid" href="#work">Read the notebook</a>
              <CopyEmail />
              <Ext href={LINKS.linkedin} className="btn">LinkedIn</Ext>
              <Ext href={LINKS.github} className="btn">GitHub</Ext>
            </div>
            <div className="hero-note">
              <Pen arrow="→">That console is a real agent loop I built. Pick a request and watch the tools fire.</Pen>
            </div>
          </div>
          <TraceReplay />
        </section>

        <div className="frame">
          <article className="sheet" id="work" aria-labelledby="notebook-title">
            <div className="sheet-head">
              <span id="notebook-title">Lab notebook · Ansh Kumar Singh</span>
              <span>Entries, newest first · open to relocation and remote</span>
            </div>

            <Row note={<Pen>Every number here traces back to an eval file in the repo.</Pen>} wide>
              <span className="lbl">Summary of findings</span>
              <div className="findings" style={{ marginTop: 14 }}>
                <div className="finding">
                  <span className="big">13/16</span>
                  <span className="what">guest journeys pass · reservation agent</span>
                  <Pen>+2 over run 1, and only one of those is real</Pen>
                </div>
                <div className="finding">
                  <span className="big">4/4 vs 3/4</span>
                  <span className="what">cross-article questions · graph vs vector</span>
                  <Pen>the one vector missed never reached it</Pen>
                </div>
                <div className="finding">
                  <span className="big">13 → 17/17</span>
                  <span className="what">hit@1 after finding a silent reranker bug</span>
                  <Pen>small set: 17 questions, 6 chunks</Pen>
                </div>
              </div>
            </Row>

            {/* Entry 3 */}
            <section className="entry" aria-labelledby="e3">
              <Row note={<Pen arrow="↓">The rule that nothing is written without a yes lives in code. The model can’t talk past it.</Pen>}>
                <div className="entry-meta">
                  <span className="no">Entry 3</span>
                  <span className="lbl">Oct 2026 · Agent</span>
                </div>
                <h2 id="e3"><Link to="/work/reservation-agent/">Restaurant Reservation Agent</Link></h2>
                <ul className="chips" aria-label="Stack"><li>Python</li><li>MCP</li><li>Groq</li><li>Sarvam</li></ul>
                <dl className="qsr">
                  <dt>Question</dt>
                  <dd>A 75-outlet chain loses bookings when one outlet is full, even though a sister outlet nearby has space. Can an agent save them?</dd>
                  <dt>Setup</dt>
                  <dd>A booking agent with no agent framework: its own tool loop, 8 MCP tools, voice in 11 languages. Full outlets reroute to another time or a nearby outlet.</dd>
                  <dt>Result</dt>
                  <dd><span className="num">13/16</span> scripted guest journeys pass, checked on tool choice, arguments and final state.</dd>
                </dl>
              </Row>
              <Row note={<Pen>Two of the three “wins” were bugs in my own test.</Pen>}>
                <Fig n={1} caption="Where the +2 between the first and final eval run came from. Filter by cause.">
                  <GainTable />
                </Fig>
                <Link className="turnlink" to="/work/reservation-agent/">Turn to the full entry <CornerIcon /></Link>
                <span className="extlinks"><Ext href={LINKS.demo}>Demo video</Ext></span>
              </Row>
            </section>

            {/* Entry 2 */}
            <section className="entry" aria-labelledby="e2">
              <Row note={<Pen>Without retrieval the model invented an acquisition that never happened.</Pen>}>
                <div className="entry-meta">
                  <span className="no">Entry 2</span>
                  <span className="lbl">Oct 2026 · Retrieval</span>
                </div>
                <h2 id="e2"><Link to="/work/graph-rag/">Graph RAG for Multi-Hop Questions</Link></h2>
                <ul className="chips" aria-label="Stack"><li>Python</li><li>Pydantic</li><li>Groq</li><li>NumPy</li></ul>
                <dl className="qsr">
                  <dt>Question</dt>
                  <dd>When the facts for an answer sit in different news articles, does walking a knowledge graph find it where similarity search does not?</dd>
                  <dt>Setup</dt>
                  <dd>Relation extraction over 110 Indian insurance articles, with deal status and ownership periods; 222 names merged into 136 companies; cited answers.</dd>
                  <dt>Result</dt>
                  <dd>On questions whose answer spans several articles, graph RAG got <Mark>4/4</Mark> and vector RAG 3/4.</dd>
                </dl>
              </Row>
              <Row note={<Pen>One question apart overall. Read it as a direction, not a proof.</Pen>}>
                <Fig n={2} caption="Correct answers by method. Every citation was checked against its source.">
                  <ArmBars />
                </Fig>
                <Link className="turnlink" to="/work/graph-rag/">Turn to the full entry <CornerIcon /></Link>
                <span className="extlinks"><Ext href={LINKS.graphRepo}>GitHub</Ext></span>
              </Row>
            </section>

            {/* Entry 1 */}
            <section className="entry" aria-labelledby="e1">
              <Row note={<Pen>“Identical to the baseline” was the clue, not the verdict.</Pen>}>
                <div className="entry-meta">
                  <span className="no">Entry 1</span>
                  <span className="lbl">Sep 2026 · Retrieval</span>
                </div>
                <h2 id="e1"><Link to="/work/rag-from-scratch/">RAG from Scratch</Link></h2>
                <ul className="chips" aria-label="Stack"><li>Python</li><li>NumPy</li><li>Gemini</li></ul>
                <dl className="qsr">
                  <dt>Question</dt>
                  <dd>Can I build every stage of a RAG pipeline by hand and measure it?</dd>
                  <dt>Setup</dt>
                  <dd>Chunking, embeddings, cosine retrieval, LLM reranking and a hit@k harness, all written by hand.</dd>
                  <dt>Result</dt>
                  <dd>The reranker was <Mark kind="under">silently doing nothing</Mark>. Fixing its prompt contract raised hit@1 from 13/17 to 17/17.</dd>
                </dl>
              </Row>
              <Row>
                <Fig n={3} caption="hit@1 on 17 labelled questions over 6 chunks. Red dots are the four the fix recovered.">
                  <HitDots />
                </Fig>
                <Link className="turnlink" to="/work/rag-from-scratch/">Turn to the full entry <CornerIcon /></Link>
                <span className="extlinks"><Ext href={LINKS.ragRepo}>GitHub</Ext></span>
              </Row>
            </section>

            <section className="entry" aria-labelledby="e4">
              <Row note={<Pen>Next page, still being written.</Pen>}>
                <div className="next-entry">
                  <div className="entry-meta">
                    <span className="no">Entry 4</span>
                    <span className="lbl">In progress</span>
                  </div>
                  <h3 id="e4">Single vs Multi-Agent</h3>
                  <p style={{ marginBottom: 6 }}>
                    A from-scratch agent loop over an insurance knowledge base, measuring whether splitting the work across several agents
                    beats a single agent. Results to come.
                  </p>
                  <Ext href={LINKS.agentsRepo}>GitHub</Ext>
                </div>
              </Row>
            </section>
          </article>

          <article className="sheet" id="experience" aria-labelledby="exp-title">
            <Row note={<Pen>Client work stays private. Described here by what it does.</Pen>}>
              <span className="lbl" id="exp-title">Experience</span>
              <div className="job" style={{ marginTop: 14 }}>
                <h3>AI Engineer, Tata Consultancy Services</h3>
                <div className="where">AI &amp; Service Transformations · Rapid Build Team · Pune · <span className="num">Jan 2025 – present</span></div>
                <ul>
                  <li>On the Rapid Build Team, taking enterprise use cases from proof of concept to delivery on short timelines.</li>
                  <li>
                    Built three document-AI proofs of concept end to end: an onboarding system with LLM extraction, rule validation and a
                    two-level approval flow; a validator that cross-checks multi-document applications against rule sets; and a
                    conversational intake agent that produces a bill of materials.
                  </li>
                  <li>
                    Ran 4 AI enablement sessions for 35–40 board members and senior executives at two enterprise clients, including a live
                    multi-agent demo I built.
                  </li>
                </ul>
              </div>
            </Row>

            <Row id="skills">
              <span className="lbl">Skills</span>
              <dl className="skillgrid" style={{ marginTop: 14 }}>
                <dt>Languages</dt>
                <dd>Python, JavaScript, SQL, HTML, CSS</dd>
                <dt>AI / ML</dt>
                <dd>RAG and Graph RAG, LLM evaluation, MCP, tool calling, agentic workflows, prompt engineering; LLM APIs (Gemini, OpenAI, Groq, Sarvam)</dd>
                <dt>Frameworks</dt>
                <dd>FastAPI, SQLAlchemy, LangChain, Pydantic, NumPy, sentence-transformers, React</dd>
                <dt>Tools</dt>
                <dd>Git, SQLite, Ollama</dd>
              </dl>
            </Row>

            <Row note={<Pen>All three in Sep 2026.</Pen>}>
              <span className="lbl">Certifications</span>
              <ul className="certs" style={{ marginTop: 14 }}>
                <li><span>Generative AI Engineer Associate</span><span className="muted">Databricks</span></li>
                <li><span>Machine Learning Associate</span><span className="muted">Databricks</span></li>
                <li><span>Claude Certified Developer – Foundations</span><span className="muted">Anthropic</span></li>
              </ul>
            </Row>

            <Row>
              <span className="lbl">Education</span>
              <p style={{ marginTop: 12 }}>
                B.E. Electronics &amp; Communication, The National Institute of Engineering, Mysore · <span className="num">2020–2024</span>
              </p>
            </Row>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
