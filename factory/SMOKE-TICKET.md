# Factory smoke ticket

## Title

`[Smoke] Show the approved 2026/27 competition subtitle`

## User-visible outcome

A visitor opening the scaffolded home sees `2026/27 Football Prediction Competition` directly beneath `THE JERRY PREDICTIONS`.

## Definition of done

- The exact approved subtitle appears once beneath the product name.
- The title and subtitle have a logical accessible heading relationship.
- The subtitle remains readable without horizontal overflow at 360px.
- An automated test verifies the approved text is rendered.
- The standard test, lint, typecheck, and production-build commands pass.

## In scope

- Home subtitle markup
- Existing typography-token use
- One focused rendering test

## Out of scope

- Supabase
- Participant status data
- Profile selection
- Prediction entry
- New visual effects or layout restructuring

## Dependencies and decisions

- Dependency: completed local scaffold and baseline validation.
- Product brief: `Outcome and deadline`.
- Decisions: `Product name and public identity`.

## Verification notes

- Verify the exact `2026/27` punctuation and capitalization.
- Verify 360px and desktop widths.
- Confirm the smoke change does not introduce a second page-level heading.

## Owner-only action check

This ticket does not require a production action, new account, billing change, new secret, destructive or irreversible data operation, privacy-boundary change, infrastructure commitment, or product decision outside the Product Manager's delegated authority.
