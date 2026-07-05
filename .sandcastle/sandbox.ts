// Shared sandbox config for the orchestrators (`auto.ts`, `issues.ts`,
// `fix.ts`). Auth is inherited from the host:
//   - Claude: ~/.claude + ~/.claude.json are bind-mounted (host's logged-in
//     session).
//   - GitHub: the host gh token is injected as GH_TOKEN, and onSandboxReady
//     wires gh's credential helper so pushes to the pre-configured `agent-origin`
//     HTTPS remote auth without SSH keys or touching `origin`.
//   - Git author: read from the host gitconfig, passed as env vars.

import { execSync } from "node:child_process";

import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

export const sh = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();

const ghToken = sh("gh auth token");
const gitName = sh("git config user.name");
const gitEmail = sh("git config user.email");

export const sandbox = docker({
  mounts: [
    { hostPath: "~/.claude", sandboxPath: "~/.claude" },
    { hostPath: "~/.claude.json", sandboxPath: "~/.claude.json" },
    { hostPath: "~/CLAUDE.md", sandboxPath: "~/CLAUDE.md" },
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
      { command: "gh auth setup-git" }, // credential helper for agent-origin
      { command: "bun install" }, // refresh platform-specific deps
    ],
  },
};

export const copyToWorktree = ["node_modules", ".env.local"];
