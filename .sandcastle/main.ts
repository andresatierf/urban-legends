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
// Worktree ownership: we use the two-step `createWorktree` + `worktree
// .createSandbox` API so the sandbox handle's `close()` only tears down the
// container. The worktree handle (which would remove a clean worktree on its
// own `close()`) is intentionally never closed, so worktrees stay under
// `.sandcastle/worktrees/` for inspection after the run. They survive
// subsequent `pruneStale` calls because git still tracks them.
//
// Auth model:
//   - Claude: ~/.claude and ~/.claude.json are bind-mounted, so the container's
//     `claude` CLI uses the host's logged-in subscription session.
//   - GitHub: the host gh token (extracted from the OS keyring) is injected as
//     GH_TOKEN. The host repo is expected to already have an `agent-origin`
//     HTTPS remote (added once with `git remote add agent-origin <https-url>`);
//     onSandboxReady wires gh's git credential helper so pushes through it work
//     without mounting SSH keys and without touching the existing `origin`.
//   - Git author: read once from the host gitconfig and passed as env vars.
//
// Run with:
//   bun .sandcastle/main.ts

import { execSync } from "node:child_process";

import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

const sh = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();

// Resolve host credentials/config once so we can pass them into the container.
const ghToken = sh("gh auth token");
const gitName = sh("git config user.name");
const gitEmail = sh("git config user.email");

const sandbox = docker({
  mounts: [
    { hostPath: "~/.claude", sandboxPath: "~/.claude" },
    { hostPath: "~/.claude.json", sandboxPath: "~/.claude.json" },
  ],
  env: {
    GH_TOKEN: ghToken,
    GIT_AUTHOR_NAME: gitName,
    GIT_AUTHOR_EMAIL: gitEmail,
    GIT_COMMITTER_NAME: gitName,
    GIT_COMMITTER_EMAIL: gitEmail,
  },
});

const hooks = {
  sandbox: {
    onSandboxReady: [
      // Wire gh's git credential helper into the container's gitconfig so
      // pushes via the host-configured `agent-origin` HTTPS remote can auth
      // with GH_TOKEN.
      { command: "gh auth setup-git" },
      // Refresh platform-specific deps after node_modules is copied in.
      { command: "bun install" },
    ],
  },
};

const copyToWorktree = ["node_modules", ".env.local"];

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

const { issues } = JSON.parse(planMatch[1]!) as {
  issues: { id: string; title: string; branch: string }[];
};

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

// Hard cap so a reviewer that keeps finding nits can't loop forever. Each
// round is reviewer (1 iter) → break when it produces no commits.
const MAX_REVIEW_ROUNDS = 3;

const settled = await Promise.allSettled(
  issues.map(async (issue) => {
    // Split ownership: createWorktree owns the worktree, wt.createSandbox
    // owns the container. We only close the sandbox below, so the worktree
    // is preserved on disk for human inspection.
    const wt = await sandcastle.createWorktree({
      branchStrategy: { type: "branch", branch: issue.branch },
      copyToWorktree,
    });
    const sb = await wt.createSandbox({ sandbox, hooks });

    try {
      const implement = await sb.run({
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

      // Only review if the implementer produced commits.
      if (implement.commits.length === 0) {
        return implement;
      }

      const reviewCommits: { sha: string }[] = [];
      for (let round = 1; round <= MAX_REVIEW_ROUNDS; round++) {
        const review = await sb.run({
          name: `review-${issue.id}-r${round}`,
          maxIterations: 1,
          completionSignal: "<promise>COMPLETE</promise>",
          agent: sandcastle.claudeCode("claude-sonnet-4-6"),
          promptFile: "./.sandcastle/review-prompt.md",
          promptArgs: {
            BRANCH: issue.branch,
          },
        });

        if (review.commits.length === 0) {
          // Reviewer converged — nothing left to fix.
          break;
        }
        reviewCommits.push(...review.commits);
      }

      return {
        ...implement,
        commits: [...implement.commits, ...reviewCommits],
      };
    } finally {
      await sb.close();
    }
  }),
);

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

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
