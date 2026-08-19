# The Jerry Predictions

A fixed 2026/27 football prediction competition for four friends, built through the Codex App Factory.

## Local development

1. Install dependencies with `npm ci`.
2. Start the app with `npm run dev`.
3. Run the release checks with `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

The product specification is in `docs/product-brief.md`. The ordered factory queue is in `docs/feature-backlog.md`.

## Configuration boundary

Only browser-safe Supabase values may use the `VITE_` prefix. Never place a service-role key or other secret in this repository or its GitHub Pages configuration.

Copy `.env.example` to `.env.local` for local development and provide the real project URL and browser-safe publishable key. Missing configuration produces an explicit setup state; production runtime never substitutes local fixtures. Owner-controlled database setup and permissions are documented in [`docs/supabase-setup.md`](docs/supabase-setup.md).

The production build uses Vite's `/the-jerry-predictions/` base path for GitHub Pages. The app is a single-page shell with no nested URL routes, so refreshes stay at the repository root while generated assets retain subpath-safe URLs.
