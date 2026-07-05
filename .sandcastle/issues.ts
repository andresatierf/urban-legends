// Manual-selection sibling of `auto.ts`: you name issue numbers, a resolver
// agent turns them into a plan (branch names + conflict checks, dropping
// conflicting ones with reasons), then each runs through `issuePhases`
// (implement → review). Each issue ends as a PR.
//
// Run with:
//   bun .sandcastle/issues.ts 42 57 61
//   bun run sandcastle:issues -- 42 57 61

import * as sandcastle from "@ai-hero/sandcastle";

import {
  type Issue,
  issuePhases,
  parseNumericArgs,
  reportResults,
  runPipelines,
} from "./execute";
import { hooks, sandbox, sh } from "./sandbox";

const uniqueIds = parseNumericArgs(
  ".sandcastle/issues.ts",
  "issue",
  "42 57 61",
);

// Resolver input: each selected issue's body (for conflict analysis). Only the
// issues passed as arguments are validated. `gh` exits non-zero on a missing
// issue, surfacing a clear host-side error.
const selectedIssues = uniqueIds
  .map((id) => {
    const { number, title, body } = JSON.parse(
      sh(`gh issue view ${id} --json number,title,body`),
    ) as { number: number; title: string; body: string };
    return `## Issue #${number}: ${title}\n\n${body || "(no body)"}\n`;
  })
  .join("\n---\n\n");

const plan = await sandcastle.run({
  hooks,
  sandbox,
  name: "resolver",
  maxIterations: 1,
  agent: sandcastle.claudeCode("claude-sonnet-4-6"),
  promptFile: "./.sandcastle/resolve-prompt.md",
  promptArgs: {
    SELECTED_ISSUES: selectedIssues,
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

const settled = await runPipelines(issues, issuePhases);
reportResults(issues, settled);
