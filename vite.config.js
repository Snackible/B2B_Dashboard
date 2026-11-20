import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only shim so /api/* serverless functions (written for Vercel) also run
// under `vite dev`, without needing a separate `vercel dev` process.
function apiDevMiddleware() {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        try {
          const qIdx = req.url.indexOf('?');
          const pathname = qIdx === -1 ? req.url : req.url.slice(0, qIdx);
          const search = qIdx === -1 ? '' : req.url.slice(qIdx + 1);
          const modPath = `.${pathname}.js`;
          const mod = await server.ssrLoadModule(modPath);
          req.query = Object.fromEntries(new URLSearchParams(search));
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
          await mod.default(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make .env.local vars (service-account creds) visible to the dev-mode
  // /api/* handlers via plain process.env, same as Vercel does in prod.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [react(), apiDevMiddleware()] };
});
