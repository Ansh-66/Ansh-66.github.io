import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { routes, notFound } from './routes.jsx';

export function render(url) {
  return renderToString(
    <StaticRouter location={url} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </StaticRouter>
  );
}
export const pages = [...routes, notFound];
