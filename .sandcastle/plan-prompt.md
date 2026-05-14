# CONTEXT

You are picking unblocked GitHub issues for a parallel batch of agents. Each
picked issue will be implemented by a separate agent in its own git worktree
and end as a pull request. There is **no automatic merge phase** — picked
issues should be safe to work in parallel without conflicting at PR-review time.

# DATA

Recent commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

All currently open issue numbers (used to evaluate blocking):

<open-numbers>

!`gh issue list --state open --limit 200 --json number --jq '[.[].number | tostring] | join(", ")'`

</open-numbers>

Issues in the **Todo** column of the "Team Planning" project, with bodies:

<ready-issues>

!`gh project item-list 2 --owner andresatierf --format json --limit 500 --jq '.items[] | select(.status=="Todo" and .content.type=="Issue") | "## Issue #\(.content.number): \(.content.title)\nLabels: \(.labels | join(", "))\n\n\(.content.body)\n\n---\n"'`

</ready-issues>

# BLOCKING RULES

Each issue body may contain a `## Blocked by` section listing other issue
numbers. An issue is **unblocked** if none of its blockers appear in the
open-numbers list (i.e., every blocker has been closed). The body text is the
source of truth — trust it. Skip any issue whose blockers are still open.

# TASK SELECTION PRIORITY

Among unblocked issues, prefer in this order:

1. Critical bug fixes
2. Development infrastructure (test framework, types, dev scripts) — precursors
   that unblock feature work
3. Tracer-bullet feature slices — thin slices that go through every layer
4. Polish and quick wins
5. Refactors

# CONFLICT AVOIDANCE

Do **not** include two issues that obviously touch the same files or modules in
the same batch — they'll conflict at PR-review time. If two unblocked issues
overlap, pick the higher-priority one and leave the other for the next run.

# OUTPUT

Output your plan as a JSON object wrapped in `<plan>` tags. Branch format:
`agent/{id}-{kebab-slug}`.

<plan>
{"issues": [{"id": "42", "title": "Fix auth bug", "branch": "agent/42-fix-auth-bug"}]}
</plan>

If no unblocked issues remain, output `<plan>{"issues": []}</plan>`.
