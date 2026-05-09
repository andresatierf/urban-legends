// Parallel Planner with Review (no merge phase) — three-phase orchestration.
//
//   Phase 1 (Plan):    Opus reads ready-for-agent issues, applies the
//                      `## Blocked by` rule, picks an unblocked batch, outputs
//                      a <plan> JSON block.
//   Phase 2 (Execute + Review): One pipeline per picked issue, all running
//                      concurrently. Each pipeline:
//                        a) implementer (Opus, up to 100 iters) writes code,
//                           commits, pushes, opens a PR
//                        b) reviewer (Opus, 1 iter) tightens the diff in the
//                           same sandbox before the human reviews it
//
// There is no merge phase: each issue ends as a PR for human review. To
// pick up newly-unblocked issues, merge some PRs and re-run this script.
//
// Auth model:
//   - Claude: ~/.claude and ~/.claude.json are bind-mounted, so the container's
//     `claude` CLI uses the host's logged-in subscription session.
//   - GitHub: the host gh token (extracted from the OS keyring) is injected as
//     GH_TOKEN. The onSandboxReady hooks switch the worktree's origin to HTTPS
//     and wire gh's git credential helper, so pushes work without mounting SSH
//     keys.
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
const repoUrl = sh("gh repo view --json url --jq .url"); // https://github.com/owner/repo

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
      // Switch the worktree's origin to HTTPS so GH_TOKEN can auth the push.
      { command: `git remote set-url origin ${repoUrl}.git` },
      // Wire gh's git credential helper into the container's gitconfig.
      { command: "gh auth setup-git" },
      // Refresh platform-specific deps after node_modules is copied in.
      { command: "bun install" },
    ],
  },
};

const copyToWorktree = ["node_modules"];

// ---------------------------------------------------------------------------
// Phase 1: Plan
// ---------------------------------------------------------------------------

const plan = await sandcastle.run({
  hooks,
  sandbox,
  name: "planner",
  maxIterations: 1,
  agent: sandcastle.claudeCode("claude-opus-4-6"),
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
// Phase 2: Execute + Review (parallel, one PR per issue)
// ---------------------------------------------------------------------------

const settled = await Promise.allSettled(
  issues.map(async (issue) => {
    const sb = await sandcastle.createSandbox({
      branch: issue.branch,
      sandbox,
      hooks,
      copyToWorktree,
    });

    try {
      const implement = await sb.run({
        name: `impl-${issue.id}`,
        maxIterations: 100,
        idleTimeoutSeconds: 1200,
        completionSignal: "<promise>COMPLETE</promise>",
        agent: sandcastle.claudeCode("claude-opus-4-6"),
        promptFile: "./.sandcastle/implement-prompt.md",
        promptArgs: {
          TASK_ID: issue.id,
          ISSUE_TITLE: issue.title,
          BRANCH: issue.branch,
        },
      });

      // Only review if the implementer produced commits.
      if (implement.commits.length > 0) {
        const review = await sb.run({
          name: `review-${issue.id}`,
          maxIterations: 1,
          completionSignal: "<promise>COMPLETE</promise>",
          agent: sandcastle.claudeCode("claude-opus-4-6"),
          promptFile: "./.sandcastle/review-prompt.md",
          promptArgs: {
            BRANCH: issue.branch,
          },
        });

        return {
          ...review,
          commits: [...implement.commits, ...review.commits],
        };
      }

      return implement;
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
