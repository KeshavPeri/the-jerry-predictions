# Ordered feature backlog

The backlog is ordered by dependency and release value. Tickets 1–5 form the smallest usable launch slice for Friday, 21 August 2026. Tickets 6–8 complete the end-of-season experience later. Each ticket should be created with the factory's `Factory feature` issue template and should remain one focused pull request.

The React/TypeScript/Vite shell, factory harness, standard CI, GitHub Pages workflow, approved documents, and basic design tokens are setup work installed before the feature queue opens. They are not separate product tickets. This keeps the backlog focused on user outcomes and avoids spending autonomous runs on mechanical framework setup.

## Factory smoke ticket — run before Ticket 1

This is a deliberately tiny, permanent product change used to prove the complete issue → Product Manager → Builder → QA → draft pull request path. It does not count as one of the eight product tickets.

### Ticket title

**[Smoke] Show the approved 2026/27 competition subtitle**

### User-visible outcome

A visitor opening the scaffolded home sees `2026/27 Football Prediction Competition` directly beneath `THE JERRY PREDICTIONS`.

### Definition of done

- The exact approved subtitle appears once beneath the product name.
- The title and subtitle have a logical accessible heading relationship.
- The subtitle remains readable without horizontal overflow at 360px.
- An automated test verifies the approved text is rendered.
- The standard test, lint, typecheck, and production-build commands pass.

### In scope

- Home subtitle markup
- Existing typography-token use
- One focused rendering test

### Out of scope

- Supabase
- Participant status data
- Profile selection
- Prediction entry
- New visual effects or layout restructuring

### Dependencies and relevant decisions

- Dependency: completed local scaffold and baseline validation.
- Product brief: `Outcome and deadline`.
- Decisions: `Product name and public identity`.

### Verification notes and important edge cases

- Verify the exact `2026/27` punctuation and capitalization.
- Verify 360px and desktop widths.
- Confirm the smoke change does not introduce a second page-level heading.

### Owner-only action required

**No.** This ticket must remain fully testable locally and must stop at a draft pull request.

## Release sequence

| Order | Ticket | Milestone | Depends on |
| --- | --- | --- | --- |
| 1 | Launch the fixed competition home and shared data foundation | Launch | None |
| 2 | Save cup and Premier League-question drafts across devices | Launch | 1 |
| 3 | Rank and save the complete 2026/27 Premier League table | Launch | 1, 2 autosave contract |
| 4 | Review, understand, and lock a partial prediction entry | Launch | 2, 3 |
| 5 | Browse every eligible locked participant entry | Launch | 4 |
| 6 | Store and deliberately publish final actual results | Post-launch | 1, 5 |
| 7 | Calculate and explain every participant's score | Post-launch | 4, 6 |
| 8 | Present the final leaderboard and joint winners | Post-launch | 7 |

Optional trophy illustrations and an in-app administrator console are not ready backlog tickets. They may be proposed later only after the approved work is complete.

---

## 1. Launch the fixed competition home and shared data foundation

### Ticket title

**[Feature] Launch the fixed competition home and shared data foundation**

### User-visible outcome

Keshav, Anshul, Kshitij, and Parth can open The Jerry Predictions, see the current competition and all four profile statuses, select their own profile, and enter a stable mobile-first application connected to the shared competition data.

### Definition of done

- Given the configured application, when a visitor opens it, then `THE JERRY PREDICTIONS` and `2026/27 Football Prediction Competition` are visible.
- The home displays exactly Keshav, Anshul, Kshitij, and Parth, in that order, with monograms `KE`, `AN`, `KI`, and `PA`.
- Each profile shows one of `Not started`, `In progress`, or `Locked`, derived from shared data rather than hardcoded screen state.
- Selecting a profile opens that profile's workspace and the choice is remembered on that device.
- A visitor can switch profiles without a sign-in or sign-out flow and sees a concise honour-system instruction.
- The shared database setup creates one fixed competition, four participants, current prediction-entry storage, actual-result storage, timestamps, and a result-publication flag.
- Anonymous database permissions allow draft edits and draft-to-locked transitions, reject anonymous writes to locked entries, and reject anonymous changes to participants, actual results, and publication state.
- Unpublished actual results are not readable through the public browser role.
- The browser connects only with a Supabase publishable key; no secret or service-role key appears in source, build output, logs, or browser requests.
- While initial data loads, the screen shows a purposeful loading state.
- When Supabase is unavailable or paused, the screen explains that competition data cannot be reached and offers `Try again`; it does not display invented empty statuses.
- The public application builds successfully for its GitHub Pages base path and supports direct refresh/navigation without broken asset URLs.
- At 360px and desktop widths, the home has no unintended horizontal overflow and all essential text meets WCAG AA contrast.
- Automated checks cover competition/profile parsing, status mapping, missing configuration, and unavailable-data behaviour.

### In scope

- Extension of the existing React, TypeScript, and Vite application shell
- Extension of the installed CSS token foundation from `design-reference.md`
- Verification and app-specific adjustment of the existing GitHub Pages build/deployment configuration
- Supabase schema/migrations and browser client
- Least-privilege anonymous policies and locked-state integrity rules
- Fixed competition and participant seed data
- Competition home and profile selection
- Device-local memory of selected profile
- Loading, configuration, and connection-failure states
- Basic tabbed workspace shell for later prediction surfaces
- Setup documentation for production configuration

### Out of scope

- Authentication or protected profiles
- Prediction fields or autosaving answers
- Table reordering
- Locking or reveal
- Scoring and leaderboard
- In-app administrator tools
- Multiple competitions or seasons
- Club/trophy artwork

### Dependencies and relevant decisions

- Dependencies: the factory smoke ticket has completed successfully.
- Product brief: `Outcome and deadline`, `Users and primary journey`, `Data and privacy`, `Architecture and deployment`.
- Decisions: `Exactly four fixed participants`, `Public honour-system use without authentication`, `GitHub Pages plus Supabase`, `One fixed 2026/27 competition`, `Product name and public identity`, `Dark purple liquid-glass visual direction`.

### Verification notes and important edge cases

- Test with valid data, an empty response, a malformed profile record, wrong Supabase URL/key, and simulated network failure.
- Test GitHub Pages under a repository subpath rather than only at `/`.
- Confirm that selecting Keshav and Kshitij remains visually unambiguous despite the same first initial.
- Confirm that public repository inspection reveals no privileged credential.
- Verify current Safari/iPhone and Chrome/Android behaviour where available, plus one desktop browser.
- A free Supabase project may pause; the error state must not imply participant data was deleted.

### Owner-only action required

**Yes.** Keshav must create the public GitHub repository and Supabase project, choose the Supabase region, apply or approve the production database setup, supply the production URL and publishable key, enable GitHub Pages, and approve production publication. The ticket must remain testable with local/test configuration before those actions.

---

## 2. Save cup and Premier League-question drafts across devices

### Ticket title

**[Feature] Save cup and Premier League-question drafts across devices**

### User-visible outcome

A participant can answer any cup or Premier League question in the tabbed workspace, see reliable save feedback, leave, and later resume the same shared draft from another device.

### Definition of done

- The workspace contains tabs named `Premier League table`, `Cup winners`, `Premier League questions`, and `Review & lock`.
- The Cup Winners tab contains Champions League, Europa League, Conference League, FA Cup, and Carabao Cup in that display order.
- Each cup field searches a packaged local club catalogue and permits a trimmed manual answer when no suggestion fits.
- The Premier League Questions tab contains all fourteen questions in the exact order specified by the product brief.
- Questions 1–10 use a player, manager, club, or `No managerial departure` categorical answer as appropriate; questions 11–12 accept non-negative whole numbers; questions 13–14 accept paired non-negative whole-number scores.
- The Arsenal set-piece question exposes the complete approved definition through helper text and an accessible information disclosure.
- Every field is optional and can be cleared before locking.
- After a short idle period, a changed field shows `Saving` and then `Saved` only after the shared write succeeds.
- Given a saved answer on device A, when the same profile is opened on device B, then the saved answer is loaded.
- If a save fails, the current input remains visible, the state says `Not saved`, and `Retry` attempts the write again.
- While offline, the app says that changes are not shared and does not falsely show `Saved`.
- Simultaneous edits use documented last-successful-save-wins behaviour without crashing or duplicating answers.
- Entering the first saved prediction changes the profile from `Not started` to `In progress`.
- Inputs, suggestions, disclosures, save status, and tabs are keyboard accessible and usable at 360px.
- Automated tests cover answer serialization, clearing, normalization, debouncing, save failure, retry, and reloading a shared draft.

### In scope

- Cup and question card UI
- Static local suggestion catalogues
- Manual answer fallback
- Correct input types and validation
- Shared answer serialization
- Autosave, retry, offline, and pending state
- Cross-device loading
- Answered/total progress indicators
- Responsive one-/two-column question grid

### Out of scope

- Premier League table behaviour
- Requirement that all fields be answered
- Locking, reveal, scoring, or results
- Live squad, transfer, manager, or UEFA entrant APIs
- Dynamic suggestions learned from other participants, which could leak predictions
- Official trophy photographs; custom illustrations remain optional future polish
- Conflict merging between simultaneous devices

### Dependencies and relevant decisions

- Dependency: Ticket 1.
- Product brief: `Prediction categories`, `Drafts and concurrent use`, `Entry completeness and validation`.
- Design reference: `Cup winners`, `Premier League questions`, `Feedback and errors`.
- Decisions: `Partial entries may lock`, `Use a mobile-first tabbed workspace`, `Use static suggestions with manual fallback`, `Use explicit save and failure states`, `Define Arsenal set-piece goals as non-penalty set plays`.

### Verification notes and important edge cases

- Test manual and suggested names with leading/trailing spaces, accents, punctuation, case differences, and maximum length.
- Test numeric values `0`, a typical value, a negative value, a decimal, pasted text, and an unusually large value.
- Test match scores including `0–0`, one side blank, negative input, and nonnumeric input.
- Confirm `No managerial departure` is selectable and caretaker managers do not appear as the rule definition.
- Confirm manual UEFA club entry works even if qualifying catalogues are incomplete.
- Confirm clearing the last answer returns status to `Not started` unless a league table later exists.
- Confirm other participants' manual answers never become pre-lock suggestions.

### Owner-only action required

**No ticket-specific owner action.** Keshav may optionally review the packaged suggestions, but missing names cannot block use because manual entry is supported.

---

## 3. Rank and save the complete 2026/27 Premier League table

### Ticket title

**[Feature] Rank and save the complete 2026/27 Premier League table**

### User-visible outcome

A participant can arrange all 20 official 2026/27 Premier League clubs into a complete predicted table using drag, touch, keyboard, or explicit movement controls, and resume the saved order later.

### Definition of done

- The table contains exactly the 20 clubs listed in the product brief and no relegated 2025/26 club.
- The initial order is alphabetical and visibly `Not confirmed`; merely opening the tab does not create a table prediction.
- A participant can reorder a club with pointer drag-and-drop.
- A participant can reorder the same list without dragging through Move Up and Move Down controls.
- Keyboard movement announces the moved club and its new position to assistive technology.
- Position numbers remain fixed while club rows move.
- Visual labels and restrained tints identify champion, positions 1–5, positions 6–7, position 8, and positions 18–20 without relying on colour alone.
- Confirming the table saves all 20 unique club identifiers as one coherent prediction and contributes 20 answered predictions to progress.
- A saved table reloads in the same order on another device.
- A participant can deliberately clear/skip the whole table before locking.
- The app rejects and safely reports any malformed saved table with a missing, duplicate, or unknown club; it does not silently repair and save it.
- Reordering shows the same reliable `Saving`, `Saved`, and failure behaviour as other answers.
- The list remains usable at 360px without horizontal page scrolling or inaccessible drag-only targets.
- Automated tests cover the club set, validation, scoring-ready serialization, movement boundaries, confirm/skip, and malformed data.

### In scope

- Fixed official 2026/27 club data
- Reorderable numbered list
- Drag, touch, keyboard, and movement-button interaction
- Position-zone presentation
- Explicit table confirmation
- Whole-table skip/clear behaviour
- Shared persistence and cross-device reload
- Accessible movement announcements

### Out of scope

- Partial table submission
- Live league standings or football API
- Club badges as a launch dependency
- Table scoring calculations
- Four-person side-by-side comparison
- European qualification logic beyond the fixed visual bands

### Dependencies and relevant decisions

- Dependencies: Tickets 1 and 2's shared autosave contract.
- Product brief: `2026/27 Premier League table`, `Entry completeness and validation`.
- Design reference: `Premier League table`, `Premier League position zones`.
- Decisions: `Partial entries may lock`, `Use reorderable table with accessible movement controls`, `No deadline and rolling locked-to-locked reveal`.

### Verification notes and important edge cases

- Verify the exact set against the [official Premier League 2026/27 table](https://www.premierleague.com/en/tables).
- Move the first row up and last row down; controls should be disabled or no-op with clear semantics.
- Exercise rapid repeated moves and a save failure mid-reorder.
- Reload before confirming: the product must distinguish a deliberate saved draft order from an accepted table prediction as specified by the implementation design.
- Test VoiceOver or another available screen reader for move announcements.
- Test long names such as Brighton & Hove Albion and Tottenham Hotspur on narrow screens.

### Owner-only action required

**No.** The fixed club list is an approved product input and should be implemented from the product brief.

---

## 4. Review, understand, and lock a partial prediction entry

### Ticket title

**[Feature] Review, understand, and lock a partial prediction entry**

### User-visible outcome

A participant can inspect every answered and unanswered prediction, understand the complete scoring system, correct mistakes, and deliberately lock any entry containing at least one valid prediction.

### Definition of done

- The Review & Lock tab shows every category grouped as Premier League table, Cup winners, and Premier League questions.
- Each answered item displays its saved value; each blank displays `No prediction`.
- Every group provides an `Edit` action that returns to the relevant tab and field or section.
- A completely blank entry shows why it cannot lock and the lock action remains disabled.
- An entry with at least one valid prediction may lock even when every other optional prediction is blank.
- An unconfirmed or malformed table is treated as skipped and never partially scored or locked as a table.
- Locking is disabled whenever any change is pending, offline, or failed to save.
- The confirmation states that the entry will become read-only and Keshav must reopen it for changes.
- Confirming lock changes the shared state atomically to `Locked`, records a timestamp, and prevents ordinary answer updates.
- The locked participant sees the brief reduced-motion-safe pennant illumination and then the locked hub.
- Refreshing or opening the locked profile on another device shows the same read-only values.
- If Keshav changes the entry back to draft in Supabase, the participant may edit again; no revision history is shown or implied.
- A scoring-rules reference is available before confirmation and exactly describes the 277-point system, shared outcomes, closest ties, blank answers, and joint winners.
- The scoring reference includes the approved set-piece, Chelsea red-card, and first-manager definitions.
- Automated tests cover blank rejection, partial acceptance, pending-save prevention, atomic lock, locked-write rejection, reopening, and rules-content constants.

### In scope

- Full grouped review
- Missing-answer warnings
- Edit links
- At-least-one validation
- Lock confirmation and locked state
- Read-only entry treatment
- Reopen compatibility with manual Supabase administration
- Complete scoring reference
- Signature lock transition and reduced-motion equivalent

### Out of scope

- In-app administrator controls
- Revision history or diffs
- Hard deadline or automatic lock
- Scoring execution
- Actual results and leaderboard
- Forced completion of all fields

### Dependencies and relevant decisions

- Dependencies: Tickets 2 and 3.
- Product brief: `Entry completeness and validation`, `Scoring`, `Competition and visibility`.
- Design reference: `Review and lock`.
- Decisions: `Partial entries may lock`, `Scoring is balanced and transparent`, `Administration and backup remain manual`, `No deadline and rolling locked-to-locked reveal`.

### Verification notes and important edge cases

- Test entries containing only one cup, one numeric answer equal to zero, one match score of `0–0`, and only a confirmed table.
- Confirm numeric zero and `0–0` count as answers rather than blanks.
- Attempt to lock during a delayed save, failed save, and offline state.
- Attempt a direct ordinary update after locking and confirm it is rejected or safely ignored by the data layer.
- Reopen manually and confirm the latest values return to editable draft without history.
- Check scoring-copy values against calculation fixtures before approval; duplicated constants should be avoided where practical.

### Owner-only action required

**No implementation action.** Reopening a real production entry later is an owner-only Supabase action by Keshav.

---

## 5. Browse every eligible locked participant entry

### Ticket title

**[Feature] Browse every eligible locked participant entry**

### User-visible outcome

After locking, a participant can view their own predictions and move between every friend who is already locked, while unlocked friends remain clear waiting states.

### Definition of done

- A locked participant lands on a hub that says `You're locked in` and shows all four profile statuses.
- The participant's own locked predictions are always available.
- Every other locked profile appears as an enabled participant tab and displays that person's complete entry.
- Every unlocked or reopened profile displays a waiting state and has no prediction-detail route through the normal interface.
- An unlocked viewer is directed to their own workspace and cannot navigate to locked-entry details through the normal reveal UI.
- When another participant locks, an already-locked viewer sees the updated status after a supported real-time update or explicit refresh/retry without losing reading position.
- When an entry is reopened, it is removed from eligible tabs and its current content is no longer displayed through the hub.
- Blank answers render as `No prediction`; the table shows `No table prediction` when skipped.
- Participant names, monograms, status text, and selected tab make identity clear without colour dependence.
- The view uses one participant at a time and does not introduce a dense comparison matrix.
- The app behaves safely if a participant status and prediction document are temporarily inconsistent, showing retry/error rather than leaked or fabricated content.
- The complete launch journey passes at 360px, common mobile touch sizes, desktop keyboard navigation, reduced motion, and opaque glass fallback.
- Automated tests cover all combinations of viewer draft/locked and subject draft/locked, plus reopen and refresh transitions.

### In scope

- Locked-predictions hub
- Four participant status cards
- Locked-profile tabs and individual read-only entry view
- Waiting and skipped-answer states
- Rolling status refresh or Supabase real-time subscription where it remains simple
- Launch-level responsive, accessibility, and error-state integration
- End-to-end launch journey verification

### Out of scope

- True privacy or authorization
- Side-by-side comparison matrix
- Comments, reactions, notifications, or presence
- Scoring, actual outcomes, or leaderboard
- New participant profiles
- In-season updates

### Dependencies and relevant decisions

- Dependency: Ticket 4.
- Product brief: `Competition and visibility`, `Definition of V1 done`.
- Design reference: `Locked-predictions hub`, `Accessibility`, `Responsive behaviour`.
- Decisions: `No deadline and rolling locked-to-locked reveal`, `Public honour-system use without authentication`, `Dark purple liquid-glass visual direction`.

### Verification notes and important edge cases

- Test zero, one, two, three, and four locked profiles.
- Test the viewer as each of the four profiles.
- Reopen the currently viewed friend while their tab is open; the app should exit safely to the hub.
- Verify that a newly locked friend appears without requiring a full page reload when real-time support is implemented; a clear refresh action is an acceptable simpler fallback.
- Direct API access is outside the privacy promise. QA should judge only the approved normal-interface rule while confirming documentation does not claim security.
- Complete a manual production-like pass on iPhone Safari or equivalent, Android Chrome or equivalent, and desktop keyboard navigation where devices are available.

### Owner-only action required

**No ticket-specific action.** Keshav retains the normal factory review, merge, and production-publication gate.

---

## 6. Store and deliberately publish final actual results

### Ticket title

**[Feature] Store and deliberately publish final actual results**

### User-visible outcome

Participants see a stable `Results not published` state until Keshav has entered and reviewed the complete season outcomes, after which one explicit publication flag makes the approved results available for scoring together.

### Definition of done

- The actual-result data contract supports the final 1–20 table, all five cup winners, all ten categorical outcomes, both numeric outcomes, and both Arsenal–Chelsea scores.
- Subjective and officially shared categorical outcomes accept one or more normalized winners.
- The contract supports `No managerial departure` as an actual outcome.
- Actual results are stored separately from participant predictions.
- The default and partially populated state remains unpublished.
- When results are unpublished, no participant can see partial actuals or a partial score through the application.
- Keshav has concise documentation and validated examples for entering every outcome through the Supabase dashboard.
- Setting `Results published` with missing or malformed required actuals does not expose a misleading leaderboard; the app shows a safe administrator-data error.
- Setting a complete result set to published records or updates the result timestamp.
- Correcting a published actual updates the timestamp and makes the latest input available to downstream scoring.
- Published-result reads never expose privileged Supabase credentials.
- Automated tests cover incomplete, complete, shared-winner, no-manager-departure, void-category, malformed, corrected, and unpublished data.

### In scope

- Actual-result schema/contract and validation
- Result-publication flag and timestamp
- Manual Supabase data-entry documentation
- Shared outcome arrays
- Unpublished and invalid-published user states
- Data fixtures for scoring work

### Out of scope

- Polished in-app administrator form
- Participant voting on subjective categories
- Live football data or automatic result ingestion
- Partial in-season scoring
- Score calculations or leaderboard presentation
- Automatic database export

### Dependencies and relevant decisions

- Dependencies: Tickets 1 and 5.
- Product brief: `Outcome authorities and definitions`, `Results and recalculation`, `Data and privacy`.
- Decisions: `Keshav rules subjective categories and may name shared winners`, `Administration and backup remain manual`, `Results require explicit publication`.

### Verification notes and important edge cases

- Use one fixture with multiple Golden Boot winners and multiple administrator-entered subjective winners.
- Validate exact club sets in the actual table and reject duplicates/missing clubs.
- Confirm penalties are excluded from the entered Arsenal set-piece total and staff dismissals are excluded from Chelsea's red-card total through documentation.
- Test a category deliberately marked void and confirm it remains distinguishable from an accidentally missing result.
- Test correction after publication and preservation of locked predictions.

### Owner-only action required

**Yes.** Keshav must enter, verify, correct, and publish production actual results through Supabase. Those actions must never be performed autonomously by the factory.

---

## 7. Calculate and explain every participant's score

### Ticket title

**[Feature] Calculate and explain every participant's score**

### User-visible outcome

After results are published, each locked participant has a reproducible total and an expandable line-by-line explanation showing exactly why every point and bonus was awarded.

### Definition of done

- The scoring engine is a deterministic pure module that consumes a locked entry and validated actual results without modifying either.
- Table scoring awards 5/3/1/0 per club and the approved champion, top-five, all-five, relegation, and all-three bonuses, with a maximum of 135.
- Cup scoring awards 10/8/8/6/6 in the approved competition mapping, maximum 38.
- Each of categorical questions 1–10 awards 7 for matching any recognized actual winner, maximum 70.
- Each numeric question awards 7 to every closest nonblank participant and 3 more to every exact participant, maximum 10 per participant per question.
- Each Arsenal–Chelsea score awards 3 for correct result and 4 more for exact score, maximum 7 per match.
- Blank or skipped predictions score zero and are explained as such.
- Shared official or administrator outcomes award full points to every matching participant; points are not divided.
- Void categories award zero to everyone and are labelled void rather than incorrect.
- A skipped table scores zero without attempting table bonuses.
- A reopened/draft entry is excluded from published scoring.
- Each eligible participant's maximum possible total is 277, and section subtotals sum exactly to the displayed total.
- Correcting an actual result changes affected totals and explanations without changing predictions.
- Users can expand a participant score to see section totals, base table points, every table bonus, and every non-table category award.
- Comprehensive fixtures cover exact, near, far, blank, shared, tied-closest, all sweep bonuses, wrong match result, correct result, exact match, void, and corrected-result cases.

### In scope

- Pure TypeScript scoring implementation
- Normalized comparison helpers
- Section subtotals and detailed scoring explanation model
- Individual participant score view after publication
- Automatic recalculation from latest actuals
- Exhaustive unit and fixture tests

### Out of scope

- Leaderboard sorting or podium presentation
- Tie-breakers
- Partial unpublished scoring
- Storing calculated totals as authoritative database values
- Changing any approved scoring weight
- In-season scoring

### Dependencies and relevant decisions

- Dependencies: Tickets 4 and 6.
- Product brief: complete `Scoring` section.
- Decisions: `Scoring is balanced and transparent`, `Results require explicit publication`, `Partial entries may lock`.

### Verification notes and important edge cases

- Include a golden fixture where a participant earns all 277 points.
- Include top-five clubs in wrong internal order to confirm zone bonuses and base position points remain distinct.
- Include four equally close numeric predictions and multiple exact predictions.
- Include normalized manual text, accented names, and administrator-entered accepted variants.
- Property-check that no section exceeds its approved maximum and no result produces negative points.
- Compare visible scoring-rule copy against executable constants during QA.

### Owner-only action required

**No.** Use test fixtures during implementation. Production scoring appears only after Keshav performs the owner-only publication action from Ticket 6.

---

## 8. Present the final leaderboard and joint winners

### Ticket title

**[Feature] Present the final leaderboard and joint winners**

### User-visible outcome

After Keshav publishes results, the four friends can see the final ranking, celebrate the winner or joint winners, and expand any participant to audit their complete score.

### Definition of done

- When results are unpublished, the application does not show a ranked leaderboard.
- When results are published, eligible locked participants are ordered by total score from highest to lowest.
- The top three use a restrained podium treatment consistent with the liquid-glass design.
- If two or more participants share the highest total, every tied participant is labelled `Joint winner`; no hidden tie-break is applied.
- Lower-position ties share the same displayed rank using one documented ranking convention.
- Each participant card shows name, monogram, total, and section subtotals.
- Expanding a card shows the complete explanation produced by Ticket 7 without recalculating through a different formula.
- The leaderboard shows the latest results-update timestamp.
- Correcting a published result reorders and updates the leaderboard automatically on refresh or supported real-time update.
- A reopened participant is removed from the eligible ranking until relocked.
- The screen supports 360px mobile, desktop, keyboard navigation, visible focus, reduced motion, joint-winner announcements, and opaque glass fallback.
- Empty, invalid-published, and temporarily unavailable data show clear nonmisleading states.
- Automated tests cover four distinct scores, a two-way winning tie, a four-way tie, lower-rank ties, reopen/relock, correction reorder, and unavailable data.

### In scope

- Ranked four-card scoreboard
- Restrained top-three visual treatment
- Joint-winner behaviour
- Section subtotals and expandable detailed scoring
- Result timestamp
- Responsive and accessible final presentation
- Recalculation/refresh integration

### Out of scope

- Tie-breakers
- Historical leaderboards or previous seasons
- Charts, trends, live in-season movement, or statistics dashboard
- Social sharing, comments, reactions, or notifications
- Prizes, money, achievements, coins, or XP
- In-app actual-result editor

### Dependencies and relevant decisions

- Dependency: Ticket 7.
- Product brief: `Overall score and ties`, `Results and recalculation`.
- Design reference: `Leaderboard — post-launch`.
- Decisions: `Scoring is balanced and transparent`, `Results require explicit publication`, `Dark purple liquid-glass visual direction`.

### Verification notes and important edge cases

- Confirm a joint winner is not arbitrarily ordered as the sole champion even if the underlying sort is stable.
- Choose and test standard competition ranking for lower ties, for example `1, 2, 2, 4`; document it in visible/accessibility labels.
- Confirm expanded breakdown totals exactly match cards.
- Test long names and maximum three-digit scores at 360px.
- Confirm animations are brief and absent under reduced motion.

### Owner-only action required

**No ticket-specific action.** Production visibility still depends on Keshav's owner-only result publication and normal merge/deployment approval.

---

## Smallest build order for 21 August

If time is extremely constrained, preserve this order and do not start the next layer until the prior outcome works:

1. Ticket 1: deployable home, four profiles, and shared data connection.
2. Ticket 2: save real cup/question answers across devices.
3. Ticket 3: complete table prediction.
4. Ticket 4: review, scoring reference, and safe lock.
5. Ticket 5: rolling locked-to-locked reveal and final launch verification.

Within each ticket, prioritize data correctness and plain usable presentation before optional glass polish. Trophy illustrations, real-time updates, and elaborate lock motion are the first reversible cuts; shared saving, table accessibility, lock integrity, scoring copy, and reveal rules are not.
