# CONTEXT

The human has hand-picked a set of GitHub issues to work on in parallel. Each
issue you approve will be implemented by a separate agent in its own git
worktree and end as a pull request. There is **no automatic merge phase**, so
the batch must be safe to work concurrently.

Your job is to turn the selected issues into a ready-to-run plan:

1. **Generate a branch name** for each issue: `agent/{number}-{slug}`, where
   `{slug}` is a short kebab-case summary of the title (lowercase, words joined
   by hyphens, no leading/trailing hyphens, at most ~50 characters).
2. **Avoid conflicts.** If two selected issues obviously touch the same files or
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

# OUTPUT

Output your plan as a single JSON object wrapped in `<plan>` tags. `issues` is
the approved, conflict-free batch; `excluded` explains every issue you left out.

<plan>
{"issues": [{"id": "42", "title": "Fix auth bug", "branch": "agent/42-fix-auth-bug"}], "excluded": [{"id": "43", "reason": "touches the same auth module as #42; kept the higher-priority fix"}]}
</plan>

If every selected issue conflicts, output
`<plan>{"issues": [], "excluded": [ ... ]}</plan>`.
