# The Jerry Predictions

A fixed 2026/27 football prediction competition for four friends, built through the Codex App Factory.

## Local development

1. Install dependencies with `npm ci`.
2. Start the app with `npm run dev`.
3. Run the release checks with `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

The product specification is in `docs/product-brief.md`. The ordered factory queue is in `docs/feature-backlog.md`.

## Configuration boundary

Only browser-safe Supabase values may use the `VITE_` prefix. Never place a service-role key or other secret in this repository or its GitHub Pages configuration.
