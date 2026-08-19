# Project configuration

This file is the command and environment source of truth for The Jerry Predictions.

## Stack

- **App type:** Static web application
- **Language/framework:** React 19, TypeScript, and Vite
- **Package/dependency manager:** npm
- **Data storage:** Supabase Postgres after Ticket 1; no production project or credential is part of the scaffold
- **Hosting/deployment:** GitHub Pages

## Commands

- **Install/setup:** `npm ci`
- **Test:** `npm test`
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Run locally:** `npm run dev -- --host 127.0.0.1` at `http://127.0.0.1:5173`
- **Typecheck or other required check:** `npm run typecheck`

## Local QA

- **Local URL or launch command:** `npm run dev -- --host 127.0.0.1`
- **Production-like local URL:** `npm run preview -- --host 127.0.0.1` at `http://127.0.0.1:4173`
- **Test users or fixtures:** Four fixed profiles: KE, AN, KI, and PA. Use local fixtures until owner-approved Supabase configuration exists.
- **Important devices/environments:** 360px mobile, current Safari/iPhone and Chrome/Android where available, desktop keyboard navigation, reduced motion, and reduced-transparency/opaque fallback

## Deployment

- **Preview process:** Local QA evidence by default; add a provider only if the brief requires previews
- **Production trigger:** Merge to `main`
- **Build artifact:** `dist/`
- **Required owner-only setup:** Create the public GitHub repository, enable GitHub Pages with GitHub Actions, create and configure Supabase, choose its region, apply or approve production database setup, and supply only the browser-safe production URL and publishable key
