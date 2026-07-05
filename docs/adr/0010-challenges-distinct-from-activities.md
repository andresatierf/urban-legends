---
status: accepted
---

# Challenges are a distinct entity, not an extension of Activities

A **Challenge** (see `CONTEXT.md`) is a tournament-wide, organizer-run scoring opportunity: a `tournament_manager` sets two point amounts and a participation threshold, records a flat roster of participating Users across any teams, and approves once — awarding each team the team amount (roster rate ≥ threshold) or the individual amount, into the shared leaderboard.

We considered modelling this by overloading the existing team-scoped `activities` table (adding optional point-override fields and a tournament-wide flag). We rejected that: an Activity is team-scoped, requires evidence, flows through a reviewer queue, and is scored from the tournament's `scoringConfig`. A Challenge has none of those — no evidence, no per-participant submission, no reviewer queue, a cross-team roster, and organizer-set points decoupled from `scoringConfig`. Folding two entities with opposite lifecycles into one table would force most `activities` fields to become conditionally-meaningful and fork every activity code path on a "is this a challenge?" branch.

Challenges therefore get their own table and lifecycle. They share only the outcome surface with Activities: awarded points land in `teams.points` and move the same leaderboard rank.
