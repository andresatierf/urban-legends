// Prune sandcastle worktrees (and branches) whose PR has already merged.
//
// `auto.ts` / `issues.ts` deliberately leave each agent's worktree under
// `.sandcastle/worktrees/` after a run so you can inspect it. Once that
// worktree's branch has landed via a merged PR, it's just clutter — this script
// removes those worktrees, deletes their local branches, and prunes git's
// worktree admin files.
//
// With `--orphans` it additionally sweeps local `agent/*` branches that no
// longer have a worktree (leftovers from earlier runs) and deletes the ones
// whose PR has merged.
//
// A branch is considered mergeable-away when `gh` reports a MERGED PR for it.
// Branches whose PR is still open, was closed without merging, or has no PR yet
// are left untouched.
//
// Run with:
//   bun .sandcastle/prune.ts            # remove merged worktrees + branches
//   bun .sandcastle/prune.ts --orphans  # ...also delete merged worktree-less branches
//   bun .sandcastle/prune.ts --dry-run  # show what would be removed
//   bun .sandcastle/prune.ts --force    # discard local changes when removing
//   bun .sandcastle/prune.ts --keep-branches  # remove worktrees, keep branches

import { execSync } from "node:child_process";

const sh = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const keepBranches = args.has("--keep-branches");
const orphans = args.has("--orphans");

// ---------------------------------------------------------------------------
// Build a merged-PR lookup once (branch head name → PR number)
// ---------------------------------------------------------------------------

// One API call covers both phases — a per-branch `gh pr list` would be dozens
// of round-trips in --orphans mode. Multiple merged PRs can share a head name
// over time; keep the first (most recent, since gh lists newest-first).
const mergedHeads = new Map<string, number>();
for (const pr of JSON.parse(
  sh("gh pr list --state merged --limit 1000 --json number,headRefName"),
) as { number: number; headRefName: string }[]) {
  if (!mergedHeads.has(pr.headRefName))
    mergedHeads.set(pr.headRefName, pr.number);
}

// ---------------------------------------------------------------------------
// Enumerate sandcastle worktrees and their branches
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Phase 1: prune merged worktrees (+ their branches)
// ---------------------------------------------------------------------------

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
      if (!keepBranches) console.log(`      git branch -D ${wt.branch}`);
      continue;
    }

    try {
      sh(`git worktree remove ${force ? "--force " : ""}${wt.path}`);
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

// ---------------------------------------------------------------------------
// Phase 2 (--orphans): delete merged agent/* branches with no worktree
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

if (!dryRun && (removedWorktrees > 0 || removedBranches > 0)) {
  const parts = [`${removedWorktrees} worktree(s)`];
  if (orphans) parts.push(`${removedBranches} orphaned branch(es)`);
  console.log(`\nPruned ${parts.join(" and ")}.`);
}
