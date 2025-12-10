# Development Workflow Guide

Complete feature development workflow using Claude Code agents and commands, from idea to deployment.

## Workflow Phases

1. **Planning**: Define what to build (Specification)
2. **Implementation**: Build the feature (Engineering)
3. **Quality Assurance**: Test and validate (QA)
4. **Documentation**: Update docs and create PR

## Agents

### Feature Spec Architect (`feature-spec-architect`)

Transforms ideas into detailed technical specifications

**Use when**: Planning new features, designing architecture changes, creating documentation

**Output**: Spec file in `specs/` directory

### Software Engineer (`software-engineer`)

Implements features, refactors code, fixes bugs, optimizes performance

**Use when**: Building features, refactoring, fixing complex bugs, optimizing

**Output**: Production-quality code

### QA Tester (`qa-tester`)

Tests features, finds bugs, validates quality

**Use when**: Testing features, validating fixes, pre-deployment checks, regression testing

**Output**: Test report with bugs and recommendations

## Commands

### `/implement-spec [spec-name]`

Implements a spec in isolated git worktree with automated workflow

**Result**: Feature implemented, quality checks passed, draft PR created

### `/test-feature [feature-name]`

Comprehensive testing using QA methodology

**Result**: Test report with coverage and bugs

### `/code-review`

Runs CodeRabbit analysis and guides fixes

**Result**: Code quality validated

### `/commit`

Creates well-formatted commits following repo style

**Result**: Clean commit history

### `/sync-docs`

Updates documentation to match codebase

**Result**: Current COMPLETED.md and MISSING.md

## Complete Workflow

### 1. Planning & Specification

**Goal**: Create detailed technical spec

```
User: "I want to add a leaderboard system"

Claude: Uses feature-spec-architect agent
        Creates specs/31-leaderboard-system.md
```

**Output**: Spec with schema, API, UI design, implementation phases

---

### 2. Implementation

**Option A: Automated** (recommended for clear specs)

```bash
/implement-spec leaderboard-system
```

Creates worktree, implements feature, runs checks, creates draft PR.

**Option B: Manual** (for complex features)

```
Use software-engineer agent
Implement incrementally
Commit as you go with /commit
```

**Output**: Feature implemented with clean commits

---

### 3. Quality Assurance

**Step 1: Automated Checks**

```bash
bun run check:fix
bun run typecheck
```

**Step 2: Code Review**

```bash
/code-review
```

**Step 3: Feature Testing**

```bash
/test-feature leaderboard system
```

**Step 4: Fix & Re-test**
Fix bugs → Commit → Re-test until all pass

**Output**: High-quality, tested feature

---

### 4. Documentation & PR

**Update Docs**

```bash
/sync-docs
```

**Create/Review PR**

- Auto-created by `/implement-spec`, or
- Manual: Push branch, use `gh pr create`

**Output**: PR ready for review

## Workflow Variations

### Quick Bug Fix

1. Identify and fix (use software-engineer for complex)
2. Test: `/test-feature [affected-feature]`
3. Quality checks: `bun run check:fix` + `/code-review`
4. Commit and push

### Refactoring

1. Plan with software-engineer agent
2. Refactor incrementally
3. Test after each change
4. Run code review
5. Commit refactoring

### Investigation

1. Use Explore agent to understand code
2. Make decisions based on findings

## Best Practices

**Agent Selection**:

- **Feature Spec Architect**: Complex feature planning
- **Software Engineer**: Implementation and refactoring
- **QA Tester**: Comprehensive testing
- **Explore**: Understanding codebase

**Workflow Tips**:

- Always spec first for complex features
- Test continuously during development
- Commit frequently with atomic changes
- Run quality checks before PR
- Update documentation after completion
- Use worktrees for parallel development

**Quality Standards** (before "done"):

- [ ] All requirements met
- [ ] Edge cases handled
- [ ] Error and loading states
- [ ] Type checking passes
- [ ] Linting passes
- [ ] CodeRabbit review clean
- [ ] Manual testing complete
- [ ] Documentation updated

## Example: Team Activity History Feature

**1. Spec**: Agent creates `specs/32-team-activity-history.md`

**2. Implement**: `/implement-spec team-activity-history`

- Creates worktree, builds feature, runs checks, creates PR

**3. Test**: `/test-feature team activity history`

- Finds 1 minor bug

**4. Fix**: Fix bug, commit, re-test

- All tests pass

**5. Document**: `/sync-docs`

- Updates COMPLETED.md, moves spec to done/

**6. Result**: Draft PR ready for review

## Troubleshooting

**Agent not producing good results**: Provide more context, break down task, try different agent

**Quality checks failing**: Fix one at a time, use `/code-review` for guidance

**Tests finding many issues**: Prioritize by severity, fix in batches

**Unclear next steps**: Review this guide, check spec, ask for help

## Summary

1. **Plan** with Feature Spec Architect
2. **Implement** with Software Engineer or `/implement-spec`
3. **Test** with QA Tester or `/test-feature`
4. **Review** with `/code-review`
5. **Document** with `/sync-docs`
6. **Deploy** via PR

This ensures well-planned, high-quality features with current documentation.
