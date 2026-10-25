import CaseLayout from '../components/CaseLayout.jsx';
import { GainTable, RunTiles } from '../components/figures.jsx';
import { Ext, Fig, LINKS, Mark, Pen, Row } from '../components/ui.jsx';

export default function ReservationAgent() {
  return (
    <CaseLayout
      no="Entry 3"
      meta="Oct 2026 · Agent"
      title="Restaurant Reservation Agent"
      lede="A booking agent for a 75-outlet chain that reroutes guests when an outlet is full, and never writes a booking without a yes."
      chips={['Python', 'MCP', 'Groq · gpt-oss-20b', 'Sarvam', 'SQLite', 'Streamlit', 'Docker']}
      actions={
        <>
          <Ext href={LINKS.demo} className="btn solid">Watch the demo</Ext>
          <span className="btn" aria-disabled="true" style={{ opacity: 0.6, cursor: 'default' }}>Repo coming soon</span>
        </>
      }
      prev={{ to: '/#work', label: 'Back to the notebook', title: 'All entries' }}
      next={{ to: '/work/graph-rag/', label: 'Entry 2', title: 'Graph RAG for Multi-Hop Questions' }}
    >
      <section className="section" id="problem">
        <Row note={<Pen>Today these guests are simply lost.</Pen>}>
          <span className="lbl">Question</span>
          <h2>One outlet is full, a sister outlet is free, and the guest leaves anyway</h2>
          <p>
            GoodFoods is a restaurant chain with outlets across Bengaluru. When the outlet a guest asks for is full, the booking is
            lost, even when another GoodFoods outlet nearby has space. The brief was a conversational agent that books, changes and
            cancels tables. I set myself one more test: can it turn “sorry, we’re full” into a saved booking?
          </p>
          <div className="facts">
            <div><span className="big">75</span><span>outlets in 24 neighbourhoods</span></div>
            <div><span className="big">12</span><span>sub-brands, 40–150 seats each</span></div>
            <div><span className="big">~58K</span><span>seeded bookings over 14 days</span></div>
          </div>
        </Row>
      </section>

      <section className="section" id="built">
        <Row note={<Pen>No LangChain. MCP is a protocol, not a framework.</Pen>}>
          <span className="lbl">Setup</span>
          <h2>Its own tool loop, 8 MCP tools, voice in 11 languages</h2>
          <p>
            The agent is a plain loop: fetch the tool schemas from the MCP server, call the model with the conversation and the
            tools, run any tool calls, feed the results back (errors included, so the model can correct itself), and stop at a text
            answer or after 6 model calls.
          </p>
          <Fig n={1} caption="One guest turn. The confirmation gate sits between the agent loop and every write.">
            <div className="arch">
              <div className="node"><b>Guest</b><span>text, or voice via Sarvam speech-to-text</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>Agent loop</b><span>my code · max 6 model calls a turn</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node hot"><b>Gate</b><span>holds every write until a yes</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>MCP server</b><span>8 tools, rules checked here</span></div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node"><b>SQLite</b><span>outlets, seats, bookings</span></div>
            </div>
          </Fig>
          <ul>
            <li><b>Tools:</b> recommend restaurants, restaurant details, check availability, make, look up, modify and cancel a reservation, and hand off to a human.</li>
            <li><b>Overflow routing, computed in code:</b> when an outlet is full, the tool returns up to 3 other times at the same outlet (within 2 hours) and up to 3 nearby outlets (within 6 km) free at the same time.</li>
            <li><b>Rules live on the server:</b> a broken rule comes back as a normal result with an error code and a sentence, so the model can recover.</li>
            <li><b>Dates resolved in code:</b> “tomorrow” and “next Friday” are worked out against a 14-day calendar, not by the model.</li>
            <li><b>No double booking:</b> check-and-insert happens in one database transaction.</li>
          </ul>
        </Row>
      </section>

      <section className="section" id="decision">
        <Row note={<Pen>The prompt asks nicely. The code enforces it.</Pen>}>
          <span className="lbl">Key decision</span>
          <h2>The confirmation rule lives in code, not in the prompt</h2>
          <p>
            Telling a model “always confirm before booking” works most of the time. Most of the time isn’t good enough for a
            write. So when the model calls a write tool, the gate holds it, and the server does a dry run so the details can be read
            back. It only lets the write through when the model repeats the same call after the guest has replied yes.
          </p>
          <p>
            That rule cost me two eval cases, which is the next section. The model sometimes asks for confirmation in plain text
            before calling the tool, so the gate asks a second time. It’s safe, but it costs the guest a turn.
          </p>
        </Row>
      </section>

      <section className="section" id="eval">
        <Row note={<Pen>About one full eval run a day fits in Groq’s free tier.</Pen>}>
          <span className="lbl">Result</span>
          <h2>16 scripted guest journeys, checked on tool, arguments and final state</h2>
          <div className="facts">
            <div><span className="big">13/16</span><span>journeys pass</span></div>
            <div><span className="big">20/22</span><span>turns pick the right tool</span></div>
            <div><span className="big">9/12</span><span>tool calls with the right arguments</span></div>
          </div>
          <Fig n={2} caption="Every journey in the first full run and the final run. Four changed between them.">
            <RunTiles />
          </Fig>
        </Row>
      </section>

      <section className="section" id="numbers">
        <Row note={<Pen>If I said “69% to 81%”, the first follow-up question would break it.</Pen>}>
          <span className="lbl">Reading my own numbers</span>
          <h2>Run 1 passed 11/16 and the final run 13/16. <Mark kind="under">Only one</Mark> of those cases is a real improvement.</h2>
          <Fig n={3} caption="Each case that changed between the first full run and the final one, with its cause.">
            <GainTable full />
          </Fig>
          <p>
            That makes +3 − 1 = +2: one genuine agent fix, two fixes to how the test measured success, and one case that got worse
            by chance. A difference of one or two cases is within noise on 16 journeys. Argument accuracy went from 8/12 to 9/12
            because outlet lookup now takes names, and the model stopped copying the example id R012.
          </p>
        </Row>
      </section>

      <section className="section" id="fails">
        <Row note={<Pen>Recorded as limitations, not patched to pass the test.</Pen>}>
          <span className="lbl">What still fails</span>
          <h2>Three journeys, two causes</h2>
          <div className="fails">
            <div className="failcard">
              <span className="mono">full-nearby-outlet</span>
              <p>The model dropped the area from “Green Bowl in Koramangala”, hit the ambiguous-name error, and asked “which one?” instead of saying the outlet was full.</p>
            </div>
            <div className="failcard">
              <span className="mono">modify</span>
              <p>The model read the change back in plain text before calling the tool, so the gate asked again after the guest’s yes. Nothing was written before the script ended. It failed both runs, for different reasons.</p>
            </div>
            <div className="failcard">
              <span className="mono">ignore-the-rules</span>
              <p>The model asked for confirmation itself instead of calling the tool first. Nothing was written and the guest was asked, but the tool check failed.</p>
            </div>
          </div>
          <p style={{ marginTop: 18 }}>
            <b>What I’d fix next:</b> right now the prompt and the gate both ask for confirmation. Let the gate own it alone.
          </p>
          <p className="muted">
            I also stopped fixing cases one at a time once the fixes started drifting into tuning the agent to these 16 journeys.
          </p>
        </Row>
      </section>

      <section className="section" id="demo">
        <Row note={<Pen>About 4 minutes. The voiceover is Sarvam’s text-to-speech, disclosed in the video.</Pen>}>
          <span className="lbl">Demo</span>
          <h2>Watch it book, reroute and hand off</h2>
          <p>The demo video is hosted on Google Drive.</p>
          <Ext href={LINKS.demo} className="btn solid">Open the demo video</Ext>
          <p className="muted" style={{ marginTop: 18 }}>
            The model is openai/gpt-oss-20b on Groq at temperature 0. The brief asked for an 8B Llama model; Groq retired
            llama-3.1-8b-instant during the build, so I switched to Groq’s named replacement and said so in the README.
          </p>
        </Row>
      </section>
    </CaseLayout>
  );
}
