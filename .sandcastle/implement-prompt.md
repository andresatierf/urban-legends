# TASK

Implement issue #{{TASK_ID}}: {{ISSUE_TITLE}}

You are on branch `{{BRANCH}}` inside an isolated git worktree. No other agents
are touching this worktree — commit freely.

Pull in the issue (and any parent PRD it references):

!`gh issue view {{TASK_ID}}`

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

Before committing, run and pass:

- `bun run typecheck`
- `bun run lint`
- `bun run format`
- `bun run test`

# COMMIT

Make a commit. The body must include `Closes #{{TASK_ID}}` so the PR auto-closes the issue on merge.

# PUSH AND OPEN A PR

After committing:

```
git push -u agent-origin {{BRANCH}}
gh pr create --head {{BRANCH}} --title "<short title>" --body "$(cat <<'EOF'
## Summary
<1-3 bullets describing what changed and why>

Closes #{{TASK_ID}}
EOF
)"
```

If you cannot complete the issue in this run (blocked, scope grew, prerequisite
missing, etc.):

1. Commit any meaningful progress with `Refs #{{TASK_ID}}` (NOT `Closes`).
2. Leave a comment: `gh issue comment {{TASK_ID}} --body "Progress: …  Remaining: …"`.
3. Do NOT open a PR.

# DONE

When the PR is open (or you've left progress notes for a partial), output the
completion signal exactly:

<promise>COMPLETE</promise>

# RULES

- Work on ONE issue: #{{TASK_ID}}.
- Do not modify other issues.
- Do not close the issue manually — let the PR's `Closes #N` handle it on merge.
