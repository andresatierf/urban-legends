// Review-only orchestrator: no planning, no implement phase, no merge. You name
// open PRs; each is resolved to its head branch and run through the reviewer
// loop, which pushes tightening commits back so the PR picks them up.
//
// Run with:
//   bun .sandcastle/fix.ts 304 305
//   bun run sandcastle:fix -- 304 305

import {
  type Issue,
  parseNumericArgs,
  reportResults,
  reviewPhase,
  runPipelines,
} from "./execute";
import { sh } from "./sandbox";

const uniquePrs = parseNumericArgs(".sandcastle/fix.ts", "PR", "304 305");

// `gh` gives the exact head branch. It exits non-zero for a missing PR (or no
// auth / no network) — turn that into a clear message and stop, rather than
// letting a raw stack trace escape. An empty branch (PR with no head) is also
// unusable, so treat it the same.
function resolveBranch(pr: string): string {
  let branch: string;
  try {
    branch = sh(`gh pr view ${pr} --json headRefName --jq .headRefName`);
  } catch (err) {
    const detail = err instanceof Error ? err.message.split("\n")[0] : `${err}`;
    console.error(`Could not resolve PR #${pr}: ${detail}`);
    process.exit(1);
  }
  if (!branch) {
    console.error(`PR #${pr} has no head branch to review.`);
    process.exit(1);
  }
  return branch;
}

// id/title are cosmetic (run names + summary); only the branch matters.
const issues: Issue[] = uniquePrs.map((pr) => ({
  id: pr,
  title: `fix PR #${pr}`,
  branch: resolveBranch(pr),
}));

console.log(`\nReviewing ${issues.length} PR branch(es):`);
for (const issue of issues) {
  console.log(`  #${issue.id} → ${issue.branch}`);
}

const settled = await runPipelines(issues, [reviewPhase]);
reportResults(issues, settled);
