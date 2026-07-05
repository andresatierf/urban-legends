// Autonomous sibling of `issues.ts`: a planner agent picks an unblocked batch
// of ready-for-agent issues (applying the `## Blocked by` rule) instead of
// taking issue numbers on the CLI, then runs each through `issuePhases`
// (implement → review) concurrently. Each issue ends as a PR; to pick up
// newly-unblocked issues, merge some PRs and re-run.
//
// Run with:
//   bun .sandcastle/auto.ts

import * as sandcastle from "@ai-hero/sandcastle";

import {
  type Issue,
  issuePhases,
  reportResults,
  runPipelines,
} from "./execute";
import { hooks, sandbox } from "./sandbox";

// Plan: pick an unblocked batch.
const plan = await sandcastle.run({
  hooks,
  sandbox,
  name: "planner",
  maxIterations: 1,
  agent: sandcastle.claudeCode("claude-sonnet-4-6"),
  promptFile: "./.sandcastle/plan-prompt.md",
});

const planMatch = plan.stdout.match(/<plan>([\s\S]*?)<\/plan>/);
if (!planMatch) {
  throw new Error(
    `Planning agent did not produce a <plan> tag.\n\n${plan.stdout}`,
  );
}

const { issues } = JSON.parse(planMatch[1]!) as { issues: Issue[] };

if (issues.length === 0) {
  console.log("No unblocked ready-for-agent issues. Nothing to do.");
  process.exit(0);
}

console.log(`\nPlanner picked ${issues.length} issue(s):`);
for (const issue of issues) {
  console.log(`  #${issue.id} ${issue.title} → ${issue.branch}`);
}

// Execute + review, one PR per issue.
const settled = await runPipelines(issues, issuePhases);
reportResults(issues, settled);
