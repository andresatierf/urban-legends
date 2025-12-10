---
description: Test a feature comprehensively using systematic QA methodology
tags:
  - testing
  - quality
---

# Test Feature Command

Systematically test a feature to ensure quality, find bugs, and validate functionality.

## Usage

```
/test-feature [feature-name-or-description]
```

Examples: `/test-feature team joining`, `/test-feature submission approval`

## What It Does

Launches the **QA Tester agent** to:
1. Understand the feature to test
2. Create comprehensive test plan
3. Execute tests systematically
4. Document bugs found
5. Provide test summary report

## Process

1. **Identify Feature**: Uses argument or asks user what to test
2. **Launch Agent**: Uses Task tool with `subagent_type: "qa-tester"`
3. **Agent Tests**: Creates plan, executes tests, finds bugs
4. **Review Results**: Examine bugs, assess severity, decide on fixes

## Output

Test report with:
- Test coverage summary (functional, edge cases, accessibility, performance)
- Bugs found with severity (Critical/High/Medium/Low)
- Reproduction steps for each bug
- Overall pass/fail assessment
- Recommendations

## When to Use

✅ New feature needs validation
✅ Bug fix needs verification
✅ Pre-deployment quality check
✅ After significant refactoring

❌ Quick manual checks (do directly)
❌ Code review (use `/code-review`)

## Testing Scope

- **Page Level**: Test specific page
- **Feature Level**: Test complete workflow
- **Component Level**: Test specific component
- **System Level**: Test entire feature area

## Integration with Workflow

**During Development**: Implement → Test → Fix → Re-test

**Before PR**: Test changed functionality, ensure all pass

**After Deployment**: Verify in production

## Tips

- Be specific in feature name
- Mention known issues/concerns
- Test with different user roles
- Validate on mobile devices
- Check browser console

Ensures quality and prevents bugs from reaching users.
