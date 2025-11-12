---
description: Implement a feature spec in a new git worktree
---

You are implementing a feature specification in a new git worktree (separate directory with its own branch). This allows the user to continue working in their main repository while you implement the feature in parallel. Follow these steps carefully:

## Step 1: Parse the Spec Argument

The user will provide a spec file path as an argument. Extract it from the command:

- If argument is a full path (e.g., `specs/team-joining.md`), use it directly
- If argument is a short name (e.g., `team-joining`), prepend `specs/` and append `.md`
- If no argument provided, ask the user which spec to implement

## Step 2: Read and Analyze the Spec

Read the spec file to understand:

- The feature name and priority
- Database schema changes required
- Backend mutations and queries needed
- Frontend components to build
- User flows and requirements

Provide a brief summary of what will be implemented.

## Step 3: Create Git Worktree

Create a new git worktree in a separate directory so the user can continue working on their main code:

- Extract feature name from spec filename
- Use branch format: `andre/feat/[feature-name]`
- Create worktree in parent directory: `../urban-legends-[feature-name]`
- Example: `../urban-legends-team-joining` with branch `andre/feat/team-joining`

Commands:

```bash
# Create worktree with new branch
git worktree add ../urban-legends-[feature-name] -b andre/feat/[feature-name]

# Copy .env file to worktree
cp .env ../urban-legends-[feature-name]/.env

# Install dependencies
cd ../urban-legends-[feature-name] && bun install

# Verify setup
pwd
git status
git branch --show-current
```

**Important:** All subsequent work will be done in the worktree directory, not the main repository.

## Step 3.5: Set Up Zellij Environment

After creating the worktree, use the `/zellij-spec` command to set up the development environment:

```
/zellij-spec [feature-name]
```

This will:

- Create a Zellij tab with three panes
- Calculate unique ports based on feature name (to avoid conflicts with other features)
- Start both development servers with custom ports

The three panes will be:

- **Left pane**: Code editor workspace (where Claude will work)
- **Upper-right pane**: Next.js dev server on custom port
- **Lower-right pane**: Convex backend on custom port

**Note:** Each feature gets unique ports so you can work on multiple features simultaneously without port conflicts.

## Step 4: Create Implementation Plan

Based on the spec, create a TodoWrite task list with these sections:

1. Database schema changes (if any)
2. Backend implementation (mutations and queries)
3. Frontend components
4. Page modifications/new pages
5. Testing
6. Documentation updates

Use the TodoWrite tool to create this task list.

## Step 5: Implement Step by Step

Work through each task systematically:

### Database Schema Changes

- Update `convex/schema.ts` with new tables/fields
- Follow the schema changes specified in the spec
- Run `bunx convex dev` to apply changes (remind user if needed)

### Backend Implementation

- Implement mutations in appropriate files (`convex/[entity].ts`)
- Implement queries
- Add permission checks (admin/captain/user)
- Add validation logic
- Follow patterns from existing code

### Frontend Components

- Create new components in `src/components/[feature]/`
- Use existing UI components from `src/components/ui/`
- Follow TanStack Form patterns for forms
- Follow TanStack Table patterns for data tables
- Use Convex hooks (useQuery, useMutation)

### Pages

- Create new pages in `src/app/(all)/[route]/`
- Modify existing pages as needed
- Add proper permission checks
- Follow Next.js 15 App Router patterns

### Testing

- Test functionality locally
- Verify edge cases from spec
- Check permissions work correctly
- Ensure UI is responsive

## Step 6: Commit Changes

After implementing each major section (schema, backend, frontend):

- Review changes with `git status` and `git diff`
- Stage relevant files
- Create descriptive commits following this format:

```
feat([scope]): [brief description]

[Detailed description of what was implemented]
- List key changes
- Reference spec file if helpful

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Example scopes: `schema`, `backend`, `ui`, `pages`, `teams`, `leaderboard`

## Step 7: Run Quality Checks and Validation

Before finishing, validate the implementation with comprehensive checks:

### 7.1: Run CI Checks

Run the full CI suite to catch any issues:

```bash
bun --bun run ci
```

This runs all CI checks including linting, formatting, and type checking.

**If CI fails:**

- Read the error output carefully
- Fix each issue systematically
- Re-run `bun --bun run ci` until it passes
- Do NOT proceed until CI is green

### 7.2: Run Type Checking

Run TypeScript type checking to catch type errors:

```bash
bun --bun run typecheck
```

**If typecheck fails:**

- Review type errors in the output
- Fix type issues (avoid using `any` or non-null assertions)
- Re-run `bun --bun run typecheck` until clean
- Do NOT proceed until typecheck passes

### 7.3: CodeRabbit AI Review

Use the CodeRabbit CLI to get AI-powered code review:

```bash
# Review all changes against main branch
coderabbit --prompt-only
```

**If CodeRabbit suggests improvements:**

- Review the suggestions carefully
- Create todos for each significant issue using TodoWrite
- Fix issues systematically
- Re-run `coderabbit review --base main` after fixes
- Continue until CodeRabbit feedback is minimal/acceptable

**CodeRabbit checks for:**

- Code quality issues
- Potential bugs
- Security vulnerabilities
- Performance concerns
- Best practice violations
- Documentation gaps

### 7.4: Fix Any Issues

If any validation step fails:

1. **Add issues to todo list** - Use TodoWrite to track each issue
2. **Fix systematically** - Address each issue one by one
3. **Commit fixes** - Make atomic commits for fixes
4. **Re-run validation** - Ensure all checks pass

### 7.5: Final Validation Summary

Once all checks pass, provide a summary:

```
✅ All validation checks passed:
- CI: Passing (lint, format, build)
- TypeCheck: No errors
- CodeRabbit: Reviewed and issues addressed

Implementation is ready for PR creation.
```

## Step 8: Final Summary

Provide a summary of:

- What was implemented
- Which files were created/modified
- Any remaining TODOs or future enhancements
- How to test the feature
- Worktree location and how to access it
- How to clean up the worktree when done
- Next steps (create PR, merge, etc.)

Show the git log:

```bash
git log main..HEAD --oneline
```

**Worktree Information:**

Tell the user:

```
Worktree location: /home/andre/dev/urban-legends-[feature-name]
Branch: andre/feat/[feature-name]
Zellij tab: "[feature-name]" with 3-pane layout

The Zellij tab is already running:
- Left pane: Code workspace (current)
- Upper-right: Next.js dev server (http://localhost:[NEXT_PORT])
- Lower-right: Convex backend (http://localhost:[CONVEX_PORT])

Ports assigned (based on feature name hash):
- Next.js: [NEXT_PORT]
- Convex: [CONVEX_PORT]

Access your feature at: http://localhost:[NEXT_PORT]

You can switch to the Zellij tab to view the running servers.
Each feature runs on unique ports to avoid conflicts.

To clean up after merging:
1. Close the Zellij tab (or kill the running processes)
2. git worktree remove ../urban-legends-[feature-name]

The main repository at /home/andre/dev/urban-legends is unchanged.
```

**Important:** Replace `[NEXT_PORT]` and `[CONVEX_PORT]` with actual port numbers calculated during setup.

## Important Guidelines

- **Work in the worktree** - All file operations happen in the worktree directory, not the main repo
- **Follow the spec closely** - Don't deviate unless you find an issue
- **Use existing patterns** - Match the codebase's coding style
- **Ask questions** - If the spec is unclear, ask the user before implementing
- **Incremental commits** - Commit after each logical section
- **Update todos** - Mark tasks as completed as you go
- **Test as you build** - Don't wait until the end to test
- **Handle errors gracefully** - Add proper error handling and validation
- **Consider edge cases** - The spec lists many edge cases; handle them
- **Remember the path** - You're working in `../urban-legends-[feature-name]`, not the original repo

## What NOT to Do

- Don't skip schema changes if specified
- Don't implement features not in the spec (stick to MVP)
- Don't create generic/placeholder code - implement fully
- Don't skip permission checks
- Don't forget to update the TodoWrite list
- Don't make breaking changes to existing features
- Don't commit generated files (convex/\_generated/)

## When Complete

Tell the user:

1. The worktree location (full path)
2. The branch name created
3. Summary of what was implemented
4. How to test the feature in the worktree
5. How to create a PR from the worktree branch
6. How to clean up the worktree when done
7. Any dependencies (e.g., "run `bunx convex dev` to apply schema changes")
8. Reminder that the main repository is unchanged and they can continue working there

## Example Usage

User runs: `/implement-spec team-joining`

You would:

1. Read `specs/team-joining.md` from main repository
2. Create worktree at `../urban-legends-team-joining` with branch `andre/feat/team-joining`
3. Run `/zellij-spec team-joining` to set up environment
   - Calculates ports: Next.js → 3084, Convex → 3294
   - Creates 3-pane Zellij tab
   - Starts both servers on unique ports
4. Change directory to worktree: `cd ../urban-legends-team-joining`
5. Create task list with ~15-20 tasks
6. Implement schema changes (teamInvitations, joinRequests tables)
7. Commit: "feat(schema): add team invitation and join request tables"
8. Implement backend mutations (requestToJoin, approveJoinRequest, etc.)
9. Commit: "feat(backend): implement team joining mutations"
10. Create UI components (JoinTeamButton, JoinRequestsList, etc.)
11. Commit: "feat(ui): add team joining components"
12. Update pages to integrate new features
13. Commit: "feat(pages): integrate team joining UI"
14. Run linting and formatting
15. Provide summary with worktree location, ports, and cleanup instructions

The main repository remains on the `main` branch, allowing the user to continue working there while the feature is implemented in the worktree. Each feature gets unique ports (based on name hash) so multiple features can run simultaneously without conflicts.
