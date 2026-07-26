# Explorer Agent Workspace

This directory holds durable local context for work that may continue in a
later agent thread. It is a handoff workspace, not a second source tree and not
a substitute for the current repository state.

When a user asks you to read or continue an `_agent` task, start here, then read
`index.md` and the named task file. Verify every claim against the current code,
diff, and Git state before acting.

## Repository Sources of Truth

Read only what the task needs, but use these files as the authority for their
areas:

- `AGENTS.md` — repository workflow, coding style, and validation requirements.
- `ARCHITECTURE.md` — backend/UI ownership and import direction.
- `STYLING.md` — UI vocabulary, CSS ownership, and token rules.
- `main.ts` and `src/` — current implementation; these override stale agent
  notes.
- `git status` and the current diff — current worktree ownership and scope.

Do not edit generated `main.js` or `styles.css` directly.

## What Belongs Here

Create a note when another thread will need one of these:

- a bounded implementation task;
- an architecture decision or unresolved design question;
- code-review findings with file/line evidence;
- a handoff describing completed, remaining, and blocked work;
- validation results that matter to a later decision.

Keep quick answers, raw terminal dumps, scratch work, and duplicated project
documentation out of this directory. Summarize evidence and link to the real
files instead.

An `_agent` task records intent; it does not authorize implementation by itself.
A future agent should edit project files only when the current user request asks
it to execute or continue that task.

## File Naming and Status

Use a flat directory with numbered, lowercase, hyphenated Markdown names:

```text
_01-explorer-api.md
01-explorer-api.md
```

The number keeps related work in a stable order in the file explorer. Dates
belong in frontmatter, not filenames. Prefix unfinished or active tasks with
`_` so they sort first. Remove the `_` when the task is complete, retain its
number, then update `index.md`. Gaps in numbering are fine. Use frontmatter:

```yaml
---
date: 2026-07-19
status: proposed # proposed | in-progress | blocked | complete | superseded
kind: architecture # review | architecture | implementation | handoff
scope: short description
---
```

## Task Note Requirements

A useful task note should contain only the sections that matter, normally:

1. **Outcome** — the desired end state in one paragraph.
2. **Current state** — verified files, callers, and behavior.
3. **Decisions** — agreed choices that should not be reopened casually.
4. **Scope** — files or behavior in scope and explicit no-touch boundaries.
5. **Work** — ordered implementation or review steps.
6. **Acceptance** — observable conditions for completion.
7. **Validation** — commands and any required manual Obsidian checks.
8. **Handoff** — what changed, what remains, and exact blockers.

Prefer links to repository files over copied code. Record exact commands only
when they are important for reproducing a result.

## Explorer-Specific Rules

- Start from live callers and actual data flow. Do not preserve a layer only
  because it might be useful later.
- Prefer deletion, direct naming, and narrow behavior-shaped contracts over
  generic services, registries, or speculative extension points.
- Keep React UI explicit and readable. Do not replace clear render branches
  with clever generic configuration.
- Host registration and DOM discovery belong in `src/explorer/integration/`.
- UI data crosses through `ExplorerModel`; UI behavior should cross through the
  agreed action/API boundary rather than importing vault or navigation helpers
  directly.
- Classes are appropriate for Obsidian inheritance and genuine state/lifecycle.
  Prefer functions and plain types for stateless operations.
- Preserve unrelated user changes. Do not clean or rewrite files outside the
  named task merely because they look improvable.

## Review and Implementation Boundaries

For a review-only task, inspect and report; do not modify project code. It is
fine to create or update the requested `_agent` review note.

For an implementation task:

- reread the relevant current files before editing;
- keep the patch bounded to the task;
- add focused regression tests for changed pure behavior;
- record intentional user-visible behavior changes;
- run all repository gates before handoff:

```sh
npm run lint
npm run lint:css
npm run build
npm run test
```

Interactive UI or host-DOM changes also require a short manual Obsidian check;
record what was and was not verified.

## index.md

Keep `index.md` as a small map, not a report. Group notes by status and give
each one a single-line description. Update it when a note is created, renamed,
completed, blocked, or superseded.

## Git Policy

`README.md` is the shared protocol and may be committed. Other `_agent` notes
are local by default, including `index.md`, unless the user explicitly chooses
to share one.
