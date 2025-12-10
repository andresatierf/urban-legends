---
description: Run CodeRabbit review and resolve returned errors
tags:
  - code-review
  - quality
---

# CodeRabbit Review Command

Run CodeRabbit analysis, wait for completion, and resolve all issues found.

## Process

1. **Run Review**: `coderabbit --prompt-only` (NEVER interrupt - let complete naturally)
2. **Analyze**: Review errors, categorize by severity (Critical/High/Medium/Low)
3. **Plan**: Use TodoWrite to track issues
4. **Fix**: Address each issue systematically
5. **Commit**: `git add [files]` → `/commit`
6. **Re-run**: Repeat until no significant issues remain (typically 2-3 iterations)

## Severity Levels

- **Critical**: Security issues, bugs, blocking errors
- **High**: Code quality issues, significant improvements
- **Medium**: Style issues, minor improvements
- **Low**: Suggestions, optional enhancements

## What CodeRabbit Checks

- Code quality and best practices
- Potential bugs and logic errors
- Security vulnerabilities
- Performance concerns
- Documentation gaps
- Codebase consistency

## Guidelines

**Do**: Wait patiently for completion, fix all critical/high issues, use TodoWrite to track, make focused fixes, follow project patterns

**Don't**: Stop command early, skip critical issues, refactor unrelated code

## When Complete

Summary with:
- Number of issues resolved
- Types fixed (security, bugs, quality, style)
- Files modified
- Any skipped issues with explanation
