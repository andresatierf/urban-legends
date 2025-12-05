---
description: Run CodeRabbit review and resolve returned errors
tags:
  - code-review
  - quality
---

# CodeRabbit Review Command

Run CodeRabbit in prompt-only mode, wait for the review to complete, and resolve any errors that are returned.

## Task Overview

You need to:

1. **Run CodeRabbit review**: Execute `coderabbit --prompt-only`
2. **Wait for completion**: Let the command run to completion without stopping it early
3. **Analyze results**: Review the errors and issues returned by CodeRabbit
4. **Resolve errors**: Fix all issues identified in the review

## Step 1: Run CodeRabbit Review

Execute the CodeRabbit command with a long timeout to ensure it completes:

```bash
coderabbit --prompt-only
```

**IMPORTANT**:
- This command may take several minutes to complete
- Do NOT interrupt or cancel the command
- Wait for the full output before proceeding
- The command will eventually finish and return results

## Step 2: Analyze the Review Results

Once CodeRabbit completes, carefully review the output:

1. **Identify all issues**: Look for:
   - Errors that need fixing
   - Warnings that should be addressed
   - Suggestions for improvements
   - Code quality issues
   - Security concerns
   - Performance problems

2. **Categorize issues by priority**:
   - **Critical**: Security issues, bugs, errors that prevent code from working
   - **High**: Code quality issues, significant improvements
   - **Medium**: Style issues, minor improvements
   - **Low**: Suggestions, optional enhancements

3. **Group issues by file**: Organize the issues by which files they affect

## Step 3: Create Resolution Plan

Before making changes, create a plan:

1. **Use TodoWrite** to create a task list with all issues to resolve
2. **Prioritize**: Start with critical and high-priority issues
3. **Group related changes**: If multiple issues affect the same file or component, fix them together

Example todo structure:
```typescript
[
  { content: "Fix security issue in auth.ts", status: "pending", activeForm: "Fixing security issue in auth.ts" },
  { content: "Resolve type errors in teams.ts", status: "pending", activeForm: "Resolving type errors in teams.ts" },
  { content: "Improve error handling in submissions.ts", status: "pending", activeForm: "Improving error handling in submissions.ts" },
]
```

## Step 4: Resolve Issues

For each issue identified:

1. **Read the affected file** using the Read tool
2. **Understand the issue**: Make sure you understand what needs to be fixed
3. **Fix the issue** using the Edit tool
4. **Mark todo as completed** after fixing each issue
5. **Verify the fix**: Make sure the change actually resolves the issue

**Important guidelines**:
- Make focused, targeted fixes - don't refactor unrelated code
- Preserve existing functionality unless the issue requires changing it
- Follow the project's existing patterns and conventions
- If an issue is unclear or questionable, skip it and note it for the user

## Step 5: Run Follow-up Checks (Optional)

After resolving issues, you may want to:

1. **Run linter**: `bun run lint` to ensure no new issues
2. **Run type check**: Verify TypeScript compilation
3. **Run tests**: If applicable

**Note**: Only run these if they're quick. The main goal is to resolve CodeRabbit issues.

## Step 6: Summary

After all issues are resolved:

1. **Mark all todos as completed**
2. **Summarize what was fixed**:
   - Number of issues resolved
   - Types of issues fixed (security, bugs, quality, style)
   - Files that were modified
3. **Note any issues that were skipped** and explain why

## Important Guidelines

- **Never stop the CodeRabbit command early** - always let it complete
- **Wait patiently** - the review process can take time
- **Fix all critical and high-priority issues** identified
- **Use TodoWrite** to track progress on resolving issues
- **Be thorough** - read each issue carefully before fixing
- **Preserve functionality** - don't break existing features while fixing issues
- **Follow project conventions** - match the existing code style

## Error Handling

If you encounter issues:

- **CodeRabbit command fails**: Report the error to the user and suggest checking CodeRabbit installation
- **Cannot understand an issue**: Skip it and note it for the user to review
- **Fix breaks something**: Revert the change and explain to the user
- **No issues found**: Inform the user that CodeRabbit found no issues to resolve

## Example Workflow

```
User: /code-review