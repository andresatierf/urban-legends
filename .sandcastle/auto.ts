// Parallel Planner with Review (no merge phase) — three-phase orchestration.
//
//   Phase 1 (Plan):    Opus reads ready-for-agent issues, applies the
//                      `## Blocked by` rule, picks an unblocked batch, outputs
//                      a <plan> JSON block.
//   Phase 2 (Execute + Review loop): One pipeline per picked issue, all
//                      running concurrently. Each pipeline:
//                        a) implementer (Opus, up to 100 iters) writes code,
//                           commits, pushes, opens a PR
//                        b) reviewer (Opus, 1 iter/round) tightens the diff
//                           and pushes; repeat up to MAX_REVIEW_ROUNDS rounds
//                           or until a round produces no commits
//
// There is no merge phase: each issue ends as a PR for human review. To
// pick up newly-unblocked issues, merge some PRs and re-run this script.
//
// Phase 2 (the execute + review loop and results summary) is shared with
// `issues.ts` via `./execute.ts`. Sandbox config and container auth wiring
// are shared via `./sandbox.ts`.
//
// This is the autonomous sibling of `issues.ts`: it picks the batch itself
// rather than taking issue numbers on the CLI.
//
// Run with:
//   bun .sandcastle/auto.ts

import * as sandcastle from "@ai-hero/sandcastle";

import { reportResults, runIssues, type Issue } from "./execute";
import { hooks, sandbox } from "./sandbox";

// ---------------------------------------------------------------------------
// Phase 1: Plan
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Phase 2: Execute + Review loop (parallel, one PR per issue)
// ---------------------------------------------------------------------------

const settled = await runIssues(issues);
reportResults(issues, settled);
