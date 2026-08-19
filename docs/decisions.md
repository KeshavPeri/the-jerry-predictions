# Decisions

Record material product decisions so a future run can reconstruct not only what was chosen but why. Routine implementation details still belong in code and pull requests.

## High impact

### 2026-08-19 — Launch is the preseason entry and reveal slice

- **Decision:** By Friday, 21 August 2026, the product must support profile selection, shared drafts, prediction entry, review, locking, rolling reveal, and a visible scoring reference. Actual-result entry, scoring execution, and the final leaderboard are post-launch features.
- **Because:** The season-entry experience is immediately time-sensitive; end-of-season tools will not be used for months. Separating the milestones protects the launch without leaving later behaviour undefined.
- **Alternatives rejected:** Complete end-to-end scoring by 21 August; prediction form without shared locking and reveal.
- **Consequences:** Launch tickets take priority over all scoring UI and administrator polish. The scoring engine and leaderboard remain ordered backlog work.
- **Reversibility:** Moderate. Post-launch features can be pulled forward only if all launch-critical work is already verified.
- **Authority:** Owner approved

### 2026-08-19 — Exactly four fixed participants

- **Decision:** V1 profiles are Keshav, Anshul, Kshitij, and Parth. Keshav is the administrator. Participants cannot register, rename, add, or remove profiles.
- **Because:** The app is a personal competition among four known friends. Dynamic user management would add no launch value.
- **Alternatives rejected:** The provisional three-person model; participant-created profiles; reusable group management.
- **Consequences:** Profile and competition data may be fixed configuration. Adding or replacing participants is an owner-level scope change.
- **Reversibility:** Moderate. It requires a product and data-model change, not merely a label edit after entries exist.
- **Authority:** Owner approved

### 2026-08-19 — Public honour-system use without authentication

- **Decision:** The public app lets anyone select any of the four profiles. There is no PIN, password, email login, identity verification, or real privacy boundary.
- **Because:** The owner explicitly prefers speed and simplicity over authentication and accepts trust among friends.
- **Alternatives rejected:** Supabase Auth, magic links, profile passcodes, binding a profile to one device.
- **Consequences:** Anyone with the URL or browser tools may view or manipulate anonymously accessible data. UI gating reduces accidental exposure only. The product must not claim privacy or verified identity and must store no sensitive data.
- **Reversibility:** Moderate. Authentication can be added later, but it changes the privacy boundary and requires owner approval and migration.
- **Authority:** Owner approved

### 2026-08-19 — GitHub Pages plus Supabase

- **Decision:** Use a public GitHub repository and GitHub Pages for the static application. Use one Supabase project as the only shared application service.
- **Because:** GitHub Pages alone cannot accept writes from four remote browsers. Supabase supplies a small shared source of truth without adding a custom server or football-data integration.
- **Alternatives rejected:** GitHub-only manual file exchange; GitHub Issues or Actions as a database; Supabase-free local storage; Vercel; a custom conventional backend.
- **Consequences:** Keshav must create and own the Supabase project and production configuration. The browser uses only the publishable key; no privileged key may be exposed. Anonymous access is a conscious risk.
- **Reversibility:** Moderate. Hosting can move easily; migrating the shared data service requires new infrastructure and owner approval.
- **Authority:** Owner constraint

### 2026-08-19 — One fixed 2026/27 competition

- **Decision:** The app supports one fixed season only. It does not create, switch, reset, or browse seasons.
- **Because:** Multi-season support is unnecessary for the first competition and would expand navigation, configuration, data migration, and testing.
- **Alternatives rejected:** Multiple seasons with history; reusable season setup; archived seasons in the application.
- **Consequences:** The 2026/27 clubs, categories, and participant set can be explicit. Reusing the product for another season is future product work.
- **Reversibility:** Moderate. Multi-season support requires schema and UX changes.
- **Authority:** Owner approved

### 2026-08-19 — No deadline and rolling locked-to-locked reveal

- **Decision:** There is no hard submission deadline. A participant may view another participant's predictions only when both entries are locked. Newly locked entries become visible to previously locked participants.
- **Because:** The friends will coordinate informally. Requiring the viewer to lock before seeing other calls discourages copying while allowing early submitters to compare without waiting for all four.
- **Alternatives rejected:** All-four simultaneous reveal; reveal each locked entry to everyone; fixed timestamp deadline; drafts visible throughout.
- **Consequences:** The app shows statuses rather than a countdown. This decision supersedes the workshop's earlier provisional all-four reveal. Without authentication, the rule is an honour-system UI convention.
- **Reversibility:** Easy at the UI level, but changing it after submissions begin affects competition fairness and requires owner approval.
- **Authority:** Owner approved

### 2026-08-19 — Partial entries may lock

- **Decision:** Cup and question fields are individually optional. The league table may be skipped, but a submitted table must rank all 20 unique clubs. At least one prediction of any kind is required to lock.
- **Because:** Friends should be allowed to skip categories they do not want to answer, while a partial 1–20 table has no coherent scoring meaning.
- **Alternatives rejected:** Require every field; require the league table; allow a completely blank lock; allow partial league tables.
- **Consequences:** Progress is informational, blanks score zero, and the review uses warnings rather than blocking errors. The initial alphabetical table cannot silently count as a prediction.
- **Reversibility:** Easy before locking begins; moderate afterward because it changes competitive eligibility.
- **Authority:** Owner approved

### 2026-08-19 — Scoring is balanced and transparent

- **Decision:** Use the complete 277-point system in `product-brief.md`: table maximum 135, cups 38, categorical questions 70, numeric questions 20, and match scores 14. Shared category winners receive full points, tied closest predictions receive full points, and tied overall leaders are joint winners.
- **Because:** The owner wants a richer table formula with champion, top-five, and relegation bonuses while keeping the table close to half the total available score.
- **Alternatives rejected:** Exact-position-only scoring; simple 5/3/1 without bonuses; table-dominant weighting; leaderboard tie-breakers.
- **Consequences:** The scoring implementation needs fixture-level tests and line-by-line explanations. Scores are derived data and must recalculate after actual-result corrections.
- **Reversibility:** Moderate before predictions lock; difficult and unfair after predictions are revealed. Any scoring change after launch requires explicit owner approval and clear communication.
- **Authority:** Owner approved

### 2026-08-19 — Keshav rules subjective categories and may name shared winners

- **Decision:** Keshav determines Most Improved Player, Impact Signing, and Flop of the Season and may enter multiple accepted winners.
- **Because:** A formal vote or external-publication dependency would add features and still might not cover all three informal categories.
- **Alternatives rejected:** In-app vote; informal group consensus as a required process; one external publication.
- **Consequences:** Keshav's ruling is the competition outcome. Any participant matching one entered winner receives the full seven points.
- **Reversibility:** Easy before outcomes are published; owner-controlled afterward with automatic recalculation.
- **Authority:** Owner approved

### 2026-08-19 — Administration and backup remain manual

- **Decision:** Do not build a polished administrator interface or app-level import/export for launch. Keshav reopens entries, exports data, enters actuals, and publishes results through Supabase. Locked revisions are not retained.
- **Because:** These operations are rare and not needed for participant launch. The owner accepts backend administration to protect the deadline.
- **Alternatives rejected:** Full admin console; in-app backup and restore; no backup of any kind; immutable locks.
- **Consequences:** Setup documentation must describe exact fields and safe procedures. Keshav should manually export after entries lock and after final results. Reopening replaces the current locked version without audit history.
- **Reversibility:** Easy to add a UI later; lost revision history cannot be reconstructed retroactively.
- **Authority:** Owner approved

### 2026-08-19 — Results require explicit publication

- **Decision:** Actual outcomes and scores stay hidden until Keshav explicitly marks results published. Corrections after publication recalculate all details and update the displayed timestamp.
- **Because:** Participants should not see misleading partial standings while actuals are being entered manually.
- **Alternatives rejected:** Live partial leaderboard; automatic publish when the last result appears.
- **Consequences:** The data model needs a publication flag. The app must not reveal partial actuals when the flag is false.
- **Reversibility:** Easy.
- **Authority:** Owner approved

### 2026-08-19 — Product name and public identity

- **Decision:** The product is named **The Jerry Predictions**, with `2026/27 Football Prediction Competition` as its descriptive subtitle. Recommended repository slug: `the-jerry-predictions`.
- **Because:** The owner supplied this personal name instead of a generic market-facing brand.
- **Alternatives rejected:** Fourcast, Before the Whistle, Table Lock, Season Call.
- **Consequences:** Use the full name in product metadata and `THE JERRY PREDICTIONS` as the restrained display wordmark.
- **Reversibility:** Easy before repository and production URLs are established; moderate afterward.
- **Authority:** Owner approved

### 2026-08-19 — Dark purple liquid-glass visual direction

- **Decision:** Use a classy, club-neutral, dark navy interface with cool purple/cyan ambience, restrained liquid-glass panels, ice text, subtle football cues, participant pennants, and minimal motion.
- **Because:** The owner supplied a prior FPL application as a mood reference and wants a related vibe without copying it or creating a tacky sports theme.
- **Alternatives rejected:** Classic paper prediction sheet; sticker-book maximalism; broadcast scoreboard; strong stadium or club-rivalry styling.
- **Consequences:** Contrast and opaque fallbacks take priority over transparency. Avoid clip art, fake grass, neon excess, betting language, constant motion, and decorative work that delays core reliability.
- **Reversibility:** Easy at the token level; moderate after components are polished.
- **Authority:** Owner approved

## Product Manager decisions

### 2026-08-19 — Use field-specific accessible local suggestions for ticket 16

- **Decision:** Replace the shared mixed suggestion catalogue with a local, field-specific combobox sourced from `prediction-options.json`. Preserve free-form manual entry, canonical stored values, and existing saved strings even when they are absent from the point-in-time catalogue.
- **Because:** Field-specific suggestions prevent clubs, players, and managers from appearing in the wrong prediction fields; a custom combobox supports visible club context and reliable keyboard, touch, and assistive interaction for large local lists.
- **Consequences:** Search normalizes case, diacritics, punctuation, and whitespace; results are capped initially with a refinement cue for responsive mobile use. Only explicit option selection stores a catalogue value.
- **Reversibility:** Easy.
- **Authority:** Delegated product authority

### 2026-08-19 — Distinguish positive table zones with restrained treatments for ticket 16

- **Decision:** Preserve existing textual table-boundary labels and use distinct muted tints plus border/left-accent treatments for champion, Champions League, Europa League, and Conference League rows.
- **Because:** The approved design reference requires each positive zone to be distinguishable at a glance without a visual redesign or colour-only meaning.
- **Reversibility:** Easy.
- **Authority:** Delegated product authority

### 2026-08-19 — Review only confirmed Premier League tables as predictions

- **Decision:** In Review & lock, a complete but unconfirmed Premier League table is shown as skipped rather than as twenty answers. The saved draft remains available for later confirmation.
- **Because:** The table is deliberately all-or-nothing: the product rules require explicit confirmation before it counts as a prediction or can be scored.
- **Consequences:** Completion remains informational; locking validates only that at least one valid prediction exists. A malformed stored table retains the existing non-destructive error state and cannot proceed to lock.
- **Reversibility:** Easy for the review presentation; moderate for malformed-data treatment.
- **Authority:** Delegated product authority

### 2026-08-19 — Treat the competition subtitle as descriptive text

- **Decision:** Render `2026/27 Football Prediction Competition` as a paragraph immediately beneath the existing page-level heading, not as a second heading.
- **Because:** The subtitle describes the approved product name, preserves one clear page-level heading, and satisfies the smoke ticket's accessibility requirement without restructuring the scaffold.
- **Evidence used:** Product brief / smoke feature issue / existing app shell
- **Confidence:** High
- **Reversibility:** Easy
- **Authority:** Delegated product authority

### 2026-08-19 — Use a mobile-first tabbed workspace

- **Decision:** Prediction entry uses tabs for Premier League Table, Cup Winners, Premier League Questions, and Review & Lock. Mobile is primary; desktop expands card layouts without changing the journey.
- **Because:** The entry contains 39 predictions and participants may use phones. Tabs permit flexible order and review without a long page or forced wizard.
- **Evidence used:** Product brief / design reference / owner screen choices
- **Confidence:** High
- **Reversibility:** Easy
- **Authority:** Delegated product authority

### 2026-08-19 — Use reorderable table with accessible movement controls

- **Decision:** Drag-and-drop is the primary table interaction, accompanied by explicit Move Up and Move Down controls and keyboard announcements.
- **Because:** Reordering is faster and more tactile than 20 dropdowns, while alternatives protect mobile and accessibility use.
- **Evidence used:** Product brief / design reference / owner screen choice
- **Confidence:** High
- **Reversibility:** Moderate
- **Authority:** Delegated product authority

### 2026-08-19 — Use static suggestions with manual fallback

- **Decision:** Club, player, and manager fields search a local packaged catalogue but always permit manual text. No live source or API is required.
- **Because:** UEFA qualifiers and transfers may be incomplete at launch, while free text alone creates avoidable spelling variation.
- **Evidence used:** Product brief / no-football-API constraint / deadline
- **Confidence:** High
- **Reversibility:** Easy
- **Authority:** Delegated product authority

### 2026-08-19 — Cup illustrations are optional polish

- **Decision:** Custom trophy illustrations may be added only after core behaviour is complete. Official photos are not required.
- **Because:** The implementation is easy but sourcing and licensing consistent official images could delay launch.
- **Evidence used:** Design reference / deadline / owner approval
- **Confidence:** High
- **Reversibility:** Easy
- **Authority:** Delegated product authority

### 2026-08-19 — Define Arsenal set-piece goals as non-penalty set plays

- **Decision:** Count Arsenal league goals originating from corners, direct or indirect free kicks, or throw-ins before open play resumes. Exclude penalties; include opponent own goals from the same phase.
- **Because:** `Set-piece goal` otherwise has inconsistent usage. The definition aligns with the common non-penalty grouping and can be shown before submission.
- **Evidence used:** Product brief / design reference / Opta definitions
- **Confidence:** High
- **Reversibility:** Easy before submissions; moderate afterward
- **Authority:** Delegated product authority

### 2026-08-19 — Use explicit save and failure states

- **Decision:** Autosave after a short pause, prevent locking while unsaved, preserve visible pending input on ordinary failure, offer retry, and use last-successful-save-wins for simultaneous devices.
- **Because:** Cross-device drafts are a core requirement, while full offline sync and conflict merging are disproportionate for four profiles.
- **Evidence used:** Product brief / infrastructure decision / deadline
- **Confidence:** High
- **Reversibility:** Moderate
- **Authority:** Delegated product authority

### 2026-08-19 — Use React, TypeScript, Vite, and a pure scoring module

- **Decision:** Build the static client with React, TypeScript, and Vite. Keep scoring in one deterministic, tested TypeScript module; Supabase stores inputs and publication state.
- **Because:** The application has interactive tabs, drag state, autosave, validation, reveal rules, and nontrivial scoring, but does not need server rendering or a separate API.
- **Evidence used:** Product brief / static-web profile / architecture constraints
- **Confidence:** High
- **Reversibility:** Moderate
- **Authority:** Delegated product authority

### 2026-08-19 — Accessibility and restraint are release requirements

- **Decision:** Require 360px mobile use, 44px touch targets, keyboard alternatives, visible focus, WCAG AA text contrast, text-plus-colour status, reduced motion, and opaque glass fallbacks.
- **Because:** The visual direction relies on dark translucent surfaces and drag interaction, both of which can create usability failures if treated as polish.
- **Evidence used:** Design reference / product brief
- **Confidence:** High
- **Reversibility:** Moderate
- **Authority:** Delegated product authority

### 2026-08-19 — Store ticket 4 answers as a versioned profile payload

- **Decision:** Save cup and Premier League-question answers as one versioned prediction payload per profile; each successful write replaces the prior saved payload.
- **Because:** This directly implements the approved last-successful-save-wins behaviour without conflict merging.
- **Evidence used:** Product brief / ticket 4 / existing Supabase prediction entry
- **Confidence:** High
- **Reversibility:** Moderate
- **Authority:** Delegated product authority

### 2026-08-19 — Ship baseline local suggestion catalogues for ticket 4

- **Decision:** Package fixed Premier League clubs plus common European clubs and relevant people as local suggestions, while always allowing manual text entry.
- **Because:** Live data is out of scope and an incomplete catalogue must never prevent a prediction.
- **Evidence used:** Product brief / ticket 4 / no-football-API constraint
- **Confidence:** High
- **Reversibility:** Easy
- **Authority:** Delegated product authority

### 2026-08-19 — Validate ticket 4 manual and numeric answers explicitly

- **Decision:** Trim and limit categorical manual answers to 120 characters; reject invalid numeric and score values instead of coercing them.
- **Because:** Football names remain practical while participants receive an exact correction path for invalid values.
- **Evidence used:** Product brief / ticket 4
- **Confidence:** Medium
- **Reversibility:** Easy
- **Authority:** Delegated product authority

### 2026-08-19 — Persist table drafts separately from confirmed table predictions

- **Decision:** Store the optional Premier League table as a complete ordered club-ID payload with a `confirmed` flag. A saved but unconfirmed reordered draft reloads across devices but contributes zero answered predictions; only an explicit confirmation counts all 20 positions. Clearing/skipping omits the table payload.
- **Because:** Participants must be able to resume reordering without the initial alphabetical list silently becoming a prediction. A single complete payload preserves the scoring-ready all-or-nothing rule.
- **Consequences:** Invalid saved table data (missing, duplicate, or unknown clubs) must surface a non-destructive malformed-data state and must not be silently repaired or re-saved. Pointer/touch dragging is paired with explicit movement controls and live announcements.
- **Reversibility:** Moderate.
- **Authority:** Delegated product authority

### 2026-08-19 — Use explicit refresh for rolling locked-entry reveal

- **Decision:** The locked-predictions hub uses an explicit `Refresh statuses` action instead of a Supabase Realtime subscription. The viewer's own entry is the initial and fallback selection; if a selected friend is reopened or otherwise becomes unavailable, the hub returns to the viewer's entry. Unconfirmed or skipped tables render as `No table prediction`, while blank individual answers render as `No prediction`.
- **Because:** Explicit refresh is an approved, simpler way to surface rolling locks without adding subscription lifecycle and consistency complexity. Falling back to the viewer's own entry avoids a surprising context switch and keeps a valid read-only entry visible. The wording preserves the all-or-nothing table rule.
- **Consequences:** Refresh must retain the active reading selection when it remains eligible, remove reopened profiles from eligible tabs and content, and show scoped retry/error states for inconsistent locked status and prediction payloads.
- **Reversibility:** Easy.
- **Authority:** Delegated product authority
