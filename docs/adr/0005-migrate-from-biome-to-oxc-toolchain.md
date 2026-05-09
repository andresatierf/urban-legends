# Migrate lint and format from Biome to the Oxc toolchain (oxlint + oxfmt)

We're replacing `@biomejs/biome` with `oxlint` for linting and `oxfmt` for formatting. The motivation is cross-project consistency — the same toolchain is used in adjacent repos — and trajectory alignment with Vite/Rolldown, which already build on Oxc. The migration ships as a single PR with three commits (config/scripts swap; tree-wide `oxlint --fix` pass; tree-wide `oxfmt --write` pass), and the SHAs of the latter two are recorded in `.git-blame-ignore-revs` so `git blame` walks through the cosmetic churn.

## Considered options

- **Keep Biome.** Rejected: cross-project context-switch tax + trajectory drift outweigh Biome's current ecosystem maturity.
- **Lint-only first, format later.** Rejected: chose to absorb the `oxfmt` diff in the same PR rather than gate the format swap on a separate spike.
- **Keep Biome installed for `useSortedClasses` only.** Moot: `oxfmt` sorts Tailwind classes natively, so no Biome remnant is needed.

## Consequences

- Loss of Biome's combined `check` / `check:fix` / `ci` modes; replaced by explicit `oxlint && oxfmt` chains in `package.json`, `lefthook.yml`, and `.github/workflows/ci.yml`.
- The migration PR may disable a small number of `oxlint`-recommended rules in `oxlintrc.json` to preserve shape (no rule-tightening). Disabled rules go into a follow-up issue.
- `.git-blame-ignore-revs` requires per-clone setup (`git config blame.ignoreRevsFile .git-blame-ignore-revs`) for local blame to honor it; GitHub honors it automatically.
