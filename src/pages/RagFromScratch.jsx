import CaseLayout from '../components/CaseLayout.jsx';
import { HitDots } from '../components/figures.jsx';
import { Ext, Fig, LINKS, Mark, Pen, Row } from '../components/ui.jsx';

export default function RagFromScratch() {
  return (
    <CaseLayout
      no="Entry 1"
      meta="Sep 2026 · Retrieval"
      title="RAG from Scratch"
      lede="Every stage of a retrieval pipeline written by hand in Python and NumPy, and the reranker bug that hid behind an unchanged score."
      chips={['Python', 'NumPy', 'Gemini embeddings', 'Gemini']}
      actions={<Ext href={LINKS.ragRepo} className="btn solid">Code on GitHub</Ext>}
      prev={{ to: '/work/graph-rag/', label: 'Entry 2', title: 'Graph RAG for Multi-Hop Questions' }}
      next={{ to: '/#work', label: 'Back to the notebook', title: 'All entries' }}
    >
      <section className="section" id="question">
        <Row note={<Pen>Frameworks would have hidden exactly the bug I found.</Pen>}>
          <span className="lbl">Question</span>
          <h2>Can I build every stage of RAG by hand, and measure it?</h2>
          <p>
            Frameworks put layers between you and the intermediate state. When a component fails silently, the failure is hidden
            behind code you didn’t write and wouldn’t think to inspect. Built from lists, dicts and NumPy, every step stays visible.
          </p>
        </Row>
      </section>

      <section className="section" id="built">
        <Row>
          <span className="lbl">Setup</span>
          <h2>Five stages, plus reranking and evaluation</h2>
          <Fig n={1} caption="The pipeline. Embedding calls are kept separate from the similarity maths, so ranking can be tested locally.">
            <div className="arch">
              <div className="node"><b>chunker</b><span>overlapping character windows</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>embed</b><span>gemini-embedding-001</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>retrieve</b><span>cosine, top 5</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node hot"><b>rerank</b><span>LLM orders the 5</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>eval</b><span>hit@k on labelled questions</span></div>
            </div>
          </Fig>
          <p>
            The metric is hit@k: a question passes if its labelled answer phrase appears in any of the top k reranked chunks. Each
            question has one answer phrase, so this is a hit rate, not recall.
          </p>
        </Row>
      </section>

      <section className="section" id="story">
        <Row note={<Pen>A working reranker might help, hurt or wobble. An exact match meant it wasn’t running.</Pen>}>
          <span className="lbl">The debugging story</span>
          <h2>The reranker was <Mark kind="under">silently doing nothing</Mark></h2>
          <ol className="steps">
            <li><div><b>Added reranking.</b> An LLM step between cosine retrieval and answering, to push the right chunk to rank 1.</div></li>
            <li className="key"><div><b>hit@1 didn’t move.</b> It stayed at exactly 13/17, identical to plain cosine order.</div></li>
            <li><div><b>Read the fallback path.</b> The reranker only uses the model’s order if it gets back a complete permutation. Otherwise it quietly returns the cosine order.</div></li>
          </ol>
          <span className="lbl">The check, simplified from rerank.py</span>
          <pre className="code"><code>{`if sorted(extracted) == list(range(1, N+1)):   # complete permutation
    use the model's order
else:
    return candidates[:k]                      # silent fallback to cosine order`}</code></pre>
          <ol className="steps" start={4} style={{ counterReset: 's 3' }}>
            <li className="key"><div><b>Found the prompt flaw.</b> The prompt let the model return just the most relevant subset. A subset fails the permutation check, so the fallback fired every time.</div></li>
            <li><div><b>Fixed the prompt contract.</b></div></li>
          </ol>
          <blockquote className="quote">
            Rank all N candidates… Return every candidate number from 1 to N, each exactly once, reordered from most to least relevant.
          </blockquote>
          <ol className="steps" start={6} style={{ counterReset: 's 5' }}>
            <li><div><b>Re-measured.</b> Probing the reranker directly now returned a reordered list, and hit@1 went from 13/17 to 17/17.</div></li>
          </ol>
        </Row>
      </section>

      <section className="section" id="result">
        <Row note={<Pen>Lesson: a silent fallback makes a broken part look like one that doesn’t help.</Pen>}>
          <span className="lbl">Result</span>
          <h2>hit@1 from 13/17 to 17/17</h2>
          <Fig n={2} caption="hit@1 before and after the fix. Red dots are the four questions it recovered.">
            <HitDots />
          </Fig>
          <p className="muted">
            A small set: 17 questions over a 6-chunk corpus, at default sampling temperature. It validates the method and the
            debugging story. It is not a benchmark.
          </p>
        </Row>
      </section>

      <section className="section" id="limits">
        <Row>
          <span className="lbl">Limitations</span>
          <ul>
            <li>17 questions over 6 chunks, subject to run-to-run variation.</li>
            <li>Substring matching: paraphrased evidence counts as a miss.</li>
          </ul>
        </Row>
      </section>
    </CaseLayout>
  );
}
