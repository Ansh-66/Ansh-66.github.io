import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { findRoute } from './routes.jsx';
import '@fontsource/young-serif/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/kalam/latin-400.css';
import './styles.css';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
// Hydrate only markup prerendered for this route: dev serves an empty #root, and a host may
// serve index.html for an unknown path, whose markup lacks the not-found notice.
const served = root.dataset.path;
if (served && findRoute(served) === findRoute(window.location.pathname)) hydrateRoot(root, app);
else createRoot(root).render(app);
