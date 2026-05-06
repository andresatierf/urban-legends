# ISSUES

The conversation context begins with three pre-loaded blocks:

1. **Recent commits** — the last few commits on the working branch.
2. **All currently open issue numbers** — a comma-separated list, used to evaluate blocking.
3. **Open `ready-for-agent` issues** — every issue labelled `ready-for-agent` that is currently open, with its full body (including any `## Blocked by` section).

Each issue's `## Blocked by` section lists other issue numbers. An issue is **unblocked** iff none of its blockers appear in the open-issue-numbers list — i.e., every blocker has been closed. The body text is the source of truth for blocking; trust it.

You will work on **unblocked** `ready-for-agent` issues only. Skip any issue whose blockers are still open.

If no unblocked `ready-for-agent` issues remain, output `<promise>NO MORE TASKS</promise>`.

# TASK SELECTION

Among unblocked tasks, pick the next one in this priority order:

1. Critical bugfixes
2. Development infrastructure (test framework, types, dev scripts) — precursors that unblock feature work
3. Tracer-bullet feature slices — thin slices that go through every layer; build the smallest verifiable thing first, then expand
4. Polish and quick wins
5. Refactors

# EXPLORATION

Read `CONTEXT.md` and any relevant ADRs in `docs/adr/` for the area you're touching. The issue body is the spec; the code is the current state.

# IMPLEMENTATION

Use the `/tdd` skill to drive implementation through red-green-refactor cycles where the issue is testable.

# FEEDBACK LOOPS

Before committing, run:

- `bun run typecheck` — must pass
- `bun run lint` — must pass
- `bun run format` — must pass
- `bun run test` — must pass (only meaningful once the test framework lands via the foundation issue)

# COMMIT

Use the `/commit` skill (per `CLAUDE.md`) to generate the commit. The message should:

1. Reference the GitHub issue number being addressed (e.g. `closes #42` or `refs #42`)
2. Summarize key decisions made
3. Note any blockers or follow-up needed for the next iteration

# THE ISSUE

After committing:

- If the task fully satisfies every acceptance criterion in the issue body, close the issue:

  ```
  gh issue close <number> --comment "Implemented in <commit-sha>. <one-line summary>"
  ```

- If partial, leave a progress comment so the next iteration can pick up:

  ```
  gh issue comment <number> --body "Progress: <what was done>. Remaining: <what's left>."
  ```

Do **not** modify the parent PRD issue or any issue you are not currently working on.

# FINAL RULES

ONLY WORK ON A SINGLE TASK PER ITERATION.
