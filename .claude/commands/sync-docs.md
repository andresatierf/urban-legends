---
description: Review recent commits and sync documentation with current state
tags:
  - documentation
  - project
---

# Documentation Sync Command

Review recent commits and update project documentation to match current implementation state.

## Process

### 1. Review Recent Work

```bash
git log --oneline -10
git log -5 --pretty=format:"%h - %s%n%b" --stat
```

### 2. Analyze Current State

Read:

- docs/COMPLETED.md
- docs/MISSING.md
- All specs in specs/ (use Glob)
- All specs in specs/done/

### 3. Verify Implementation

For each spec in specs/:

- Search codebase to verify implementation
- Check for matching components, mutations, queries, pages
- Determine status: fully implemented / partially implemented / not started

### 4. Update COMPLETED.md

Add fully implemented features:

```markdown
## [Feature Name] (spec: XX-feature-name.md)

**Implemented in**: [commit hash]

- What was implemented
- Key files created
- Notes
```

### 5. Update MISSING.md

Update to reflect:

- Features NOT yet implemented
- Incomplete specs
- Gaps and technical debt

Remove completed items.

### 6. Organize Specs

Move fully completed specs to done/:

```bash
git mv specs/16-feature.md specs/done/16-feature.md
```

Only move 100% complete specs.

### 7. Provide Summary

- Specs moved to done/
- New features in COMPLETED.md
- Items removed from MISSING.md
- Partially complete specs (with %)
- Recommendations

## Tools to Use

- **Bash**: git log, git mv
- **Read**: Spec and doc files
- **Glob**: Find all specs
- **Grep**: Search for implementation
- **Edit/Write**: Update docs
- **Explore agent**: Complex searches

## Important

- **Be thorough**: Actually verify implementation, don't rely only on commit messages
- **Be accurate**: Only mark complete if ALL spec requirements met
- **Use git mv**: Preserve history when moving specs
- **No commits**: This command only updates docs, doesn't create commits

Success means: Documentation accurately reflects current state, completed specs in done/, incomplete specs in specs/.
