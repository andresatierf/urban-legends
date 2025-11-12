---
description: Fetch PR review comments and fix them systematically
---

You are helping the user address review comments on a pull request. This command fetches PR review comments using the GitHub CLI and systematically fixes each issue.

## Step 1: Parse the PR Argument

The user will provide a PR number as an argument:

- If argument is a number (e.g., `123`), use it as the PR number
- If argument is a PR URL (e.g., `https://github.com/owner/repo/pull/123`), extract the PR number
- If no argument provided, list open PRs and ask which one to work on

## Step 2: Fetch PR Information

Get the PR details and review comments:

```bash
# Get PR details
gh pr view [PR_NUMBER] --json title,state,author,headRefName,reviews,comments

# Get review comments (code-level comments)
gh pr view [PR_NUMBER] --json reviewThreads

# Get general PR comments
gh pr view [PR_NUMBER] --json comments
```

**Important:** Review comments come in different types:
- **Review threads**: Code-level comments on specific lines/files
- **General comments**: Overall PR feedback
- **Review summaries**: Approve/Request changes/Comment decisions

## Step 3: Parse and Organize Comments

Extract all review feedback and organize by priority:

1. **Blocking issues**: Comments from "Request changes" reviews
2. **Code-level comments**: Specific file/line feedback with suggestions
3. **General feedback**: Overall PR comments

For each comment, capture:
- Author
- Comment body
- File path (if code-level comment)
- Line number (if code-level comment)
- Suggested changes (if provided)
- Status (resolved/unresolved)

## Step 4: Create Todo List

Use the TodoWrite tool to create a todo list of all review comments that need to be addressed:

```
- [File path:line]: [Summary of comment]
- [File path:line]: [Summary of comment]
- [General]: [Summary of overall feedback]
```

**Important:**
- Only include unresolved comments
- Group comments by file for efficiency
- Mark blocking issues clearly in the todo description
- Use the activeForm to show "Fixing [description]" when working on each item

## Step 5: Systematically Fix Each Comment

For each todo item:

1. **Read the relevant file(s)** to understand the context
2. **Analyze the comment** and determine the fix required
3. **Mark todo as in_progress** before starting the fix
4. **Make the necessary changes** using Edit/Write tools
5. **Verify the fix** addresses the comment
6. **Mark todo as completed** after fixing
7. **Move to the next comment**

## Step 6: Handle Special Cases

**Suggested changes:**
If a reviewer provided a GitHub suggestion (code block), apply it directly:
- GitHub suggestions are formatted as diff blocks in comments
- Apply the exact suggested change unless it needs adaptation

**Unclear feedback:**
If a comment is unclear or requires clarification:
- Use AskUserQuestion to ask the user how they want to proceed
- Offer options like: "Apply suggestion", "Skip for now", "Ask reviewer for clarification"

**Conflicting changes:**
If multiple comments conflict:
- Note the conflict to the user
- Ask which approach to take

## Step 7: Summary and Next Steps

After addressing all comments:

1. Show a summary of changes made
2. Suggest running tests/lint if applicable
3. Ask if the user wants to:
   - Review the changes before pushing
   - Push the changes immediately
   - Create a new commit with a summary message

## Example Workflow

User runs: `/fix-pr-comments 42`

You would:

1. Fetch PR #42 details and review comments
2. Parse review threads and find 5 unresolved comments:
   - `src/components/Button.tsx:15` - "Use semantic HTML button element"
   - `src/utils/api.ts:42` - "Add error handling for network failures"
   - `src/utils/api.ts:58` - "Extract magic number to named constant"
   - General - "Add JSDoc comments to exported functions"
   - General - "Update README with new API changes"

3. Create todo list with 5 items

4. Fix each item systematically:
   - Mark as in_progress
   - Read relevant files
   - Make the fix
   - Mark as completed
   - Move to next

5. After all fixes:
   - Run `bun run lint:fix` to ensure code quality
   - Show summary of changes
   - Ask about next steps (commit/push)

## Command Output Format

After fetching and parsing comments, present them in a clear format:

```
Found [N] review comments on PR #[NUMBER]: [PR Title]

Blocking Issues (Request Changes):
- [Author]: [Summary]

Code-Level Comments:
- [File:line] by [Author]: [Comment summary]
- [File:line] by [Author]: [Comment summary]

General Feedback:
- [Author]: [Comment summary]

Creating todo list to address these systematically...
```

## Important Notes

- Always mark todos as in_progress before starting work
- Mark todos as completed immediately after finishing each fix
- Only work on unresolved comments (skip already resolved ones)
- If a comment thread is marked as resolved, mention it but don't create a todo
- Use the gh CLI for all GitHub operations
- The command should work from the current branch (typically the PR branch)
- If not on the correct branch, ask the user if you should switch
