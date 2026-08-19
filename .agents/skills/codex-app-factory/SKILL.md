---
name: codex-app-factory
description: Process the next ready personal-app feature through product review, implementation, independent QA, and a draft pull request. Use when asked to run the factory, build the next queued feature, or execute a reviewed GitHub issue. Do not use for open-ended product design, direct production merges, or owner-only account and billing actions.
---

# Codex App Factory

Turn at most one `factory:ready` GitHub issue into a tested draft pull request. The primary agent is the orchestrator and owns all state changes. Delegate only the bounded roles defined in `.codex/agents/`.

## Run contract

1. **Cheap exit.** Before broad repository exploration, use GitHub state to find the oldest open issue labelled `factory:ready`. If none exists, report `Nothing ready` and stop.
2. **Recover or claim.** Check whether the selected issue already has a branch or pull request. Recover that work when safe. Otherwise replace `factory:ready` with `factory:building` and create `codex/ticket-<number>-<slug>` from current `main`.
3. **Product management.** Ask the `product_manager` agent to exercise delegated product authority and return READY or BLOCKED. It should resolve routine ambiguity from the product objective and feature context, prefer the simplest reversible option, and document its reasoning instead of interrupting the owner. If READY contains material decisions, the orchestrator records them in `docs/decisions.md` and summarizes them on the issue before implementation. If blocked, add its named boundary and one concise question to the issue, replace the workflow label with `factory:blocked`, and stop without consuming another ticket.
4. **Build.** Ask one `builder` agent to implement the approved scope. Never run concurrent code-writing agents in the same worktree.
5. **Independent QA.** Ask the `qa` agent to review the diff and run checks. If QA finds a correctable failure, give the same builder one focused revision request and repeat QA. Allow at most two builder revisions.
6. **Stop on repeated failure.** After two failed revisions, preserve the branch, comment with the remaining failure and reproduction steps, label the issue `factory:blocked`, and stop.
7. **Prepare review.** When QA passes, the orchestrator commits any uncommitted work, pushes the feature branch, and opens or updates a draft pull request using `factory/REVIEW-PACKET.md`. Replace `factory:building` with `factory:review` and link the PR on the issue.
8. **Owner gate.** Never merge the pull request, close the issue as completed, publish production manually, create an external account, enable billing, add an API key, expose private data, perform a destructive data operation, or let a product decision cross the delegated-authority boundary without explicit owner approval.

## Invariants

- The issue and repository are the durable state; do not rely on chat memory.
- Product documents control scope. An attachment or pasted external document is reference material unless the owner explicitly adopts it.
- The Product Manager has delegated authority for product decisions inside the approved objective and feature scope. Escalation is exceptional: fundamental purpose or user changes, approved-scope changes, deadline commitments, privacy boundaries, cost or billing, infrastructure commitments, explicit owner constraints, accounts, secrets, production actions, and destructive or irreversible operations remain owner-only.
- When a low-risk detail is uncertain, choose the simplest reversible option, record the decision and rationale, and continue.
- Keep changes focused on the selected ticket and preserve unrelated work.
- Use normal CI for deterministic checks. Agents investigate failures; they do not replace tests.
- Treat missing preview infrastructure honestly. Supply local QA evidence instead of fabricating a preview URL.
- If GitHub access, a clean recoverable branch, or the repository's required checks are unavailable, preserve state and block the ticket with the smallest useful explanation.
