---
description: Implement a feature spec in a new git worktree
---

Implement a feature specification in an isolated git worktree (separate directory with its own branch), allowing parallel work without affecting the main repository.

## Process Overview

1. Parse spec argument
2. Read and analyze spec
3. Create worktree with development environment
4. Create implementation plan
5. Implement incrementally
6. Commit after each major section
7. Run quality checks
8. Create draft PR

## Step 1: Parse Spec Argument

- Full path (e.g., `specs/team-joining.md`): use directly
- Short name (e.g., `team-joining`): prepend `specs/` and append `.md`
- No argument: ask user which spec

## Step 2: Analyze Spec

Read spec to understand: feature name, schema changes, backend API, frontend components, user flows.

Provide brief summary of what will be implemented.

## Step 3: Create Worktree

```bash
bash -c '.claude/scripts/create-worktree-and-setup.sh [feature-name]'
```

Creates:

- Branch: `andre/feat/[feature-name]`
- Directory: `../urban-legends-[feature-name]`
- Unique ports (Next.js: 3000+offset, Convex: 3210+offset)
- 3-pane Zellij tab (editor, Next.js server, Convex server)

All work happens in worktree, not main repo.

## Step 4: Create Plan

Use TodoWrite with sections:

1. Database schema changes
2. Backend (mutations/queries)
3. Frontend components
4. Pages
5. Testing
6. Documentation

## Step 5: Implement

**Schema**: Update `convex/schema.ts`, run `bunx convex dev`

**Backend**: Implement in `convex/[entity].ts`, add auth/validation, follow patterns

**Frontend**: Create in `src/components/[feature]/`, use TanStack Form/Table, Convex hooks

**Pages**: Create in `src/app/(protected)/[route]/`, add permission checks

**Testing**: Test locally, verify edge cases, check permissions, ensure responsive

## Step 6: Commit

After each major section:

```bash
git add [files]
# Use SlashCommand tool with: "/commit"
```

Commit after: schema, backend, frontend, pages, fixes

## Step 7: Quality Checks

Run validation before creating PR:

```bash
bun --bun run check:fix  # CI checks (lint, format)
bun --bun run typecheck  # Type validation
coderabbit --prompt-only # Code review (let run to completion, never interrupt)
```

**Iterative process**:

1. Run checks
2. Fix issues (use TodoWrite to track)
3. Commit fixes: `git add [files]` → use `/commit`
4. Re-run until clean (typically 2-3 iterations)

**Acceptable to proceed**: No critical security issues, no bugs/logic errors, no major code quality issues

Summary when done:

```
✅ All checks passed: CI, TypeCheck, CodeRabbit
```

## Step 8: Create Draft PR

```bash
git push -u origin andre/feat/[feature-name]

gh pr create --draft --assignee "@me" \
  --title "feat: [descriptive title]" \
  --body "$(/usr/bin/cat <<'EOF'
## Summary
[Brief overview - 2-3 sentences]

## Changes
- Schema: [changes]
- Backend: [mutations/queries]
- Frontend: [components/pages]

## Testing
[Testing steps and URLs]

## Spec
Implements `specs/[spec-filename].md`
EOF
)"
```

## Step 9: Final Summary

Provide summary with:

```
🎉 Implementation Complete!

📋 PR: [URL] (Draft, assigned to @me)
🌳 Worktree: ../urban-legends-[feature-name]
🌿 Branch: andre/feat/[feature-name]
🔧 Ports: Next.js: [PORT], Convex: [PORT]
🌐 Test at: http://localhost:[PORT]

✅ Commits: [git log --oneline main..HEAD]
✅ Files modified: [summary]

🚀 Next Steps:
1. Test thoroughly at http://localhost:[PORT]
2. Review PR and mark "Ready for review" when satisfied
3. Clean up worktree after merge: git worktree remove ../urban-legends-[feature-name]
```

## Guidelines

**Do**: Work in worktree, follow spec, use existing patterns, commit incrementally, update todos, test continuously, let CodeRabbit complete, create draft PR, wrap bash with `bash -c`

**Don't**: Skip schema/validation/tests, implement beyond spec, skip permission checks, commit generated files, interrupt CodeRabbit
