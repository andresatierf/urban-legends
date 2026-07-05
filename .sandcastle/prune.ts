// Prune sandcastle worktrees (and branches) whose PR has already merged — the
// runs deliberately leave worktrees under `.sandcastle/worktrees/` for
// inspection, and this clears the ones that have landed. A branch counts as
// mergeable-away only when `gh` reports a MERGED PR for it; open, closed, or
// PR-less branches are left alone.
//
// Run with:
//   bun .sandcastle/prune.ts            # remove merged worktrees + branches
//   bun .sandcastle/prune.ts --orphans  # ...also delete merged worktree-less branches
//   bun .sandcastle/prune.ts --dry-run  # show what would be removed
//   bun .sandcastle/prune.ts --force    # discard local changes when removing
//   bun .sandcastle/prune.ts --keep-branches  # remove worktrees, keep branches

import { execSync } from "node:child_process";

const sh = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();

// Best-effort mirror of the `zoxide add` in execute.ts, so removed worktrees
// don't linger as dead `z` entries. Never let a missing zoxide abort a prune.
const zoxideRemove = (worktreePath: string): void => {
  try {
    execSync(`zoxide remove ${JSON.stringify(worktreePath)}`, {
      stdio: "ignore",
    });
  } catch {}
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const keepBranches = args.has("--keep-branches");
const orphans = args.has("--orphans");

// Merged-PR lookup (head branch → PR number). One API call covers both phases;
// a per-branch query would be dozens of round-trips in --orphans mode. When
// several merged PRs share a head name, keep the first (gh lists newest-first).
const mergedHeads = new Map<string, number>();
for (const pr of JSON.parse(
  sh("gh pr list --state merged --limit 1000 --json number,headRefName"),
) as { number: number; headRefName: string }[]) {
  if (!mergedHeads.has(pr.headRefName))
    mergedHeads.set(pr.headRefName, pr.number);
}

type Worktree = { path: string; branch: string };

// `git worktree list --porcelain` emits blank-line-separated blocks:
//   worktree <path>
//   HEAD <sha>
//   branch refs/heads/<name>   (absent when detached)
const parseWorktrees = (): Worktree[] => {
  const out: Worktree[] = [];
  for (const block of sh("git worktree list --porcelain").split("\n\n")) {
    const path = block.match(/^worktree (.+)$/m)?.[1];
    const ref = block.match(/^branch refs\/heads\/(.+)$/m)?.[1];
    // Only touch sandcastle-managed worktrees on a branch; skip the main
    // checkout and any detached-HEAD worktrees.
    if (path && ref && path.includes("/.sandcastle/worktrees/")) {
      out.push({ path, branch: ref });
    }
  }
  return out;
};

// Prune merged worktrees (+ their branches).
let removedWorktrees = 0;
const worktrees = parseWorktrees();

const merged = worktrees
  .map((wt) => ({ ...wt, pr: mergedHeads.get(wt.branch) }))
  .filter((wt): wt is Worktree & { pr: number } => wt.pr !== undefined);

for (const wt of worktrees) {
  if (!mergedHeads.has(wt.branch)) {
    console.log(`  · keeping ${wt.branch} (no merged PR)`);
  }
}

if (merged.length === 0) {
  console.log("No worktrees linked to merged PRs.");
} else {
  console.log(
    `\n${dryRun ? "[dry-run] would prune" : "Pruning"} ${merged.length} merged worktree(s):`,
  );
  for (const wt of merged) {
    const label = `#${wt.pr} ${wt.branch}`;
    if (dryRun) {
      console.log(`  ✓ ${label}`);
      console.log(
        `      git worktree remove ${force ? "--force " : ""}${wt.path}`,
      );
      console.log(`      zoxide remove ${wt.path}`);
      if (!keepBranches) console.log(`      git branch -D ${wt.branch}`);
      continue;
    }

    try {
      sh(`git worktree remove ${force ? "--force " : ""}${wt.path}`);
      zoxideRemove(wt.path);
      // Branch commits landed via a (possibly squash) merge, so use -D — the
      // tips may not be ancestors of HEAD by name and -d would refuse.
      if (!keepBranches) sh(`git branch -D ${wt.branch}`);
      console.log(`  ✓ removed ${label}`);
      removedWorktrees++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${label}: ${msg.split("\n")[0]}`);
      console.error(
        `      (worktree may have local changes — retry with --force)`,
      );
    }
  }

  if (!dryRun && removedWorktrees > 0) {
    // Clean up git's now-stale worktree bookkeeping under .git/worktrees.
    sh("git worktree prune");
  }
}

// --orphans: delete merged agent/* branches that have no worktree.
let removedBranches = 0;
if (orphans && keepBranches) {
  console.log("\n--orphans has no effect with --keep-branches; skipping.");
} else if (orphans) {
  // Re-read worktrees so any branch just removed in phase 1 isn't miscounted as
  // still-attached (its branch is gone; it simply won't appear here).
  const attached = new Set(parseWorktrees().map((wt) => wt.branch));
  const localAgentBranches = sh(
    "git for-each-ref --format='%(refname:short)' refs/heads/agent/",
  )
    .split("\n")
    .filter(Boolean);

  const orphanMerged = localAgentBranches
    .filter((b) => !attached.has(b))
    .map((b) => ({ branch: b, pr: mergedHeads.get(b) }))
    .filter((o): o is { branch: string; pr: number } => o.pr !== undefined);

  if (orphanMerged.length === 0) {
    console.log("\nNo merged orphaned branches to prune.");
  } else {
    console.log(
      `\n${dryRun ? "[dry-run] would delete" : "Deleting"} ${orphanMerged.length} merged orphaned branch(es):`,
    );
    for (const o of orphanMerged) {
      const label = `#${o.pr} ${o.branch}`;
      if (dryRun) {
        console.log(`  ✓ ${label}`);
        console.log(`      git branch -D ${o.branch}`);
        continue;
      }
      try {
        sh(`git branch -D ${o.branch}`);
        console.log(`  ✓ deleted ${label}`);
        removedBranches++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${label}: ${msg.split("\n")[0]}`);
      }
    }
  }
}

if (!dryRun && (removedWorktrees > 0 || removedBranches > 0)) {
  const parts = [`${removedWorktrees} worktree(s)`];
  if (orphans) parts.push(`${removedBranches} orphaned branch(es)`);
  console.log(`\nPruned ${parts.join(" and ")}.`);
}
