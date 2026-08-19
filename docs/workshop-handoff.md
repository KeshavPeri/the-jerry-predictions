# Workshop handoff — The Jerry Predictions

Use this summary in the Codex App Factory setup chat. The detailed authority is in the accompanying product brief, design reference, decisions, and backlog.

## Product

Create **The Jerry Predictions**, a fixed 2026/27 football-season prediction competition for four friends:

- Keshav — administrator
- Anshul
- Kshitij
- Parth

Launch target: **Friday, 21 August 2026**.

The launch must let all four friends use one public link, choose an honour-system profile, save predictions across devices, lock a partial entry containing at least one answer, and view every other participant who is already locked. There is no authentication, hard deadline, football API, in-season experience, or multi-season support.

Actual results, scoring execution, and the final leaderboard are post-launch tickets, but the full 277-point scoring system is already approved and must be displayed before locking.

## Recommended technical approach

- Scaffold `/Users/keshav/Projects/codex-apps/the-jerry-predictions` with the factory's `static-web` profile.
- Use React, TypeScript, and Vite for the static client.
- Use purpose-built CSS tokens rather than a large UI library.
- Host from a public GitHub repository through GitHub Pages.
- Use one Supabase project as the only shared application service.
- Use the browser-safe Supabase publishable key only; never expose a secret or service-role key.
- Model one fixed competition, four participant records, one current prediction document per participant, one actual-results document, timestamps/status, and a result-publication flag.
- Treat database rules as state-integrity protection, not authorization: anonymous browsers may edit any draft and lock it, but may not alter locked entries, participant configuration, actual results, or publication state. Unpublished actuals are not public-browser-readable. Identity remains an accepted honour-system constraint.
- Package static club/person suggestions locally and allow manual text fallback. Do not add a football API.
- Implement scoring as one deterministic pure TypeScript module with comprehensive fixtures. Supabase stores inputs and publication state; calculated scores are derived.
- Configure debounced autosave with explicit saving/saved/failed/offline states. Use last-successful-save-wins for simultaneous edits.
- Support 360px mobile first, then expand on desktop. Dragging the table must have keyboard and Move Up/Move Down alternatives.

## Visual direction

Use a classy nocturnal liquid-glass interface inspired by Keshav's supplied FPL Advisor mood reference, without copying its layout:

- near-black navy background;
- cool purple/cyan ambience;
- readable translucent navy panels;
- ice-blue text;
- restrained participant pennants;
- subtle qualification-zone accents;
- one brief lock illumination and a restrained final podium;
- no clip art, fake grass, betting language, team-rivalry theme, neon excess, or constant animation.

The frontend-design guidance influenced the final palette, typography roles, glass restraint, and signature participant-pennant treatment. Follow `design-reference.md` as the implementation reference.

## Critical product rules

- Profiles: Keshav, Anshul, Kshitij, Parth only.
- A participant may skip any cup/question and may skip the whole league table.
- A submitted league table must rank all 20 official clubs exactly once.
- The initial alphabetical table does not count until explicitly confirmed.
- At least one prediction is required to lock.
- Blanks score zero.
- A participant can see another entry only when both are locked through the normal interface.
- Keshav may reopen a locked entry manually; no revision history is retained.
- Reopened entries are hidden and excluded until relocked.
- Results remain hidden until Keshav explicitly publishes them.
- Published result corrections recalculate every score.
- Overall ties produce joint winners with no tie-breaker.

## Build order

First install the React/TypeScript/Vite scaffold, factory harness, CI/Pages workflows, product documents, and baseline design tokens as setup work. Then run the deliberately tiny smoke ticket defined in `feature-backlog.md`: **Show the approved 2026/27 competition subtitle**. The smoke change must travel through issue → Product Manager → Builder → QA → draft pull request.

After that path is proven, create or queue the eight approved product tickets in this dependency order:

1. Launch the fixed competition home and shared data foundation.
2. Save cup and Premier League-question drafts across devices.
3. Rank and save the complete 2026/27 Premier League table.
4. Review, understand, and lock a partial prediction entry.
5. Browse every eligible locked participant entry.
6. Store and deliberately publish final actual results — post-launch.
7. Calculate and explain every participant's score — post-launch.
8. Present the final leaderboard and joint winners — post-launch.

Do not pull post-launch work or optional trophy illustrations onto the 21 August critical path.

## Owner-only actions

Keshav must:

- create the public GitHub repository;
- create the Supabase project and choose its region;
- approve/apply production database setup;
- supply the production Supabase URL and publishable key;
- enable GitHub Pages and approve production publication;
- reopen entries manually when necessary;
- export the database after intended entries lock and after final results are confirmed;
- resume the free Supabase project if it pauses;
- decide subjective outcomes for Most Improved Player, Impact Signing, and Flop of the Season;
- enter, correct, and publish actual results at season end;
- approve any future authentication, cost, new service, privacy change, participant change, or new-season work.

The setup chat must not create accounts, publish production, merge autonomously, modify the Codex App Factory, or touch the separate Claude repositories without explicit owner action.

## Unresolved owner-only decisions

**None.** Product behaviour, participants, privacy posture, launch scope, scoring, visual direction, storage choice, and repository visibility are approved.

Supabase region, exact resource names/URLs, and the calendar timing of post-launch tickets are setup or scheduling actions rather than unresolved product decisions.

## Deliverables to install in the new app

- `docs/product-brief.md` ← `product-brief.md`
- `docs/design-reference.md` ← `design-reference.md`
- `docs/decisions.md` ← `decisions.md`
- Backlog source for GitHub issues ← `feature-backlog.md`

Preserve the factory's manual merge and production gates. Run one trivial smoke-test ticket through issue → Product Manager → Builder → QA → draft pull request before loading the real backlog, as required by the factory setup process.
