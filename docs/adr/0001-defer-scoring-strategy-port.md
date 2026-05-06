# Defer scoring strategy port — single private helper for now

Configurable tournament formats (workstream 033) is on the product roadmap but currently paused, and exactly one scoring strategy is implemented today (tier × type × participation threshold). The Submissions lifecycle module keeps the points formula as a single private helper rather than introducing a `ScoringStrategy` interface and adapter — per the rule "one adapter means a hypothetical seam, two means a real one." When a second format ships with materially different rules (e.g. no tier concept, non-linear points), promote the helper to a port at that point; the call site will already be co-located inside the module, so the change is local.

## Considered options

- **Introduce the strategy port now.** Rejected: only one adapter exists, and a second is not in active development. The flexibility would be paid for at every call site (an extra layer of indirection) without any caller exercising it.
- **Hardcode the formula across the codebase as today.** Rejected: that is the friction this ADR's parent refactor is correcting.
