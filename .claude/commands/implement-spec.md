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

## Step 3: Create Git Worktree and Setup Environment

Run the setup script to create the worktree and Zellij environment in one step:

```bash
bash -c '.claude/scripts/create-worktree-and-setup.sh [feature-name]'
```

This script will:

1. **Create Git Worktree:**

   - Branch format: `andre/feat/[feature-name]`
   - Worktree directory: `../urban-legends-[feature-name]`
   - Copy `.env` file to worktree
   - Install dependencies with `bun install`

2. **Setup Zellij Environment:**
   - Calculate unique ports based on feature name (to avoid conflicts)
   - Create a Zellij tab with three panes
   - Start both development servers with custom ports
   - Open nvim in the editor pane

**Port Assignment:**

- Ports are calculated from the feature name hash (0-99 offset)
- Next.js: 3000 + offset
- Convex: 3210 + offset
- Example: `team-joining` → Next.js: 3084, Convex: 3294

**Zellij Layout:**

- **Left pane**: Code editor workspace (nvim, where Claude will work)
- **Upper-right pane**: Next.js dev server on custom port
- **Lower-right pane**: Convex backend on custom port

**Important:**

- All subsequent work will be done in the worktree directory, not the main repository
- Each feature gets unique ports so you can work on multiple features simultaneously
- The script will detect if the worktree already exists and prompt to continue

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

After implementing each major section (schema, backend, frontend), use the SlashCommand tool to execute the `/commit` command:

```
Use SlashCommand tool with command: "/commit"
```

**When to commit:**

- After implementing schema changes
- After completing backend mutations/queries
- After creating frontend components
- After integrating features into pages
- After fixing validation issues from Step 7

**Important:**
- Use the SlashCommand tool to invoke `/commit` - don't manually run git commands
- The `/commit` command analyzes staged changes, matches repository commit style, and creates well-formatted commits automatically
- Stage files with `git add` before running `/commit`
- Create atomic commits for logical sections of work

## Step 7: Run Quality Checks and Validation

Before finishing, validate the implementation with comprehensive checks:

### 7.1: Run CI Checks

Run the full CI suite to catch any issues:

```bash
bun --bun run check:fix
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

### 7.3: CodeRabbit AI Review (Iterative)

Use the CodeRabbit CLI to get AI-powered code review and iterate until all issues are resolved:

```bash
# Review all changes against main branch
coderabbit --prompt-only
```

**IMPORTANT: Let CodeRabbit run to completion!**

- CodeRabbit may take several minutes to analyze all changes
- **NEVER kill or interrupt the coderabbit process** - let it run until it finishes naturally
- Wait for the full analysis to complete before proceeding
- The tool will exit on its own when finished

**Iterative Review Process:**

This is an iterative process. You must repeat these steps until CodeRabbit reports no significant issues:

1. **Run CodeRabbit Review**

   - Execute `coderabbit --prompt-only`
   - Wait for completion (never interrupt)
   - Capture all suggestions and issues

2. **Analyze Feedback**

   - Read ALL suggestions carefully
   - Categorize issues by severity (critical, important, minor)
   - Create todos for each significant issue using TodoWrite
   - If no significant issues found, proceed to next validation step

3. **Fix Issues Systematically**

   - Address each issue one by one
   - Stage fixes with `git add` then use SlashCommand tool with `/commit` for each fix or group of related fixes
   - The `/commit` command will create appropriate fix messages based on the changes

4. **Re-run CodeRabbit**

   - After fixing all issues, run `coderabbit --prompt-only` again
   - This verifies that fixes are correct and no new issues were introduced
   - Wait for completion

5. **Repeat Until Clean**
   - If new issues are found, return to step 2
   - Continue this cycle until CodeRabbit gives minimal/acceptable feedback
   - Typically 2-3 iterations are sufficient
   - Maximum 5 iterations (if more needed, reassess approach)

**What constitutes "acceptable" feedback:**

- No critical security vulnerabilities
- No potential bugs or logic errors
- No significant code quality issues
- Minor style preferences are acceptable to ignore if consistent with codebase
- Documentation suggestions can be addressed in follow-up if extensive

**CodeRabbit checks for:**

- Code quality issues
- Potential bugs
- Security vulnerabilities
- Performance concerns
- Best practice violations
- Documentation gaps
- Inconsistencies with codebase patterns

**Tracking Progress:**

Use TodoWrite to track the iteration:

```
- Run CodeRabbit review (iteration 1)
- Fix CodeRabbit issues (iteration 1)
- Run CodeRabbit review (iteration 2)
- Fix CodeRabbit issues (iteration 2)
...
```

Mark each iteration as completed only when that cycle is fully done.

**Note:** If CodeRabbit identifies issues, treat them seriously. Address each one or document in code comments why it can be safely ignored (with clear reasoning).

### 7.4: Fix Any Issues

If any validation step fails:

1. **Add issues to todo list** - Use TodoWrite to track each issue
2. **Fix systematically** - Address each issue one by one
3. **Commit fixes** - Stage changes with `git add`, then use SlashCommand tool with `/commit`
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

## Step 8: Create Draft Pull Request

After all validation passes, create a draft PR automatically:

### 8.1: Push Branch to Remote

First, ensure the branch is pushed to the remote:

```bash
# Check if remote branch exists
git remote -v

# Push branch to origin with upstream tracking
git push -u origin andre/feat/[feature-name]
```

### 8.2: Generate PR Description

Analyze all commits in the branch to create a comprehensive PR description:

```bash
# View all commits for context
git log --oneline main..HEAD

# View detailed changes
git diff --stat main..HEAD
```

Create a PR description that includes:

1. **Summary section** - Brief overview of the feature (2-3 sentences)
2. **Changes section** - Organized list of what was implemented:
   - Schema changes (if any)
   - Backend mutations and queries added
   - Frontend components created
   - Pages added/modified
3. **Testing section** - How to test the feature
4. **Spec reference** - Link to the spec file that was implemented

**Format:**

```markdown
## Summary

[Brief overview of the feature and what problem it solves]

## Changes

### Schema

- [List schema changes]

### Backend

- [List new mutations]
- [List new queries]

### Frontend

- [List new components]
- [List modified/new pages]

## Testing

1. [Step-by-step testing instructions]
2. [Include URLs to test]
3. [Edge cases to verify]

## Spec

Implements `specs/[spec-filename].md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 8.3: Create Draft PR

Use `gh` CLI to create a draft PR assigned to the user:

```bash
# Create draft PR with description
gh pr create \
  --draft \
  --assignee "@me" \
  --title "feat: [descriptive title based on feature]" \
  --body "$(/usr/bin/cat <<'EOF'
[Your generated PR description here]
EOF
)"
```

**Important:**

- Use `--draft` flag to create as draft PR
- Use `--assignee "@me"` to assign to the current user
- Title should start with `feat:` and clearly describe the feature
- Include all relevant sections in the body

### 8.4: Capture PR URL

After creating the PR:

- Save the PR URL from the command output
- Include it in the final summary for easy access
- Inform user that PR is created as draft and assigned to them

Example output:

```
✅ Draft PR created: https://github.com/owner/repo/pull/123
   - Status: Draft
   - Assigned to: @me
   - Ready for review when you mark it as ready
```

## Step 9: Final Summary

Provide a comprehensive summary in this order:

### 9.1: Pull Request Information

**Display the PR details prominently:**

```
🎉 Implementation Complete!

📋 Pull Request: [PR URL from Step 8.4]
   - Status: Draft
   - Assigned to: @me
   - Branch: andre/feat/[feature-name]
   - Ready to mark as "Ready for review" when you're satisfied
```

### 9.2: Implementation Summary

Provide details on:

- What was implemented (feature overview)
- Which files were created/modified
- Any remaining TODOs or future enhancements noted during implementation

Show the commit history:

```bash
git log --oneline main..HEAD
```

### 9.3: Testing Instructions

Explain how to test the feature:

1. Access the feature at the provided URL
2. Key user flows to test
3. Edge cases to verify
4. Admin features to test (if applicable)

### 9.4: Worktree Information

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

### 9.5: Next Steps

Tell the user what to do next:

```
🚀 Next Steps:

1. Test the feature thoroughly at http://localhost:[NEXT_PORT]
2. Review the PR description and make any updates if needed
3. When satisfied, mark the PR as "Ready for review":
   - Visit the PR URL
   - Click "Ready for review" button
   - Request reviewers if needed
4. Address any review feedback
5. Merge when approved
6. Clean up the worktree after merging

The draft PR is assigned to you and ready for your review!
```

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
- **Let CodeRabbit complete** - Never interrupt or kill the coderabbit process; wait for natural completion
- **Create draft PR** - Always create a draft PR assigned to @me after validation passes
- **Bash** - always wrap bash commands with `bash -c`

## What NOT to Do

- Don't skip schema changes if specified
- Don't implement features not in the spec (stick to MVP)
- Don't create generic/placeholder code - implement fully
- Don't skip permission checks
- Don't forget to update the TodoWrite list
- Don't make breaking changes to existing features
- Don't commit generated files (convex/\_generated/)
- Don't skip validation steps (CI, typecheck, CodeRabbit)
- Don't interrupt or kill the CodeRabbit process - let it finish naturally
- Don't run CodeRabbit just once - iterate until issues are resolved
- Don't ignore CodeRabbit feedback - fix issues or document why they're safe to ignore
- Don't forget to create the draft PR after validation

## When Complete

Tell the user:

1. The worktree location (full path)
2. The branch name created
3. Summary of what was implemented
4. **The PR URL** - Draft PR is automatically created and assigned to @me
5. How to test the feature in the worktree
6. How to mark the PR as ready for review when satisfied
7. How to clean up the worktree when done
8. Any dependencies (e.g., "run `bunx convex dev` to apply schema changes")
9. Reminder that the main repository is unchanged and they can continue working there

## Example Usage

User runs: `/implement-spec team-joining`

You would:

1. Read `specs/team-joining.md` from main repository
2. Run the setup script: `bash -c '.claude/scripts/create-worktree-and-setup.sh team-joining'`
   - Creates worktree at `../urban-legends-team-joining` with branch `andre/feat/team-joining`
   - Copies `.env` and installs dependencies
   - Calculates ports: Next.js → 3084, Convex → 3294
   - Creates 3-pane Zellij tab named "team-joining"
   - Starts both servers on unique ports in the right panes
   - Opens nvim in the left pane
3. Change directory to worktree: `cd ../urban-legends-team-joining`
4. Create task list with ~15-20 tasks
5. Implement schema changes (teamInvitations, joinRequests tables)
6. Stage changes: `git add convex/schema.ts` → Use SlashCommand tool with `/commit`
7. Implement backend mutations (requestToJoin, approveJoinRequest, etc.)
8. Stage changes: `git add convex/teams.ts` → Use SlashCommand tool with `/commit`
9. Create UI components (JoinTeamButton, JoinRequestsList, etc.)
10. Stage changes: `git add src/components/teams/*` → Use SlashCommand tool with `/commit`
11. Update pages to integrate new features
12. Stage changes: `git add src/app/(all)/teams/*` → Use SlashCommand tool with `/commit`
13. Run validation checks:
    - Run `bun --bun run ci` and fix any issues
    - Run `bun --bun run typecheck` and fix type errors
    - Run `coderabbit --prompt-only` (iteration 1)
    - Wait for CodeRabbit to complete (never interrupt it)
    - Fix issues, stage with `git add`, then use SlashCommand tool with `/commit`
    - Run `coderabbit --prompt-only` (iteration 2)
    - Continue iterating until no significant issues remain
    - Commit final fixes if needed using SlashCommand tool with `/commit`
14. Push branch to remote: `git push -u origin andre/feat/team-joining`
15. Create draft PR with `gh pr create --draft --assignee "@me"`
16. Provide summary with:
    - PR URL (draft, assigned to user)
    - Worktree location and ports
    - Testing instructions
    - Cleanup instructions

The main repository remains on the `main` branch, allowing the user to continue working there while the feature is implemented in the worktree. Each feature gets unique ports (based on name hash) so multiple features can run simultaneously without conflicts. A draft PR is automatically created and assigned to the user for review.
