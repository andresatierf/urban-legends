# CONTEXT

The human has hand-picked a set of GitHub issues to work on in parallel. Each
issue you approve will be implemented by a separate agent in its own git
worktree and end as a pull request. There is **no automatic merge phase**, so
the batch must be safe to work concurrently.

Your job is to turn the selected issues into a ready-to-run plan:

1. **Generate a branch name** for each issue: `agent/{number}-{slug}`, where
   `{slug}` is a short kebab-case summary of the title (lowercase, words joined
   by hyphens, no leading/trailing hyphens, at most ~50 characters).
2. **Check dependencies.** Each issue body may contain a `## Blocked by` section
   listing other issue numbers. An issue is **blocked** if any of its blockers
   is still open (appears in the open-numbers list below). Because everything in
   this batch runs in parallel with no merge step, a blocker that is another
   issue *in this same batch* still counts as open — exclude the dependent one.
3. **Avoid conflicts.** If two selected issues obviously touch the same files or
   modules, they'll collide at PR-review time. Keep the higher-priority one
   (critical fixes > infra > features > polish > refactors) and exclude the
   other.

Do not silently drop anything: every selected issue must appear either in
`issues` (approved) or in `excluded` (with a reason).

# DATA

Selected issues (with bodies):

<selected-issues>

{{SELECTED_ISSUES}}

</selected-issues>

All currently open issue numbers (used to evaluate blocking):

<open-numbers>

{{OPEN_NUMBERS}}

</open-numbers>

# OUTPUT

Output your plan as a single JSON object wrapped in `<plan>` tags. `issues` is
the approved, unblocked, conflict-free batch; `excluded` explains every issue
you left out.

<plan>
{"issues": [{"id": "42", "title": "Fix auth bug", "branch": "agent/42-fix-auth-bug"}], "excluded": [{"id": "43", "reason": "blocked by #40 (still open)"}]}
</plan>

If every selected issue is blocked or conflicting, output
`<plan>{"issues": [], "excluded": [ ... ]}</plan>`.
