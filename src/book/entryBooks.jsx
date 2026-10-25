import { Link } from 'react-router';
import QuestionExplorer from '../components/QuestionExplorer.jsx';
import { ArmBars, GainTable, HitDots, RunTiles } from '../components/figures.jsx';
import { Ext, Fig, LINKS, Mark, Pen } from '../components/ui.jsx';

const Arch = ({ nodes }) => (
  <div className="arch">
    {nodes.map(([b, s, hot], i) => (
      <div key={b} className="arch-step">
        {i > 0 && <span className="arrow" aria-hidden="true">↓</span>}
        <div className={`node${hot ? ' hot' : ''}`}>
          <b>{b}</b>
          <span>{s}</span>
        </div>
      </div>
    ))}
  </div>
);

const Facts = ({ items }) => (
  <div className="facts">
    {items.map(([v, l]) => (
      <div key={l}>
        <span className="big num">{v}</span>
        <span>{l}</span>
      </div>
    ))}
  </div>
);

const End = ({ slug, next, nextTitle }) => (
  <div className="endnav">
    {next && (
      <Link className="run" to={next}>
        Next entry: {nextTitle} <span aria-hidden="true">→</span>
      </Link>
    )}
    <Link className={next ? 'ext' : 'run'} to={`/#${slug}`}>
      Close and return to the notebook
    </Link>
  </div>
);

/* ============ Entry 3 · Reservation agent ============ */
const goodfoods = {
  slug: 'reservation-agent',
  no: 'Entry 3',
  title: 'Restaurant Reservation Agent',
  tone: 'oxblood',
  chapters: [
    { id: 'question', label: 'Question · Setup' },
    { id: 'setup', label: 'Setup · Key decision' },
    { id: 'result', label: 'Result' },
    { id: 'numbers', label: 'Reading my numbers' },
    { id: 'demo', label: 'Demo' },
  ],
  pages: [
    {
      head: 'Question',
      render: () => (
        <div>
          <span className="lbl">Question</span>
          <h2 id="page-title">One outlet is full, a sister outlet is free, and the guest leaves anyway</h2>
          <p>
            GoodFoods is a restaurant chain with outlets across Bengaluru. When the outlet a guest asks for is full, the booking is lost, even when another
            outlet nearby has space. The brief was an agent that books, changes and cancels tables. My extra test: can it turn “sorry, we’re full” into a
            saved booking?
          </p>
          <Facts items={[['75', 'outlets in 24 neighbourhoods'], ['12', 'sub-brands, 40–150 seats'], ['~58K', 'seeded bookings, 14 days']]} />
          <Pen>Today these guests are simply lost.</Pen>
        </div>
      ),
    },
    {
      head: 'Setup',
      render: () => (
        <div>
          <span className="lbl">Setup</span>
          <h3>Its own tool loop, 8 MCP tools, voice in 11 languages</h3>
          <Fig n={1} caption="One guest turn. The gate sits between the loop and every write.">
            <Arch
              nodes={[
                ['Guest', 'text, or voice via Sarvam'],
                ['Agent loop', 'my code · max 6 model calls a turn'],
                ['Gate', 'holds every write until a yes', true],
                ['MCP server', '8 tools, rules checked here'],
                ['SQLite', 'outlets, seats, bookings'],
              ]}
            />
          </Fig>
          <Pen>No LangChain. MCP is a protocol, not a framework.</Pen>
        </div>
      ),
    },
    {
      head: 'Setup, continued',
      render: () => (
        <div>
          <ul className="tight">
            <li><b>The loop:</b> fetch tool schemas, call the model, run any tool calls, feed results back (errors too, so it can recover), stop at a text answer.</li>
            <li><b>Overflow routing, in code:</b> a full outlet returns up to 3 other times within 2 hours and up to 3 outlets within 6 km free at the same time.</li>
            <li><b>Rules on the server:</b> a broken rule comes back as a normal result with an error code and a sentence.</li>
            <li><b>Dates in code:</b> “tomorrow” and “next Friday” are worked out against a 14-day calendar, not by the model.</li>
            <li><b>No double booking:</b> check-and-insert happens in one transaction.</li>
          </ul>
        </div>
      ),
    },
    {
      head: 'Key decision',
      render: () => (
        <div>
          <span className="lbl">Key decision</span>
          <h3>The confirmation rule lives in code, not in the prompt</h3>
          <p>
            “Always confirm before booking” in a prompt works most of the time. Most of the time isn’t good enough for a write. So the gate holds every write
            call, the server does a dry run so the details can be read back, and the write only goes through when the model repeats the same call after the
            guest says yes.
          </p>
          <p>That rule cost me two eval cases. The model sometimes asks for confirmation in plain text first, so the gate asks a second time. Safe, but it costs the guest a turn.</p>
          <Pen>The prompt asks nicely. The code enforces it.</Pen>
        </div>
      ),
    },
    {
      head: 'Result',
      render: () => (
        <div>
          <span className="lbl">Result</span>
          <h3>16 scripted guest journeys, checked on tool, arguments and final state</h3>
          <Facts items={[['13/16', 'journeys pass'], ['20/22', 'turns pick the right tool'], ['9/12', 'calls with the right arguments']]} />
          <Pen>About one full eval run a day fits in Groq’s free tier.</Pen>
        </div>
      ),
    },
    {
      head: 'Result, by journey',
      render: () => (
        <div>
          <Fig n={2} caption="Every journey in the first full run and the final run. Four changed between them.">
            <RunTiles />
          </Fig>
          <Pen>Ten passed both times. The interesting ones are the four that moved.</Pen>
        </div>
      ),
    },
    {
      head: 'Reading my own numbers',
      render: () => (
        <div>
          <span className="lbl">Reading my own numbers</span>
          <h3>11/16 became 13/16. <Mark kind="under">Only one</Mark> of those cases is a real improvement.</h3>
          <Fig n={3} caption="Each case that changed between runs, with its cause.">
            <GainTable />
          </Fig>
        </div>
      ),
    },
    {
      head: 'Reading my own numbers',
      render: () => (
        <div>
          <p>
            +3 − 1 = +2: one genuine agent fix, two fixes to how the test measured success, and one case that got worse by chance. On 16 journeys, one or two
            cases is within noise. Argument accuracy went from 8/12 to 9/12 because outlet lookup now takes names, and the model stopped copying the example id R012.
          </p>
          <Pen>If I said “69% to 81%”, the first follow-up question would break it.</Pen>
          <span className="lbl">Still fails</span>
          <div className="fails">
            <div className="failcard"><span className="mono">full-nearby-outlet</span><p>Dropped the area from “Green Bowl in Koramangala”, hit the ambiguous-name error, asked “which one?”</p></div>
            <div className="failcard"><span className="mono">modify · ignore-the-rules</span><p>Asked for confirmation in plain text before calling the tool, so the gate asked again. Nothing written without consent.</p></div>
          </div>
        </div>
      ),
    },
    {
      head: 'Demo',
      render: () => (
        <div>
          <span className="lbl">Fix next</span>
          <p>Right now the prompt and the gate both ask for confirmation. Let the gate own it alone.</p>
          <p className="muted">I stopped fixing cases one at a time once the fixes started drifting into tuning the agent to these 16 journeys.</p>
          <span className="lbl">Model</span>
          <p className="muted">openai/gpt-oss-20b on Groq at temperature 0. The brief asked for an 8B Llama; Groq retired llama-3.1-8b-instant during the build, so I switched to its named replacement and said so.</p>
        </div>
      ),
    },
    {
      head: 'Demo',
      render: () => (
        <div>
          <span className="lbl">Demo</span>
          <h3>Watch it book, reroute and hand off</h3>
          <p>About 4 minutes, hosted on Google Drive.</p>
          <Ext href={LINKS.demo} className="btn solid">Open the demo video</Ext>
          <Pen>The voiceover is Sarvam’s text-to-speech, disclosed in the video.</Pen>
          <p className="muted small">Repo: coming soon.</p>
          <End slug="reservation-agent" next="/work/graph-rag/" nextTitle="Graph RAG" />
        </div>
      ),
    },
  ],
};

/* ============ Entry 2 · Graph RAG ============ */
const byType = [
  ['Cross-article', '1/4', '3/4', '4/4', 'graph'],
  ['Same passage', '1/3', '2/3', '3/3', 'graph'],
  ['Single lookup', '0/2', '2/2', '2/2', ''],
  ['Extraction gap', '1/1', '1/1', '0/1', 'vector'],
  ['Unanswerable', '0/1', '1/1', '1/1', ''],
];

const graph = {
  slug: 'graph-rag',
  no: 'Entry 2',
  title: 'Graph RAG for Multi-Hop Questions',
  tone: 'navy',
  chapters: [
    { id: 'question', label: 'Question · Setup' },
    { id: 'setup', label: 'Setup' },
    { id: 'result', label: 'Result' },
    { id: 'answers', label: 'Every answer' },
    { id: 'bug', label: 'Bug · Tests' },
    { id: 'limits', label: 'Limits' },
  ],
  pages: [
    {
      head: 'Question',
      render: () => (
        <div>
          <span className="lbl">Question</span>
          <h2 id="page-title">When the facts sit in different articles, does a graph find what similarity search misses?</h2>
          <p>
            After India raised the foreign ownership limit for insurers to 100%, joint ventures started unwinding across the sector. Each article reports one
            deal; no single article says who owns what. “Which life insurer is the company buying Bharti Life also a promoter of?” needs facts from different reports.
          </p>
          <Pen>Indian rules limit a promoter to one life insurer. That’s why these chains matter.</Pen>
        </div>
      ),
    },
    {
      head: 'Why vector search struggles',
      render: () => (
        <div>
          <p>
            Vector search scores each passage against the question on its own. The passage holding the second hop names a company the question never mentions,
            so nothing pulls it up. A graph starts at the company the question names and walks to its neighbours.
          </p>
          <Fig n={1} caption="The pipeline. The vector baseline uses the same articles, prompt, model and citations.">
            <Arch
              nodes={[
                ['Collect', '115 articles, Google News RSS'],
                ['Extract', 'typed relations, checked with Pydantic'],
                ['Resolve', '222 names into 136 companies'],
                ['Walk', 'two hops from the named company', true],
              ]}
            />
          </Fig>
        </div>
      ),
    },
    {
      head: 'Setup',
      render: () => (
        <div>
          <span className="lbl">Setup</span>
          <ul className="tight">
            <li><b>Five relations</b> (owns stake in, acquired, subsidiary of, distributes for, appointed), each with a status: asserted, prospective or denied. A pending deal is never reported as done.</li>
            <li><b>Ownership over time:</b> holdings are intervals, closed rather than deleted.</li>
            <li><b>No fuzzy matching:</b> “Prudential” and “Prudential plc” are one company; “Aviva” and “Aviva Life Insurance Company India” are a parent and its venture. Every alias was checked against the articles.</li>
          </ul>
        </div>
      ),
    },
    {
      head: 'Setup',
      render: () => (
        <div>
          <ul className="tight">
            <li><b>Cited answers:</b> the model cites every claim and says exactly “The sources do not say.” when they don’t, so a refusal can be counted.</li>
            <li><b>166 edges</b>, each carrying the sentences it came from. The model never sees a triple, only those sentences.</li>
          </ul>
          <Pen>Every claim in an answer can be checked against a real article.</Pen>
        </div>
      ),
    },
    {
      head: 'Result',
      render: () => (
        <div>
          <span className="lbl">Result</span>
          <h3>Graph 10/11, vector 9/11, the model alone 3/11</h3>
          <Fig n={2} caption="Correct answers by method. 9 of graph’s and 8 of vector’s correct answers cite a supporting passage.">
            <ArmBars />
          </Fig>
          <Pen>Eleven questions, one run each. A direction, not a proof.</Pen>
        </div>
      ),
    },
    {
      head: 'Result by question type',
      render: () => (
        <div>
          <div className="tablebox">
            <table className="type-table">
              <caption className="sr">Correct answers by question type</caption>
              <thead>
                <tr><th scope="col">Type</th><th scope="col" className="n">Alone</th><th scope="col" className="n">Vector</th><th scope="col" className="n">Graph</th></tr>
              </thead>
              <tbody>
                {byType.map(([t, a, v, g, w]) => (
                  <tr key={t}>
                    <td>{t}</td>
                    <td className="n">{a}</td>
                    <td className={`n${w === 'vector' ? ' win' : ''}`}>{v}</td>
                    <td className={`n${w === 'graph' ? ' win' : ''}`}>{g}</td>
                  </tr>
                ))}
                <tr className="total"><td>All</td><td className="n">3/11</td><td className="n">9/11</td><td className="n">10/11</td></tr>
              </tbody>
            </table>
          </div>
          <ul className="tight">
            <li><b>Graph won</b> a cross-article question vector never retrieved the passage for (Q01), and a same-passage one where vector misread who was buying whom (Q04).</li>
            <li><b>Vector won</b> the one article the graph lost in extraction (Q10).</li>
          </ul>
        </div>
      ),
    },
    {
      head: 'Every question, every answer',
      render: () => (
        <div>
          <span className="lbl">Every question, every answer</span>
          <h3>Pick a question to see all three answers and how I scored them</h3>
          <p>The bridge company is never named in the question. That is what makes it multi-hop.</p>
          <Pen>Start with Q01. Vector never retrieved the Airtel Africa passage.</Pen>
          <p>
            Without retrieval the model was confidently wrong: a 49% stake that was really 75%, the wrong seller, and a takeover of Star Health that{' '}
            <Mark kind="strike">never happened</Mark>. Both retrieval methods refused that one.
          </p>
        </div>
      ),
    },
    {
      head: 'Every question, every answer',
      render: () => (
        <div>
          <Fig n={3} caption="All 11 questions, scored by hand.">
            <QuestionExplorer />
          </Fig>
        </div>
      ),
    },
    {
      head: 'The assembly bug',
      render: () => (
        <div>
          <span className="lbl">The assembly bug</span>
          <h3>One deal took 14 of the 30 context slots</h3>
          <p>
            The first version passed the model the first 30 passages, closest first. On a question about ICICI Bank, 14 slots repeated one heavily reported deal,
            and the sentence stating ICICI Bank’s 50.89% stake never reached the model.
          </p>
          <p>The fix is round-robin: one passage from every edge before a second from any. Once the evidence arrived, the same small model answered correctly.</p>
          <Pen>It looked like bad reasoning. It was missing evidence.</Pen>
        </div>
      ),
    },
    {
      head: 'Testing the extractor',
      render: () => (
        <div>
          <span className="lbl">Testing the extractor</span>
          <h3>11 trap articles, 9/11 exact</h3>
          <p>Each test article plants a trap: a law firm named in a deal, a denial, an unnamed buyer, an approval that isn’t a completion, a roundup that should yield nothing. 10/11 got the right companies and relation.</p>
          <p>The model isn’t deterministic at temperature 0, so the harness supports pass rates over several runs. 110 of 115 articles extracted; I kept settings consistent and measured the two lost facts instead.</p>
          <Pen>Same input, three runs, three outputs.</Pen>
        </div>
      ),
    },
    {
      head: 'Limits',
      render: () => (
        <div>
          <span className="lbl">Limitations</span>
          <ul className="tight">
            <li>A small evaluation: 11 questions, one run each.</li>
            <li>One domain and 115 articles.</li>
            <li>Asset and portfolio purchases produce no edge; the schema models equity only.</li>
            <li>A prototype, not a product in use.</li>
          </ul>
          <Ext href={LINKS.graphRepo} className="btn solid">Code and data on GitHub</Ext>
        </div>
      ),
    },
    {
      head: 'End of entry',
      render: () => (
        <div>
          <Pen>The clearest finding is the first column: without retrieval, a small model is confidently wrong.</Pen>
          <End slug="graph-rag" next="/work/rag-from-scratch/" nextTitle="RAG from Scratch" />
        </div>
      ),
    },
  ],
};

/* ============ Entry 1 · RAG from scratch ============ */
const rag = {
  slug: 'rag-from-scratch',
  no: 'Entry 1',
  title: 'RAG from Scratch',
  tone: 'green',
  chapters: [
    { id: 'question', label: 'Question · Setup' },
    { id: 'story', label: 'The debugging story' },
    { id: 'result', label: 'Result' },
  ],
  pages: [
    {
      head: 'Question',
      render: () => (
        <div>
          <span className="lbl">Question</span>
          <h2 id="page-title">Can I build every stage of RAG by hand, and measure it?</h2>
          <p>
            Frameworks put layers between you and the intermediate state. When a component fails silently, the failure hides behind code you didn’t write and
            wouldn’t think to inspect. Built from lists, dicts and NumPy, every step stays visible.
          </p>
          <Pen>A framework would have hidden exactly the bug I found.</Pen>
        </div>
      ),
    },
    {
      head: 'Setup',
      render: () => (
        <div>
          <span className="lbl">Setup</span>
          <Fig n={1} caption="Embedding calls are kept apart from the similarity maths, so ranking can be tested locally.">
            <Arch
              nodes={[
                ['chunker', 'overlapping character windows'],
                ['embed', 'gemini-embedding-001'],
                ['retrieve', 'cosine, top 5'],
                ['rerank', 'an LLM orders the 5', true],
                ['eval', 'hit@k on labelled questions'],
              ]}
            />
          </Fig>
          <p className="small">hit@k: a question passes if its answer phrase appears in any of the top k chunks. One phrase per question, so it’s a hit rate, not recall.</p>
        </div>
      ),
    },
    {
      head: 'The debugging story',
      render: () => (
        <div>
          <span className="lbl">The debugging story</span>
          <h3>The reranker was <Mark kind="under">silently doing nothing</Mark></h3>
          <ol className="steps">
            <li><div><b>Added reranking</b> between cosine retrieval and answering, to push the right chunk to rank 1.</div></li>
            <li className="key"><div><b>hit@1 didn’t move.</b> Exactly 13/17, identical to plain cosine order.</div></li>
            <li><div><b>Read the fallback path.</b> The model’s order is only used if it’s a complete permutation; otherwise cosine order comes back quietly.</div></li>
          </ol>
          <span className="lbl">The check, simplified from rerank.py</span>
          <pre className="code"><code>{`if sorted(extracted) == list(range(1, N+1)):
    use the model's order
else:
    return candidates[:k]   # silent fallback`}</code></pre>
        </div>
      ),
    },
    {
      head: 'The debugging story',
      render: () => (
        <div>
          <ol className="steps" start={4} style={{ counterReset: 's 3' }}>
            <li className="key"><div><b>Found the prompt flaw.</b> The prompt let the model return just the most relevant subset. A subset fails the check, so the fallback fired every time.</div></li>
            <li><div><b>Fixed the prompt contract.</b></div></li>
          </ol>
          <blockquote className="quote">Rank all N candidates… Return every candidate number from 1 to N, each exactly once, reordered from most to least relevant.</blockquote>
          <ol className="steps" start={6} style={{ counterReset: 's 5' }}>
            <li><div><b>Re-measured.</b> The reranker now returned a reordered list, and hit@1 went from 13/17 to 17/17.</div></li>
          </ol>
          <Pen>A working reranker might help, hurt or wobble. An exact match meant it wasn’t running.</Pen>
        </div>
      ),
    },
    {
      head: 'Result',
      render: () => (
        <div>
          <span className="lbl">Result</span>
          <h3>hit@1 from 13/17 to 17/17</h3>
          <Fig n={2} caption="Red dots are the four questions the fix recovered.">
            <HitDots />
          </Fig>
          <p className="muted small">17 questions over a 6-chunk corpus, at default temperature. It validates the method and the debugging story; it isn’t a benchmark. Paraphrased evidence counts as a miss.</p>
        </div>
      ),
    },
    {
      head: 'End of entry',
      render: () => (
        <div>
          <Pen>Lesson: a silent fallback makes a broken part look like one that simply doesn’t help.</Pen>
          <Ext href={LINKS.ragRepo} className="btn solid">Code on GitHub</Ext>
          <End slug="rag-from-scratch" />
        </div>
      ),
    },
  ],
};

export const entryBooks = { 'reservation-agent': goodfoods, 'graph-rag': graph, 'rag-from-scratch': rag };
