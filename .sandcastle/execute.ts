// Building blocks for the sandcastle orchestrators (`auto.ts`, `issues.ts`,
// `fix.ts`). Everything runs through `runPipelines(issues, phases)`; the shipped
// phase list `issuePhases` (implement → gated review) drives `auto.ts`/
// `issues.ts`, while `fix.ts` passes `[reviewPhase]`.
//
// Worktree ownership: we create the sandbox via `createWorktree` +
// `worktree.createSandbox` so `sandbox.close()` tears down only the container.
// The worktree handle is never closed, so worktrees stay under
// `.sandcastle/worktrees/` for inspection and survive `prune.ts` (git still
// tracks them).

import { execSync } from "node:child_process";

import * as sandcastle from "@ai-hero/sandcastle";

import { copyToWorktree, hooks, sandbox } from "./sandbox";

// Best-effort so a run's worktree is `z`-jumpable afterwards. A missing or
// failing zoxide must never abort the run.
function zoxideAdd(worktreePath: string): void {
  try {
    execSync(`zoxide add ${JSON.stringify(worktreePath)}`, { stdio: "ignore" });
  } catch {}
}

export type Issue = { id: string; title: string; branch: string };

// Parse numeric CLI args: tolerate a leading `#` and comma/space separation,
// require each to be numeric, and dedupe (a repeat would run two agents on one
// branch). Prints usage and exits non-zero on empty/invalid input. `label` is
// the noun ("issue", "PR") used in the messages.
export function parseNumericArgs(
  scriptPath: string,
  label: string,
  example: string,
): string[] {
  const ids = process.argv
    .slice(2)
    .flatMap((arg) => arg.split(/[,\s]+/))
    .map((arg) => arg.replace(/^#/, "").trim())
    .filter(Boolean);

  if (ids.length === 0) {
    console.error(
      `Usage: bun ${scriptPath} <${label} number> [<${label} number> ...]`,
    );
    console.error(`Example: bun ${scriptPath} ${example}`);
    process.exit(1);
  }

  for (const id of ids) {
    if (!/^\d+$/.test(id)) {
      console.error(`Not a valid ${label} number: "${id}"`);
      process.exit(1);
    }
  }

  return [...new Set(ids)];
}

type Sandbox = Awaited<
  ReturnType<
    Awaited<ReturnType<typeof sandcastle.createWorktree>>["createSandbox"]
  >
>;
export type RunResult = Awaited<ReturnType<Sandbox["run"]>>;

// `soFar` is the result accumulated by earlier phases — lets a phase branch on
// what came before (see `gate`).
export type Phase = (
  sb: Sandbox,
  issue: Issue,
  soFar: RunResult,
) => Promise<RunResult>;

const emptyResult: RunResult = { iterations: [], stdout: "", commits: [] };

// Cap so a reviewer that keeps finding nits can't loop forever.
const MAX_REVIEW_ROUNDS = 5;

// Implementer agent: writes code, commits, pushes, opens a PR.
export function implement(sb: Sandbox, issue: Issue): Promise<RunResult> {
  return sb.run({
    name: `impl-${issue.id}`,
    maxIterations: 100,
    idleTimeoutSeconds: 1200,
    completionSignal: "<promise>COMPLETE</promise>",
    agent: sandcastle.claudeCode("claude-opus-4-7"),
    promptFile: "./.sandcastle/implement-prompt.md",
    promptArgs: {
      TASK_ID: issue.id,
      ISSUE_TITLE: issue.title,
      BRANCH: issue.branch,
    },
  });
}

// Reviewer loop (1 iter/round), up to MAX_REVIEW_ROUNDS or until a round adds no
// commits. Returns the commits added across all rounds.
export async function review(
  sb: Sandbox,
  issue: Issue,
): Promise<{ sha: string }[]> {
  const reviewCommits: { sha: string }[] = [];
  for (let round = 1; round <= MAX_REVIEW_ROUNDS; round++) {
    const result = await sb.run({
      name: `review-${issue.id}-r${round}`,
      maxIterations: 1,
      completionSignal: "<promise>COMPLETE</promise>",
      agent: sandcastle.claudeCode("claude-sonnet-4-6"),
      promptFile: "./.sandcastle/review-prompt.md",
      promptArgs: {
        BRANCH: issue.branch,
      },
    });

    if (result.commits.length === 0) break; // converged
    reviewCommits.push(...result.commits);
  }
  return reviewCommits;
}

// Concatenate iterations/commits, join stdout, later phase wins optional fields.
function mergeResults(acc: RunResult, next: RunResult): RunResult {
  return {
    iterations: [...acc.iterations, ...next.iterations],
    stdout: acc.stdout ? `${acc.stdout}\n${next.stdout}` : next.stdout,
    commits: [...acc.commits, ...next.commits],
    completionSignal: next.completionSignal ?? acc.completionSignal,
    logFilePath: next.logFilePath ?? acc.logFilePath,
  };
}

// Run `phases` in order for one issue inside a single worktree + sandbox,
// threading each result into the next. Provisions the worktree (existing branch
// checked out, new one created off HEAD) and always tears the sandbox down.
export async function runPipeline(
  issue: Issue,
  phases: Phase[],
): Promise<RunResult> {
  const wt = await sandcastle.createWorktree({
    branchStrategy: { type: "branch", branch: issue.branch },
    copyToWorktree,
  });
  zoxideAdd(wt.worktreePath);
  const sb = await wt.createSandbox({ sandbox, hooks });

  try {
    let acc = emptyResult;
    for (const phase of phases) {
      acc = mergeResults(acc, await phase(sb, issue, acc));
    }
    return acc;
  } finally {
    await sb.close();
  }
}

// Fan out concurrently. Never rejects — each outcome is a settled result.
export function runPipelines(issues: Issue[], phases: Phase[]) {
  return Promise.allSettled(issues.map((issue) => runPipeline(issue, phases)));
}

export const implementPhase: Phase = (sb, issue) => implement(sb, issue);

export const reviewPhase: Phase = async (sb, issue) => ({
  ...emptyResult,
  commits: await review(sb, issue),
});

// Run `phase` only when `when(soFar)` holds, else contribute nothing.
export function gate(when: (soFar: RunResult) => boolean, phase: Phase): Phase {
  return (sb, issue, soFar) =>
    when(soFar) ? phase(sb, issue, soFar) : Promise.resolve(emptyResult);
}

// Implement, then review only if the implementer committed.
export const issuePhases: Phase[] = [
  implementPhase,
  gate((soFar) => soFar.commits.length > 0, reviewPhase),
];

export function reportResults(
  issues: Issue[],
  settled: PromiseSettledResult<RunResult>[],
) {
  console.log("\n=== Results ===");
  for (const [i, r] of settled.entries()) {
    const issue = issues[i]!;
    if (r.status === "rejected") {
      console.error(`  ✗ #${issue.id} crashed: ${r.reason}`);
    } else if (r.value.commits.length === 0) {
      console.warn(`  - #${issue.id} produced no commits`);
    } else {
      console.log(
        `  ✓ #${issue.id} → ${r.value.commits.length} commit(s) on ${issue.branch}`,
      );
    }
  }
}
