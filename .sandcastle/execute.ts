// Shared execute + review building blocks for the sandcastle orchestrators
// (`auto.ts` and `issues.ts`).
//
// These are small, independent functions meant to be composed. The default
// composition — provision a worktree, implement, then review — is `runIssue`,
// and `runIssues` fans that out concurrently. But the pieces (`implement`,
// `review`, `reportResults`) stand alone so a caller can assemble a different
// pipeline (implement-only, review an existing branch, custom reporting, etc.).
//
// There is no merge phase: each issue ends as a PR for human review.
//
// Worktree ownership: we use the two-step `createWorktree` + `worktree
// .createSandbox` API so the sandbox handle's `close()` only tears down the
// container. The worktree handle (which would remove a clean worktree on its
// own `close()`) is intentionally never closed, so worktrees stay under
// `.sandcastle/worktrees/` for inspection after the run. They survive
// subsequent `pruneStale` calls because git still tracks them.

import * as sandcastle from "@ai-hero/sandcastle";

import { copyToWorktree, hooks, sandbox } from "./sandbox";

export type Issue = { id: string; title: string; branch: string };

type Sandbox = Awaited<
  ReturnType<
    Awaited<ReturnType<typeof sandcastle.createWorktree>>["createSandbox"]
  >
>;
type RunResult = Awaited<ReturnType<Sandbox["run"]>>;

// Hard cap so a reviewer that keeps finding nits can't loop forever. Each
// round is reviewer (1 iter) → break when it produces no commits.
const MAX_REVIEW_ROUNDS = 3;

// Run the implementer agent (Opus, up to 100 iters) for one issue inside an
// already-provisioned sandbox: writes code, commits, pushes, opens a PR.
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

// Run the reviewer loop (Sonnet, 1 iter/round) for one issue inside an
// already-provisioned sandbox, up to MAX_REVIEW_ROUNDS or until a round
// produces no commits. Returns the commits it added across all rounds.
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

    if (result.commits.length === 0) {
      // Reviewer converged — nothing left to fix.
      break;
    }
    reviewCommits.push(...result.commits);
  }
  return reviewCommits;
}

// The default per-issue pipeline: provision a worktree + sandbox, implement,
// then (only if the implementer committed) review. The sandbox is always torn
// down; the worktree is deliberately left on disk.
export async function runIssue(issue: Issue): Promise<RunResult> {
  const wt = await sandcastle.createWorktree({
    branchStrategy: { type: "branch", branch: issue.branch },
    copyToWorktree,
  });
  const sb = await wt.createSandbox({ sandbox, hooks });

  try {
    const implemented = await implement(sb, issue);

    // Only review if the implementer produced commits.
    if (implemented.commits.length === 0) {
      return implemented;
    }

    const reviewCommits = await review(sb, issue);
    return {
      ...implemented,
      commits: [...implemented.commits, ...reviewCommits],
    };
  } finally {
    await sb.close();
  }
}

// Fan out `runIssue` across every issue concurrently. Never rejects — each
// issue's outcome is captured as a settled result for `reportResults`.
export function runIssues(issues: Issue[]) {
  return Promise.allSettled(issues.map(runIssue));
}

// Print a one-line-per-issue summary of settled results.
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
