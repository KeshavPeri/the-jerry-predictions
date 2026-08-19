# Supabase setup

Production setup is an owner-only action. The application deliberately shows a configuration error until a real Supabase project is connected; it never falls back to fixture statuses.

## Owner steps

1. Create the Supabase project and choose its region.
2. Apply `supabase/migrations/202608190001_fixed_competition.sql` in the SQL editor or with the Supabase CLI.
3. Copy the project URL and browser-safe **publishable** key into the build environment as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Never use a secret key or legacy service-role key in a `VITE_` value, source file, GitHub variable exposed to the browser, or build log.
5. Run the application and confirm all four seeded profiles load in the documented order before enabling GitHub Pages through the existing workflow.

The anonymous role can read competition and participant configuration, read current prediction entries, edit drafts, and change a draft to locked. It cannot insert or delete entries, edit a locked entry, edit fixed configuration, change actual results, or publish results. Actual results become browser-readable only after the owner sets `results_published` and its timestamp consistently.

This is state-integrity protection, not identity or privacy protection. Any visitor can select and edit any unlocked profile, so no sensitive data belongs in this project.
