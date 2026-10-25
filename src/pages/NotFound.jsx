import { Link } from 'react-router-dom';
import { Footer, Pen, Row, TopBar } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="view">
      <TopBar />
      <main id="main">
        <div className="frame">
          <article className="sheet" aria-labelledby="page-title">
            <Row note={<Pen>Torn out, or never written.</Pen>}>
              <span className="lbl">404</span>
              <h1 id="page-title" tabIndex={-1} style={{ fontFamily: 'var(--f-display)', fontWeight: 400, fontSize: 44, margin: '10px 0 14px' }}>
                This page isn’t in the notebook
              </h1>
              <p>The link may be mistyped, or the page may have moved.</p>
              <Link className="turnlink" to="/">Back to the notebook</Link>
            </Row>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
