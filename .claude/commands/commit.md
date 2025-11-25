---
description: Check staged files and commit with relevant message
tags:
  - git
  - workflow
---

# Smart Commit Command

Analyze currently staged files and create a commit with an appropriate, context-aware message.

## Task Overview

You need to:

1. **Check staged files**: Review what files are currently staged for commit
2. **Analyze changes**: Review the actual diff of staged changes
3. **Learn commit style**: Check recent commits to match the repository's commit message style
4. **Draft message**: Create an appropriate commit message based on the changes
5. **Create commit**: Execute the commit with the drafted message

## Step 1: Check Current Git State

Run the helper script to gather all necessary information:

```bash
.claude/scripts/get-commit-info.sh
```

This script provides:
- Git status and staged files
- Full diff of staged changes with statistics
- Recent commit messages for style reference
- Branch information
- File count summary
- Security check for sensitive files

## Step 2: Analyze the Changes

Based on the git diff output, determine:

- **Type of change**: Is this a feature, fix, refactor, docs, chore, etc.?
- **Scope**: Which part of the codebase is affected? (e.g., schema, backend, ui, pages, teams, auth)
- **Key changes**: What are the main modifications?
- **Impact**: Is this a breaking change, enhancement, bug fix, or routine update?

## Step 3: Draft Commit Message

Create a commit message following this structure:

```
<type>(<scope>): <brief description>

<detailed description if needed>
- List key changes
- Explain why the change was made
- Reference related issues/specs if applicable
```

**Commit types:**

- `feat`: New feature or functionality
- `fix`: Bug fix
- `refactor`: Code refactoring (no functionality change)
- `docs`: Documentation changes
- `style`: Code style/formatting changes
- `chore`: Maintenance tasks, dependency updates
- `test`: Adding or updating tests
- `perf`: Performance improvements

**Scope examples:**

- `schema`: Database schema changes
- `backend`: Convex mutations/queries
- `ui`: UI components
- `pages`: Page components
- `auth`: Authentication related
- `teams`: Team functionality
- `tournaments`: Tournament features
- `submissions`: Submission features
- `i18n`: Internationalization

## Step 4: Validate Before Committing

Before creating the commit:

1. **Check if there are actually staged changes** - If nothing is staged, inform the user
2. **Review the scope** - Ensure the changes are cohesive and belong in one commit
3. **Check for sensitive data** - Warn if files like `.env`, `credentials.json`, or similar are staged

## Step 5: Create the Commit

Use a heredoc to properly format the commit message. Use `git commit -F -` to read from stdin to avoid issues with bat or other pagers:

```bash
git commit -F - <<'EOF'
<type>(<scope>): <brief description>

<detailed description>
- Key change 1
- Key change 2
EOF
```

## Step 6: Verify Commit

After committing, run:

```bash
# Show the commit that was just created (disable pager to avoid bat formatting)
git --no-pager log -1 --pretty=format:"%h - %s%n%b" --stat
```

Display this to the user so they can verify the commit was created correctly.

## Important Guidelines

- **Follow repository patterns**: Match the style of recent commits in the repo
- **Be descriptive but concise**: The summary line should be clear but not overly long
- **Explain the "why"**: The body should explain why the change was made, not just what changed
- **Atomic commits**: If staged changes span multiple unrelated concerns, suggest splitting them
- **No empty commits**: Don't create a commit if nothing is staged
- **Security check**: Warn about potentially sensitive files being committed
- **Use HEREDOC**: Always use heredoc for multi-line commit messages to preserve formatting

## Error Handling

If you encounter issues:

- **Nothing staged**: Tell user no changes are staged and suggest using `git add` first
- **Merge conflicts**: Inform user they need to resolve conflicts before committing
- **Pre-commit hooks**: If hooks fail, show the error and let user decide next steps
- **Detached HEAD**: Warn user about the detached HEAD state

## Examples

### Example 1: Feature Addition

Staged files: `src/components/teams/TeamInviteButton.tsx`, `convex/teams.ts`

Commit message:

```
feat(teams): add team invitation functionality

Implement ability for team captains to invite users
- Add TeamInviteButton component with form
- Create inviteUserToTeam mutation in backend
- Add permission checks for captain role
```

### Example 2: Bug Fix

Staged files: `src/app/(all)/tournaments/[id]/page.tsx`

Commit message:

```
fix(tournaments): handle missing tournament data

Prevent crash when tournament ID is invalid
- Add null check before rendering tournament details
- Display user-friendly error message
- Redirect to tournaments list on 404
```

### Example 3: Documentation

Staged files: `README.md`, `docs/SETUP.md`

Commit message:

```
docs: update setup instructions for Convex deployment

Clarify steps for connecting Convex to production
- Add section on environment variables
- Include troubleshooting common issues
- Update screenshots for current UI
```

### Example 4: Refactoring

Staged files: Multiple files in `src/components/ui/`

Commit message:

```
refactor(ui): consolidate button variants

Reduce duplication in button component styles
- Merge primary and secondary button components
- Use CVA for variant management
- Update all usages across the app
```

## What NOT to Do

- Don't commit if nothing is staged
- Don't use vague messages like "update files" or "fix stuff"
- Don't skip the analysis phase - always review the actual changes
- Don't ignore the repository's existing commit style
- Don't create commits that mix unrelated changes
- Don't commit sensitive files without warning the user
- Don't use placeholders in commit messages - make them specific

## Success Criteria

A successful commit has:

- ✅ Clear, descriptive type and scope
- ✅ Summary line under 72 characters
- ✅ Detailed body explaining the "why"
- ✅ Proper formatting with heredoc
- ✅ Matches repository commit style
- ✅ All staged files are related to the commit message
- ✅ No sensitive data accidentally included

## Usage Example

```
User: /commit
```

