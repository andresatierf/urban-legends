// Shared sandbox configuration for the sandcastle orchestrators
// (`auto.ts` and `issues.ts`).
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

import { execSync } from "node:child_process";

import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

export const sh = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();

// Resolve host credentials/config once so we can pass them into the container.
const ghToken = sh("gh auth token");
const gitName = sh("git config user.name");
const gitEmail = sh("git config user.email");

export const sandbox = docker({
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

export const hooks = {
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

export const copyToWorktree = ["node_modules", ".env.local"];
