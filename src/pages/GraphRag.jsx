import CaseLayout from '../components/CaseLayout.jsx';
import QuestionExplorer from '../components/QuestionExplorer.jsx';
import { ArmBars } from '../components/figures.jsx';
import { Ext, Fig, LINKS, Mark, Pen, Row } from '../components/ui.jsx';

const byType = [
  ['Cross-article multi-hop', '1/4', '3/4', '4/4', 'graph'],
  ['Same-passage multi-hop', '1/3', '2/3', '3/3', 'graph'],
  ['Single lookup', '0/2', '2/2', '2/2', ''],
  ['Extraction gap', '1/1', '1/1', '0/1', 'vector'],
  ['Unanswerable', '0/1', '1/1', '1/1', ''],
];

export default function GraphRag() {
  return (
    <CaseLayout
      no="Entry 2"
      meta="Oct 2026 · Retrieval"
      title="Graph RAG for Multi-Hop Questions"
      lede="A knowledge graph built from Indian insurance news, measured against vector RAG and the model alone on questions whose answers span several articles."
      chips={['Python', 'Pydantic', 'Groq · gpt-oss-120b', 'NumPy', 'bge-small embeddings', 'React']}
      actions={<Ext href={LINKS.graphRepo} className="btn solid">Code and data on GitHub</Ext>}
      prev={{ to: '/work/reservation-agent/', label: 'Entry 3', title: 'Restaurant Reservation Agent' }}
      next={{ to: '/work/rag-from-scratch/', label: 'Entry 1', title: 'RAG from Scratch' }}
    >
      <section className="section" id="question">
        <Row note={<Pen>Indian rules limit a promoter to one life insurer. That’s why these chains matter.</Pen>}>
          <span className="lbl">Question</span>
          <h2>When the facts sit in different articles, does a graph find what similarity search misses?</h2>
          <p>
            After India raised the foreign ownership limit for insurers to 100%, joint ventures started unwinding across the
            sector. Each news article reports one deal, and no single article states who owns what. A question like “which life
            insurer is the company buying Bharti Life also a promoter of?” needs facts from different reports.
          </p>
          <p>
            Vector search scores each passage against the question on its own. The passage holding the second hop mentions a
            company the question never names, so nothing pulls it up. A graph starts at the company the question names and walks to
            its neighbours.
          </p>
        </Row>
      </section>

      <section className="section" id="built">
        <Row note={<Pen>The model never sees a triple, only the sentence it came from.</Pen>}>
          <span className="lbl">Setup</span>
          <h2>Collect, extract, resolve, build, walk, cite</h2>
          <Fig n={1} caption="The pipeline. The vector baseline uses the same articles, prompt, model and citation format; only how the context is found differs.">
            <div className="arch">
              <div className="node"><b>Collect</b><span>115 articles from Google News RSS</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>Extract</b><span>typed relations, checked with Pydantic</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>Resolve</b><span>222 names into 136 companies</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>Build</b><span>166 edges, each with its source sentences</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node hot"><b>Walk</b><span>two hops from the named company</span></div>
            </div>
          </Fig>
          <ul>
            <li><b>Five relations</b> (owns stake in, acquired, subsidiary of, distributes for, appointed), each carrying its status: asserted, prospective or denied. An approved-but-pending deal is never reported as done.</li>
            <li><b>Ownership over time:</b> holdings are intervals, closed rather than deleted, so “who owned it before the buyout” has an answer.</li>
            <li><b>No fuzzy matching:</b> “Prudential” and “Prudential plc” are one company, but “Aviva” and “Aviva Life Insurance Company India” are a parent and the venture it owns. Every alias was confirmed by reading the source articles.</li>
            <li><b>Cited answers:</b> the model is told to cite every claim and say exactly “The sources do not say.” when they don’t, so a refusal can be counted.</li>
          </ul>
        </Row>
      </section>

      <section className="section" id="result">
        <Row note={<Pen>Read it as a direction. Eleven questions, one run each.</Pen>}>
          <span className="lbl">Result</span>
          <h2>Graph RAG 10/11, vector RAG 9/11, the model alone 3/11</h2>
          <Fig n={2} caption="Correct answers by method. Of the correct answers, 9 of graph’s and 8 of vector’s cite a passage that supports the claim.">
            <ArmBars />
          </Fig>
          <div className="tablebox" style={{ marginTop: 20 }}>
            <table className="type-table">
              <caption className="sr">Correct answers by question type</caption>
              <thead>
                <tr>
                  <th scope="col">Question type</th>
                  <th scope="col" className="n">Model alone</th>
                  <th scope="col" className="n">Vector</th>
                  <th scope="col" className="n">Graph</th>
                </tr>
              </thead>
              <tbody>
                {byType.map(([t, a, v, g, win]) => (
                  <tr key={t}>
                    <td>{t}</td>
                    <td className="n">{a}</td>
                    <td className={`n${win === 'vector' ? ' win' : ''}`}>{v}</td>
                    <td className={`n${win === 'graph' ? ' win' : ''}`}>{g}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>All</td>
                  <td className="n">3/11</td>
                  <td className="n">9/11</td>
                  <td className="n">10/11</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Row>
      </section>

      <section className="section" id="questions">
        <Row note={<Pen>Start with Q01. Vector never retrieved the Airtel Africa passage.</Pen>}>
          <span className="lbl">Every question, every answer</span>
          <h2>Where each method won and lost</h2>
          <p>
            Pick a question to see the three answers and how I scored them. The bridge company is never named in the question,
            which is what makes it multi-hop.
          </p>
          <Fig n={3} caption="All 11 evaluation questions, scored by hand. Notes are my scoring comments.">
            <QuestionExplorer />
          </Fig>
          <ul>
            <li><b>Where the graph won:</b> a cross-article question where vector search never retrieved the needed passage (Q01), and a same-passage question where vector misread who was buying whom (Q04).</li>
            <li><b>Where vector won:</b> the one article the graph lost during extraction (Q10). Vector indexed all 115 articles; the graph has the 110 that extracted cleanly.</li>
            <li><b>The clearest finding is the first column.</b> Without retrieval the model was confidently wrong: a 49% stake that was really 75%, the wrong seller, and a takeover of Star Health that <Mark kind="strike">never happened</Mark>. Both retrieval methods refused that one.</li>
          </ul>
        </Row>
      </section>

      <section className="section" id="bug">
        <Row note={<Pen>It looked like bad reasoning. It was missing evidence.</Pen>}>
          <span className="lbl">The assembly bug</span>
          <h2>One deal took 14 of the 30 context slots</h2>
          <p>
            The first version passed the model the first 30 passages, closest edges first. On a question about ICICI Bank, 14 of
            the 30 slots repeated one heavily reported deal, and the sentence stating ICICI Bank’s 50.89% stake, two hops away,
            never reached the model.
          </p>
          <p>
            Capping sources per edge wasn’t enough, because near-duplicate stakes (22%, 21.91%, “nearly 22%”) are separate
            edges. The working version is round-robin: one passage from every edge before a second from any. Once the evidence
            arrived, the same small model answered correctly.
          </p>
        </Row>
      </section>

      <section className="section" id="tests">
        <Row note={<Pen>Same input, three runs, three outputs.</Pen>}>
          <span className="lbl">Testing the extractor</span>
          <h2>11 trap articles, 9/11 exact</h2>
          <p>
            I wrote 11 short test articles that each plant a trap: a law firm named in a deal, a denial, an unnamed buyer, an
            approval that isn’t a completion, a market roundup that should yield nothing. On the final prompt the extractor got
            9/11 exact and 10/11 with the right companies and relation.
          </p>
          <p>
            The model is not deterministic at temperature 0, so the harness supports pass rates over several runs. 110 of 115
            articles extracted; the other five ran out of output budget, which lost two facts. I kept settings consistent rather
            than re-running those five differently, and measured the loss instead: it is the one question vector answered and
            graph couldn’t.
          </p>
        </Row>
      </section>

      <section className="section" id="limits">
        <Row>
          <span className="lbl">Limitations</span>
          <ul>
            <li>A small evaluation: 11 questions, one run each.</li>
            <li>One domain and 115 articles. The results say nothing about other corpora.</li>
            <li>Asset and portfolio purchases produce no edge; the schema models equity only.</li>
            <li>A prototype, not a product in use. It shows the approach works on this problem, not that users have validated it.</li>
          </ul>
        </Row>
      </section>
    </CaseLayout>
  );
}
