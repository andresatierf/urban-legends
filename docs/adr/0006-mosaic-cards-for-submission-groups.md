# Render SubmissionGroups as mosaic cards in the review grid

When the Reviewer/Manager surface moved from a vertical list to an evidence-led grid, `SubmissionGroups` (Team Activity) needed a card treatment compatible with the "lead with a large evidence image" pattern. Groups don't have a single canonical evidence set — they aggregate per-submitter evidence — so we render the lead area as a mosaic of the first submitters' first images (1, 2, or 2×2 cells based on submitter count) with a `+N` overlay when more exist. The decision preserves grid uniformity (groups and individuals share card shape and dimensions) while signalling the team-aspect through visual multiplicity rather than a separate card layout.

## Considered options

- **Single representative image** (e.g. captain's first photo) — rejected: visually indistinguishable from an individual card, misleading at a glance.
- **Participant-led card layout** (avatar stack + participation rate prominent, evidence as a thumbnail strip) — rejected: more domain-precise but breaks grid uniformity and forks the visual treatment by submission type.
- **Explode the group into per-submitter cards** — rejected: loses the group-as-unit semantic, breaks the "Approve Team Activity" single action, and inflates the grid item count.

## Consequences

- Groups with one submitter render as a single-image card and become visually indistinguishable from individual submissions; the type badge ("Team Activity") is the only differentiator.
- The "+N" overlay is reused for two distinct meanings — additional evidence on individual cards, additional submitters on group cards. Reviewers learn the pattern from context.
- A future change in how teams produce evidence (e.g. a single shared photo per team) would invite revisiting this layout.
