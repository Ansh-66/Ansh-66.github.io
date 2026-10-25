import { Link } from 'react-router-dom';
import { Footer, TopBar } from './ui.jsx';

export default function CaseLayout({ no, meta, title, lede, chips, actions, children, prev, next }) {
  return (
    <div className="view">
      <TopBar />
      <main id="main">
        <div className="frame">
          <article className="sheet" aria-labelledby="page-title">
            <div className="sheet-head">
              <span>Lab notebook · {no}</span>
              <span>{meta}</span>
            </div>
            <div className="row case-head">
              <div className="margin" />
              <div className="body wide">
                <span className="lbl">{no} · full entry</span>
                <h1 id="page-title" tabIndex={-1}>{title}</h1>
                <p className="lede">{lede}</p>
                <ul className="chips" aria-label="Stack" style={{ marginBottom: 22 }}>
                  {chips.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div className="actions">{actions}</div>
              </div>
            </div>
            {children}
            <div className="row">
              <div className="margin" />
              <nav className="body wide pager" aria-label="More entries">
                {prev ? (
                  <Link to={prev.to}>
                    <span className="lbl">← {prev.label}</span>
                    <span className="t">{prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link className="next" to={next.to}>
                    <span className="lbl">{next.label} →</span>
                    <span className="t">{next.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
