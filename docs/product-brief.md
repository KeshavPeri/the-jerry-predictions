# Product brief

## Outcome and deadline

**The Jerry Predictions** must let Keshav, Anshul, Kshitij, and Parth independently record and lock their 2026/27 football-season predictions through one public web link.

The launch slice must be usable by **Friday, 21 August 2026**. By that date, all four participants must be able to select their fixed profile, save a draft across devices, submit a valid partial entry, lock it, and view predictions belonging to other participants who have already locked. The complete scoring rules must also be visible before locking.

Actual-result entry, automatic scoring, and the final leaderboard are defined in this brief and backlog but are post-launch work because they are not needed until the end of the season.

Product objective: give four friends in different cities a fast, enjoyable way to make independent preseason predictions, compare their calls after locking, and return at season end for transparent scoring and joint or individual bragging rights.

Launch success means:

- all four participants can use one link without creating accounts;
- a participant can leave and resume a saved draft on another device;
- incomplete optional predictions do not prevent locking;
- a completely blank entry cannot be locked;
- the normal interface does not reveal another participant's predictions until the viewer has locked and the other participant has locked;
- every saved, failed, locked, and unavailable state is clear;
- the scoring rules shown in the product match the rules below;
- the application works comfortably on current mobile and desktop browsers.

## Users and primary journey

### Participants

There are exactly four fixed V1 profiles:

1. Keshav (`KE`) — also the administrator
2. Anshul (`AN`)
3. Kshitij (`KI`)
4. Parth (`PA`)

Shortest successful participant journey:

1. Open the public GitHub Pages link.
2. Choose the participant's own profile from the competition home.
3. Use the tabbed workspace to complete any desired predictions.
4. See automatic save status and return later from the same or another device if required.
5. Review answered and unanswered predictions.
6. Confirm and lock an entry containing at least one prediction.
7. View the participant's own locked entry and any other entries that are already locked.
8. Return later to see newly locked profiles.

Profile selection is an honour-system interaction, not identity verification. The app remembers the last selected profile on a device and always permits switching.

### Administrator

Keshav is the sole operational administrator. V1 does not include a polished or protected administrator interface. Keshav performs exceptional actions through the Supabase dashboard:

- reopen a locked entry by returning it to draft status;
- manually export the database at agreed milestones;
- later enter actual outcomes;
- mark results as published after reviewing them;
- correct an outcome after publication if necessary;
- resume a paused free Supabase project.

Reopening discards lock history. The current entry becomes a draft, is hidden through the normal reveal interface, cannot see other locked entries, and must be locked again before it participates in comparisons or scoring.

## V1 features

The 21 August launch slice includes only:

- public competition home for The Jerry Predictions;
- four fixed participant profiles and honour-system selection;
- `Not started`, `In progress`, and `Locked` status for each profile;
- shared Supabase persistence and automatic draft saving;
- visible `Saving`, `Saved`, `Offline`, and `Save failed` states;
- tabbed prediction workspace;
- reorderable 1–20 Premier League table with touch, pointer, and keyboard alternatives;
- five cup-winner predictions;
- fourteen Premier League questions;
- local searchable club/person suggestions with manual text fallback;
- optional unanswered predictions;
- grouped review and lock confirmation;
- rolling access to other locked participant entries after the viewer locks;
- complete scoring-rules reference;
- mobile-first responsive behaviour and accessibility requirements;
- dark purple/cyan liquid-glass visual direction;
- reliable loading, empty, invalid-data, unavailable-service, and retry states.

Post-launch first-season features already specified in the backlog are:

- actual-result data contract and publication state;
- deterministic scoring engine;
- published final leaderboard with expandable scoring details.

## Non-goals

V1 intentionally does not attempt:

- authentication, authorization, PINs, passwords, email links, or protection against impersonation;
- a real privacy boundary for drafts or locked predictions;
- a hard submission deadline or automatic time-based lock;
- football APIs or live football data;
- in-season standings, interim scoring, or recurring administration;
- multiple seasons, season creation, archives, or reuse for 2027/28;
- comments, chat, reactions, notifications, or social feeds;
- app-level backup, import, export, or recovery;
- a polished in-app administrator console;
- in-app actual-result entry in the launch slice;
- automatic scoring or the final leaderboard in the launch slice;
- participant-created profiles or public registration;
- a native mobile application, offline-first application, or install requirement;
- a custom domain, analytics, advertising, billing, or paid features;
- official trophy photography or required custom illustration work;
- official club badges where licensing or asset work would threaten the deadline.

## Product rules

### Competition and visibility

- The app represents one fixed competition: the 2026/27 season.
- There is no enforced submission deadline. The friends coordinate timing informally.
- Before a participant locks, the normal interface shows only participant names and statuses, not other predictions.
- A participant who has locked may view every other participant who is already locked.
- A participant who locks later becomes visible to all already-locked participants.
- An unlocked or reopened participant cannot view other entries until locking again.
- This visibility is a UI convention only. Anonymous shared storage means it is not a security or privacy guarantee.

### Drafts and concurrent use

- Each field saves automatically after a short pause.
- Locking is unavailable while a save is pending or has failed.
- Failed changes remain visibly unsaved on the current device and may be retried.
- The application does not promise full offline editing.
- If the same profile is edited simultaneously on two devices, the latest successful save wins. The product does not merge concurrent edits.

### Entry completeness and validation

- A participant may leave any cup or Premier League question unanswered.
- A participant may skip the whole league-table prediction.
- A submitted league table must contain all 20 clubs exactly once; a partial table is not accepted as a table prediction.
- The application must not treat the initial alphabetical ordering as a deliberate prediction unless the participant explicitly confirms the table.
- At least one prediction of any kind is required before locking.
- Unanswered predictions show as `No prediction` after reveal and score zero.
- Numeric predictions accept non-negative whole numbers only.
- Match scores accept non-negative whole numbers for both teams.
- Manual names are trimmed, length-limited, and compared using normalized case and whitespace. The administrator may enter multiple accepted spellings when necessary.

### 2026/27 Premier League table

The fixed club set is:

- Arsenal
- Aston Villa
- AFC Bournemouth
- Brentford
- Brighton & Hove Albion
- Chelsea
- Coventry City
- Crystal Palace
- Everton
- Fulham
- Hull City
- Ipswich Town
- Leeds United
- Liverpool
- Manchester City
- Manchester United
- Newcastle United
- Nottingham Forest
- Sunderland
- Tottenham Hotspur

Source: [official Premier League 2026/27 table](https://www.premierleague.com/en/tables).

The prediction table uses these informal visual zones without an explanatory disclaimer:

- position 1: champion;
- positions 1–5: Champions League;
- positions 6–7: Europa League;
- position 8: Conference League;
- positions 18–20: relegation.

### Prediction categories

Cup winners:

1. UEFA Champions League
2. UEFA Europa League
3. UEFA Conference League
4. FA Cup
5. Carabao Cup

Premier League questions, in display order:

1. Golden Boot winner
2. Most assists / Playmaker winner
3. Golden Glove winner
4. Player of the Season
5. Young Player of the Season
6. Manager of the Season
7. Most improved player
8. Impact signing of the season
9. Flop of the season
10. First permanent Premier League manager to leave their role
11. Chelsea Premier League red cards — closest wins
12. Arsenal Premier League set-piece goals — closest wins
13. Arsenal vs Chelsea at the Emirates — score prediction
14. Chelsea vs Arsenal at Stamford Bridge — score prediction

The entry contains 39 individual predictions: 20 table positions, five cups, and fourteen questions.

### Outcome authorities and definitions

- Cup winners use the official result of the named competition.
- Golden Boot, Playmaker, Golden Glove, Player of the Season, Young Player of the Season, and Manager of the Season use the official Premier League outcome.
- Keshav determines Most Improved Player, Impact Signing, and Flop of the Season. He may enter more than one recognized winner.
- `First permanent Premier League manager to leave their role` includes dismissal, resignation, and departure by mutual consent. Interim and caretaker managers do not count. `No managerial departure` is a valid prediction.
- Chelsea red cards use Chelsea's final official Premier League player red-card total. Straight-red and second-yellow dismissals count; coaching-staff dismissals and non-league matches do not.
- Arsenal set-piece goals are Arsenal Premier League goals originating from corners, direct or indirect free kicks, or throw-ins before play clearly returns to open play. Penalties are excluded. Opponent own goals resulting from the same set-piece phase count.
- A replayed or abandoned match uses the final official score recognized by the Premier League.
- If no official outcome exists for a category and the administrator does not provide one, the category is void and everyone scores zero for it. Scores are not renormalized.

### Scoring

#### Premier League table — maximum 135 points

For each club:

- exact finishing position: 5 points;
- one position away: 3 points;
- two positions away: 1 point;
- three or more positions away: 0 points.

Bonuses:

- correct champion: 5 points;
- each club correctly included in the top five, regardless of order: 2 points, maximum 10;
- all five top-five clubs correct: 5 additional points;
- each club correctly included in the relegated bottom three, regardless of order: 3 points, maximum 9;
- all three relegated clubs correct: 6 additional points.

#### Cup winners — maximum 38 points

- Champions League: 10 points;
- Europa League: 8 points;
- FA Cup: 8 points;
- Conference League: 6 points;
- Carabao Cup: 6 points.

Only the winner scores; finalists and semifinalists receive no partial credit.

#### Ten categorical Premier League questions — maximum 70 points

Questions 1–10 are worth 7 points each. A prediction matching any official or administrator-entered shared winner receives the full 7 points. Points are never divided among participants.

#### Two numeric closest-wins questions — maximum 20 points

For Chelsea red cards and Arsenal set-piece goals:

- closest prediction: 7 points;
- exact answer: 3 additional points, for 10 total;
- equally close participants each receive the full 7 points;
- multiple exact participants each receive 10 points;
- blank answers are ineligible and score zero.

#### Two Arsenal–Chelsea match predictions — maximum 14 points

For each match:

- correct home-win/draw/away-win result: 3 points;
- exact score: 4 additional points, for 7 total;
- a wrong result scores zero even when one team's goal total is correct.

#### Overall score and ties

The maximum total is 277 points:

- table: 135;
- cups: 38;
- categorical questions: 70;
- closest-wins questions: 20;
- match scores: 14.

If two or more participants share the highest total, they are joint winners. There is no leaderboard tie-breaker.

### Results and recalculation

- Actual results are stored separately from predictions.
- Results and scores remain hidden until Keshav explicitly sets `Results published`.
- The leaderboard must not show partial results merely because some actual outcomes exist.
- Once published, the score is derived from the latest locked prediction and latest actual outcomes.
- Correcting an actual outcome recalculates all participant totals and details automatically.
- The leaderboard shows the latest results-update time.
- A reopened entry is excluded until it is locked again.

## Data and privacy

Data consists of:

- one fixed competition record and publication state;
- four participant records and display metadata;
- one current draft or locked prediction document per participant;
- timestamps and entry status;
- one actual-results document;
- derived scores, which should be recalculated rather than treated as the source of truth.

Supabase is the shared source of truth. The browser stores only convenience state such as the last selected profile and pending unsaved input.

The GitHub Pages site and repository are public. There is no authentication. Anyone who discovers the URL can view the public application, select any profile, and potentially manipulate anonymously writable data. UI visibility and locked-state checks reduce accidental misuse but are not a security boundary. The product must state this honestly in project documentation and must never store sensitive personal data.

Anonymous database permissions should still minimize accidental damage:

- participant and competition configuration is browser-readable but not browser-editable;
- any anonymous browser may read and edit any draft prediction entry and may transition a draft to locked;
- anonymous browser writes to a locked entry are rejected;
- actual results and publication state are never browser-writable;
- unpublished actual results are not browser-readable;
- Keshav performs privileged reopen, actual-result, and publication operations through the Supabase dashboard.

These rules protect state transitions, not identity. They cannot determine which friend is operating an anonymous browser.

The only personal identifiers are the four supplied display names. No email address, password, precise location, analytics identifier, or football-account data is collected by the application.

V1 has no in-app import, export, backup, restore, or deletion workflow. Keshav manually exports the Supabase database:

- immediately after all intended entries have been locked;
- after final actual results and the leaderboard are confirmed.

The application contains no delete-season or reset-season operation. Deleting the Supabase project is irreversible and remains an owner-only external action.

## Architecture and deployment

Recommended V1 approach:

- **Frontend:** React with TypeScript and Vite. This gives the tabbed workspace, drag interactions, shared state, validation, and tested scoring logic without requiring a server-rendered application.
- **Styling:** purpose-built CSS with design tokens; no large component library. This keeps the liquid-glass visual direction controlled and the bundle small.
- **Shared data:** one Supabase Postgres project accessed with its browser-safe publishable key. No service-role or secret key may appear in the app or repository.
- **Data shape:** fixed competition and participants, one prediction document per participant, and one actual-results document.
- **Anonymous data boundary:** public clients may edit any draft and lock it, but database policies/triggers reject client edits after lock and reject all client changes to participant configuration, actuals, and publication state. The owner dashboard can perform the approved privileged operations. This is state-integrity protection, not identity security.
- **Scoring:** a deterministic, pure TypeScript scoring module with comprehensive fixture-based tests. Supabase stores the inputs and publication state; the same function produces totals and detailed explanations.
- **Suggestions:** static local club/person catalogues with manual text fallback; no football API.
- **Hosting:** public GitHub repository, GitHub Actions build, and GitHub Pages deployment.
- **Operations:** Keshav creates and owns Supabase and GitHub resources, performs production actions, and enters exceptional data manually.

Automatic saves should be debounced and should update one participant document without page reload. A database `updated_at` value supports status feedback. Simultaneous edits use last-successful-save-wins rather than conflict merging.

The four-participant scale and fixed season make this deliberately small. Do not add a custom API server, serverless function layer, state-management framework, analytics service, content system, or background worker unless a later approved feature proves it necessary.

## Visual direction

The product should feel nocturnal, refined, cool, social, and competitive. It uses a near-black navy background, restrained purple/cyan ambience, readable liquid-glass surfaces, ice-blue typography, and subtle football cues. Four luminous participant pennants and a brief lock glow provide the signature moment.

See [`design-reference.md`](design-reference.md) for the complete direction.

## Definition of V1 done

V1 is ready when all of the following are independently observable in the deployed production site:

- The public URL loads The Jerry Predictions on a 360px phone viewport and a desktop viewport without horizontal page overflow.
- The home shows Keshav, Anshul, Kshitij, and Parth with correct statuses.
- Selecting a profile opens its existing shared draft and is remembered on that device.
- A change made on one device appears when the same profile is opened on another device after successful save.
- Save progress, success, offline, and failure states are distinguishable and actionable.
- All 20 official 2026/27 clubs can be reordered through pointer/touch and Move controls.
- The table cannot be submitted partially or with duplicate/missing clubs, and an untouched alphabetical table is not silently treated as a prediction.
- All five cup fields support local search and manual fallback.
- All fourteen questions use the correct input type, wording, order, and helper definitions.
- A completely blank entry cannot lock.
- An entry with at least one valid prediction and other blanks can review and lock after confirmation.
- Locking is blocked while data is unsaved.
- An unlocked participant cannot open predictions through normal reveal navigation.
- A locked participant can view every other locked entry and sees waiting states for unlocked profiles.
- Reopening an entry in Supabase causes it to disappear from comparisons and lose access until it locks again.
- The scoring reference exactly matches the 277-point system in this brief.
- All controls are keyboard accessible, colour-independent, visibly focused, and usable with reduced motion.
- A failed or paused Supabase connection produces a clear retry state rather than a blank or misleading competition.
- No secret or service-role credential is present in the built site, source repository, or browser network configuration.
- The application passes its configured type check, lint, automated tests, production build, and focused manual QA checks.

## Delegated product authority

Ultimate objective: deliver the smallest reliable and enjoyable four-friend preseason prediction experience by 21 August, while preserving a transparent path to end-of-season scoring.

The Product Manager should optimize in this order:

1. successful saving and recovery from ordinary connection failures;
2. correct locking and rolling reveal behaviour;
3. scoring-rule fidelity and data integrity;
4. mobile usability and accessibility;
5. clarity and speed of entry;
6. refined visual character;
7. optional polish.

Non-negotiable constraints:

- exactly four fixed participants for V1;
- one fixed 2026/27 season;
- public GitHub Pages and public repository;
- Supabase is the only external application service;
- no authentication or claimed security boundary;
- no football API, conventional custom backend, Vercel, or in-season product;
- no hard submission deadline;
- unanswered predictions are allowed under the rules above;
- participant predictions become visible on a locked-to-locked basis;
- no autonomous production merge or publishing action;
- the 21 August launch scope must not be delayed for end-of-season administration, scoring, or optional art.

Within those constraints, the Product Manager may decide routine copy, spacing, field labels, validation wording, loading treatment, profile colours, responsive breakpoints, catalogue organization, and other reversible implementation details. Material decisions must be added to `decisions.md`.

## Owner-only boundaries

In addition to the factory defaults, only Keshav may:

- create, configure, pause, resume, transfer, upgrade, or delete the Supabase project;
- choose the Supabase region and accept any future billing change;
- create the public GitHub repository and enable GitHub Pages;
- supply production configuration values;
- approve and perform production merge or deployment actions;
- reopen participant entries in the Supabase dashboard;
- rule on Most Improved Player, Impact Signing, and Flop of the Season;
- enter, correct, and publish actual results;
- manually export or restore database data;
- change the privacy boundary, add authentication, introduce cost, or add another service;
- change the four participants, fixed season, launch deadline, or fundamental competition purpose.

## Open decisions

No unresolved product decision remains from the workshop.

The Supabase region, exact production resource names, production URLs, and timing of post-launch scoring work are setup or scheduling actions for Keshav rather than unresolved product behaviour. They must not block implementation against local/test configuration.
