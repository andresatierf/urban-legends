// Targeted Executor with Review (no merge phase) — two-phase orchestration over
// an explicit list of issue numbers.
//
// This is the manual-selection sibling of `auto.ts`. Where `auto.ts`'s planner
// scans all `ready-for-agent` issues to pick a batch, here you name the issue
// numbers yourself. A resolver agent (Phase 1) then turns those numbers into a
// runnable plan: it reads each issue body, generates a branch name, and applies
// the same dependency (`## Blocked by`) and conflict-avoidance rules the planner
// uses — so a blocked or conflicting issue you named gets excluded rather than
// run into a predictable failure.
//
//   Phase 1 (Resolve):  Fetch each selected issue's title + body on the host,
//                       hand them to a resolver agent that emits a <plan> JSON
//                       block with branch names, dropping blocked/conflicting
//                       issues (with reasons).
//   Phase 2 (Execute + Review loop): One pipeline per approved issue, all
//                       running concurrently. Each pipeline:
//                         a) implementer (Opus, up to 100 iters) writes code,
//                            commits, pushes, opens a PR
//                         b) reviewer (Sonnet, 1 iter/round) tightens the diff
//                            and pushes; repeat up to MAX_REVIEW_ROUNDS rounds
//                            or until a round produces no commits
//
// There is no merge phase: each issue ends as a PR for human review.
//
// Phase 2 (the execute + review loop and results summary) is shared with
// `auto.ts` via `./execute.ts`; sandbox config and container auth wiring via
// `./sandbox.ts`.
//
// Run with:
//   bun .sandcastle/issues.ts 42 57 61
//   bun run sandcastle:issues -- 42 57 61

import * as sandcastle from "@ai-hero/sandcastle";

import { type Issue, reportResults, runIssues } from "./execute";
import { hooks, sandbox, sh } from "./sandbox";

// ---------------------------------------------------------------------------
// Phase 1: Resolve issue numbers → plan (branch names + dependency check)
// ---------------------------------------------------------------------------

// Accept issue numbers as CLI args, tolerating a leading `#` on each.
const ids = process.argv
  .slice(2)
  .flatMap((arg) => arg.split(/[,\s]+/))
  .map((arg) => arg.replace(/^#/, "").trim())
  .filter(Boolean);

if (ids.length === 0) {
  console.error(
    "Usage: bun .sandcastle/issues.ts <issue-number> [<issue-number> ...]",
  );
  console.error("Example: bun .sandcastle/issues.ts 42 57 61");
  process.exit(1);
}

for (const id of ids) {
  if (!/^\d+$/.test(id)) {
    console.error(`Not a valid issue number: "${id}"`);
    process.exit(1);
  }
}

// Dedupe while preserving order — a repeated number would spin up two agents on
// the same branch and clobber each other.
const uniqueIds = [...new Set(ids)];

// Gather the raw material the resolver agent reasons over: each selected
// issue's body (for `## Blocked by` + conflict analysis) and the full set of
// open issue numbers (to decide which blockers are still unresolved). `gh` exits
// non-zero if an issue doesn't exist, surfacing a clear error here on the host.
const selectedIssues = uniqueIds
  .map((id) => {
    const { number, title, body } = JSON.parse(
      sh(`gh issue view ${id} --json number,title,body`),
    ) as { number: number; title: string; body: string };
    return `## Issue #${number}: ${title}\n\n${body || "(no body)"}\n`;
  })
  .join("\n---\n\n");

const openNumbers = sh(
  `gh issue list --state open --limit 200 --json number --jq '[.[].number | tostring] | join(", ")'`,
);

const plan = await sandcastle.run({
  hooks,
  sandbox,
  name: "resolver",
  maxIterations: 1,
  agent: sandcastle.claudeCode("claude-sonnet-4-6"),
  promptFile: "./.sandcastle/resolve-prompt.md",
  promptArgs: {
    SELECTED_ISSUES: selectedIssues,
    OPEN_NUMBERS: openNumbers,
  },
});

const planMatch = plan.stdout.match(/<plan>([\s\S]*?)<\/plan>/);
if (!planMatch) {
  throw new Error(
    `Resolver agent did not produce a <plan> tag.\n\n${plan.stdout}`,
  );
}

const { issues, excluded = [] } = JSON.parse(planMatch[1]!) as {
  issues: Issue[];
  excluded?: { id: string; reason: string }[];
};

for (const skip of excluded) {
  console.warn(`  ⤫ #${skip.id} excluded: ${skip.reason}`);
}

if (issues.length === 0) {
  console.log("\nNo runnable issues after dependency/conflict checks.");
  process.exit(0);
}

console.log(`\nWorking ${issues.length} issue(s):`);
for (const issue of issues) {
  console.log(`  #${issue.id} ${issue.title} → ${issue.branch}`);
}

// ---------------------------------------------------------------------------
// Phase 2: Execute + Review loop (parallel, one PR per issue)
// ---------------------------------------------------------------------------

const settled = await runIssues(issues);
reportResults(issues, settled);
