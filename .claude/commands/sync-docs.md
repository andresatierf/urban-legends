---
description: Review recent commits and sync documentation with current state
tags:
  - documentation
  - project
---

# Documentation Sync Command

Review recent git commits and update project documentation to reflect the current state of the application.

## Task Overview

You need to:

1. **Review Recent Commits**: Analyze the last 10 commits to understand what has been implemented
2. **Update Documentation**: Sync docs/COMPLETED.md and docs/MISSING.md with actual implementation status
3. **Organize Specs**: Move completed specs from specs/ to specs/done/ directory

## Step 1: Review Recent Commits

Use the Bash tool to get an overview of recent work:

```bash
git log --oneline -10
```

Then get more details on the commits:

```bash
git log -5 --pretty=format:"%h - %s%n%b" --stat
```

## Step 2: Analyze Current State

Read the following files to understand current documentation state:

- docs/COMPLETED.md
- docs/MISSING.md
- All spec files in specs/ directory (use Glob to find them)
- All spec files in specs/done/ directory for comparison

## Step 3: Cross-Reference Implementation

For each spec in specs/:

- Search the codebase to verify if the feature described in the spec has been implemented
- Check if there are components, mutations, queries, or pages that match the spec
- Determine completion status: fully implemented, partially implemented, or not started

## Step 4: Update COMPLETED.md

Update docs/COMPLETED.md to include:

- All features that have been fully implemented (based on commits and code verification)
- Reference to the spec file for each completed feature
- Brief description of what was implemented
- Commit references where applicable

Format:

```markdown
## [Feature Name] (spec: XX-feature-name.md)

**Implemented in**: [commit hash(es)]

- Description of what was implemented
- Key components/files created
- Any notes about the implementation

---
```

## Step 5: Update MISSING.md

Update docs/MISSING.md to reflect:

- Features that are NOT yet implemented
- Specs that haven't been completed
- Any gaps or technical debt identified

Remove items that have been completed.

Format:

```markdown
## [Feature Name] (spec: XX-feature-name.md)

**Status**: Not Started / Partially Implemented

- What's missing
- Dependencies or blockers
- Priority level (if determinable)

---
```

## Step 6: Organize Specs

For each fully completed spec in specs/:

- Move it to specs/done/ using `git mv`
- Example: `git mv specs/16-submission-detail-page.md specs/done/16-submission-detail-page.md`

Only move specs that are 100% complete based on your verification.

## Step 7: Summary

Provide the user with:

- Count of specs moved to done/
- Count of new features added to COMPLETED.md
- Count of items removed from MISSING.md
- Any specs that are partially complete (with percentage estimate if possible)
- Recommendations for next steps

## Important Notes

- **Be thorough**: Actually search the codebase to verify implementation, don't just rely on commit messages
- **Be accurate**: Only mark specs as complete if ALL requirements in the spec are implemented
- **Use Git**: Always use `git mv` to move specs (not regular `mv`) to preserve history
- **No commits**: This command only updates documentation, it does NOT create git commits
- **Preserve formatting**: Maintain the existing format and style of COMPLETED.md and MISSING.md

## Tools You Should Use

- **Bash**: For git log and git mv commands
- **Read**: To read spec files and documentation
- **Glob**: To find all spec files
- **Grep**: To search codebase for implementation evidence
- **Edit** or **Write**: To update documentation files
- **Task (Explore agent)**: For complex codebase searches to verify implementation

## Success Criteria

- All documentation accurately reflects current implementation state
- Completed specs are in specs/done/
- Incomplete specs remain in specs/
- COMPLETED.md lists all finished features
- MISSING.md lists remaining work
- User receives clear summary of changes
