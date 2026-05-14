# Adopt Fallow as a periodic code-health signal

Fallow (https://docs.fallow.tools/) is wired into the project as a non-blocking code-health signal, surfacing unused code, duplication, and complexity hotspots across three integration surfaces: CI (GitHub Actions), editor (VS Code extension), and agents (MCP server for Claude Code).

The decision is driven by a specific gap: dead code, duplicated logic, and complexity hotspots accumulate silently between PRs. Recent variant-exploration work (teams listing, tournament details, tournament listing) produced orphaned helpers, fixture files, and demo components that were cleaned up manually. Fallow automates the detection of these leftovers and flags them before they calcify.

## Integration surfaces

**CI (`.github/workflows/ci.yml`)** — A `code-health` job runs `fallow-rs/fallow@v2` on pull requests with `fail-on-issues: false`, `annotations: true`, and `comment: true`. It is deliberately *not* part of the `all-checks` gate — findings inform triage, they do not block merges. The job only runs on `pull_request` events to keep push-to-main builds fast.

**Editor (`.vscode/extensions.json`)** — The `fallow-rs.fallow-vscode` extension is recommended. It provides real-time LSP diagnostics (unused exports, files, dependencies), Code Lens reference counts, and quick-fix actions for removing dead code. Contributors see findings inline without having to remember to run a CLI.

**Agents (`.claude/settings.json`)** — The `fallow-mcp` server is configured as an MCP tool, giving Claude Code access to 20 Fallow analysis tools (`analyze`, `find_dupes`, `check_health`, `get_blast_radius`, `get_cleanup_candidates`, etc.). This is relevant because agents frequently touch this codebase and benefit from programmatic blast-radius estimation when refactoring shared primitives.

**CLI (`package.json`)** — `bun run fallow` runs all analyses locally; `bun run fallow:ci` runs with SARIF output and quiet mode.

## Configuration

`.fallowrc.json` excludes the same generated/output paths as oxlint and oxfmt (`convex/_generated/**`, `.output/**`, `.nitro/**`, `.tanstack/**`, `src/routeTree.gen.ts`). All rules default to `warn` severity — no rule produces an error, consistent with the "signal, not gate" principle.

Fallow auto-detects entry points from `package.json` fields and framework conventions (TanStack Start routes, Vitest tests, Tailwind config, etc.) via its 94 built-in plugins, so no manual entry-point configuration is needed.

## Considered options

- **ESLint `no-unused-vars` / `no-unused-imports`.** Already covered by oxlint at the single-file level. Does not detect unused *exports*, unused *files*, cross-file duplication, or complexity hotspots — the exact gaps Fallow fills.
- **knip.** Similar scope to Fallow (unused files/exports/deps). Fallow was preferred because it also covers duplication and complexity in one pass, has native GitHub Action with PR annotations/comments, offers an MCP server for agent integration, and provides a VS Code extension with LSP diagnostics — covering all three integration surfaces from the issue without stitching together separate tools.
- **jscpd (duplication only) + madge (circular deps only).** Narrower scope; would require two tools to cover what Fallow handles in one. Neither has PR annotation support or MCP integration.
- **Blocking gate from day one.** Rejected: the existing codebase has unquantified findings. A blocking gate would require a baseline-and-ratchet workflow before it could land, delaying the signal. Starting with `warn` and `fail-on-issues: false` gets findings visible immediately; promoting to a gate is a config change once the baseline is clean.

## Consequences

- PRs that touch flagged areas will see inline annotations and a summary comment from Fallow. Contributors should treat these as triage input, not mandates — review the finding, fix or suppress with `// fallow-ignore-next-line` if intentional.
- The `fallow-mcp` server requires the `fallow` binary on PATH (or in `node_modules/.bin/`). Running `npx fallow` once downloads it; the MCP server resolves the binary from `node_modules/.bin/` automatically.
- Fallow's free static layer is sufficient for the current scope. The paid runtime layer (V8 coverage integration, production hot-path analysis) is out of scope and not configured.
- Promoting Fallow to a blocking gate later requires: (1) running `npx fallow --save-baseline baseline.json` to snapshot current findings, (2) changing `fail-on-issues` to `true` and adding `--baseline baseline.json` in CI, (3) changing rules from `warn` to `error` in `.fallowrc.json`.
