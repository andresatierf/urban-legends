# TASK

Implement issue #{{TASK_ID}}: {{ISSUE_TITLE}}

You are on branch `{{BRANCH}}` inside an isolated git worktree. No other agents
are touching this worktree — commit freely.

Pull in the issue, its comments (triage notes, agent briefs, clarifications),
and any parent PRD it references:

!`gh issue view {{TASK_ID}} --comments`

# CONTEXT

Recent commits on the base branch:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXPLORATION

Read `CONTEXT.md` and any relevant ADRs in `docs/adr/` for the area you're
touching. The issue body is the spec; the code is the current state. Pay extra
attention to test files near the relevant code.

# IMPLEMENTATION

Use the `/tdd` skill to drive implementation through red-green-refactor cycles
where the issue is testable.

# FEEDBACK LOOPS

A `lefthook` pre-commit hook runs `oxlint`, `oxfmt`, and `tsc` on staged files —
don't re-run those manually. If the hook fails, fix the underlying issue and
re-stage; never bypass with `--no-verify`.

Tests are NOT in the pre-commit hook. If the issue is testable, run
`bun run test` yourself before opening the PR.

# COMMIT

Group changes into logical commits — one commit per coherent unit of work
(e.g. schema change, then the query using it, then the UI consuming it). A
single squashable commit is fine for small issues; for anything bigger, split
so each commit tells a self-contained story and could in principle be reverted
on its own.

The PR body (not every commit) must include `Closes #{{TASK_ID}}` so the PR
auto-closes the issue on merge.

# PUSH AND OPEN A PR

Only after the issue is fully implemented and tests pass:

```
git push agent-origin {{BRANCH}}
gh pr create --head {{BRANCH}} --title "<short title>" --body "$(cat <<'EOF'
## Summary
<1-3 bullets describing what changed and why>

Closes #{{TASK_ID}}
EOF
)"
```

Push goes through `agent-origin` (the only remote the container is
authenticated against), but the branch's upstream config is set to `origin` so
the human's clone tracks the branch against their normal remote. Never use
`git push -u agent-origin` — `-u` would pin upstream to `agent-origin`.

# PARTIAL PROGRESS

If you cannot complete the issue in this run (blocked, scope grew, prerequisite
missing, etc.):

1. Commit any meaningful progress with `Refs #{{TASK_ID}}` (NOT `Closes`).
2. Push the branch: `git push agent-origin {{BRANCH}}`.
3. Leave a comment: `gh issue comment {{TASK_ID}} --body "Progress: …  Remaining: …"`.
4. Do NOT open a PR.
5. Do NOT output the completion signal below — the work is not done.

# DONE

Only output the completion signal when the PR is open AND the work is actually
finished (issue acceptance criteria met, tests pass, no known follow-ups owed
to this issue). A partial run, a PR opened on incomplete work, or unresolved
TODOs in the diff all mean the work is NOT done — skip the signal.

When (and only when) the work is truly complete, output exactly:

<promise>COMPLETE</promise>

# RULES

- Work on ONE issue: #{{TASK_ID}}.
- Do not modify other issues.
- Do not close the issue manually — let the PR's `Closes #N` handle it on merge.
