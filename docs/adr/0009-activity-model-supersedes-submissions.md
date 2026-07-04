# Activity model supersedes Submission + SubmissionGroup

## Status

Accepted — supersedes the submissions-module refactor tracked in #79–#85, and amends [ADR-0002](./0002-require-evidence-on-submissions.md).

## Context

Today a team's daily effort is modelled bottom-up: **every** participating member creates their own **Submission** row, and the system stitches those rows together after the fact into a **SubmissionGroup** to compute team-exercise rollups (`participationRate`, `isTeamExercise`, group points). This has two costs:

- **Every member must independently create a submission.** There is no single object that represents "the team did X today" until the grouping runs. Coordination is implicit and reconstructed, never declared.
- **The aggregate is emergent, not intentional.** Whether a day counts as a team exercise falls out of how many members happened to submit on the same date, rather than being stated by the team. The `SubmissionGroup` cascade logic (join-or-create on submit, recompute on approve/reject/edit/delete) is spread across the lifecycle module because the aggregate is derived rather than first-class.

We want the aggregate to be the primary object: one member records the effort and declares who took part; proof-gathering stays distributed (each named member supplies their own Evidence); the reviewer judges one unit.

## Decision

- **Introduce `Activity` as the aggregate root**, retiring both the top-level `Submission` and the `SubmissionGroup`. An **Activity** is what a **Team** does on a date. One **TeamMember** (any member, not Captain-gated) creates it, choosing `type: individual | group` and — for a group — **declaring the participant roster at creation**.
- **Introduce `Participation` as the per-member child**, retiring the per-member `Submission`. A `Participation` carries one member's **Evidence** (1–5 images) and a `fulfilledAt` timestamp; it holds **no review state of its own**. An individual Activity has exactly one Participation (the creator's); a group Activity has one per declared member.
- **Review state lives on the `Activity`, not the `Participation`.** A reviewer approves or rejects the team's effort as one unit. State machine:

  ```
  incomplete ──(last declared participant uploads Evidence)──▶ pending ──approve──▶ approved
      │  ▲                                                        └──reject──▶ rejected
      │  └──── creator/Captain edits roster ───────────────────────┘
      └── deleted (soft, from any non-terminal state)
  ```

  `incomplete → pending` fires automatically when the final outstanding Evidence lands. `pending` is the only reviewable state (`ReviewerQueueView` filters on it).
- **An Activity cannot be approved until every declared participant has provided Evidence.** Completeness is a hard gate, so at approve-time the fulfilled set equals the declared set — there is no declared-vs-fulfilled ambiguity in scoring.
- **Scoring counts fulfilled Participations.** `participationRate = fulfilledParticipations / teamSize`; `isTeamExercise = participationRate ≥ teamExerciseThreshold` (rule unchanged from the SubmissionGroup era). Per-member points live on each `Participation`; the rolled-up total lives on the `Activity`. Per [ADR-0001](./0001-defer-scoring-strategy-port.md), `score()` remains a single private helper — still one scoring strategy.
- **Deadlock release valve.** A declared member who never uploads would freeze an Activity in `incomplete`. The **creator or the Team's Captain** may remove a participant from the roster while the Activity is `incomplete` or `pending`; removal is **blocked once `approved`**. When removal shrinks the roster to "everyone remaining is fulfilled," the Activity auto-promotes to `pending`.
- **An approved Activity's score is immutable.** Corrections go through `reject → fix → re-approve`; reject reopens and clears the score. No silent post-approval roster edits.
- **`maxSubmissionsPerDay` becomes `maxActivitiesPerDay`**, capping distinct Activities per **Team** per date (the cap was always really "how many efforts count," and the effort was the group). Many Activities per (team, date) are allowed.
- **Amends ADR-0002**: "Evidence lives on the Submission row" becomes "Evidence lives on the `Participation` row." Every claimed participant still independently proves presence — the 1–5 image rule, Convex storage, orphan sweep, and two-step upload flow are unchanged.

## Considered alternatives

- **Keep `Submission`, redefine it as the per-member child of `Activity`.** Rejected — the word's *scope* inverts (top-level aggregate → child), and preserving a familiar name whose meaning has flipped is more confusing than retiring it. Starting clean with `Participation` ties the entity to the existing scoring vocabulary (`participationRate`, `participantCount`).
- **Review state per `Participation` (approve Alice, reject Bob for the same effort).** Rejected — larger interface, and nothing in the product asks a reviewer to split a verdict across one team's single effort. State-on-Activity keeps the lifecycle interface deep (`create → submitEvidence → approve/reject`).
- **Emergent roster (participation still inferred from who uploads).** Rejected — the whole point is that one member *declares* the effort. An explicit roster makes the reviewer's "who is still outstanding" view trivial and drives the "you were included, upload your proof" notification.
- **Score by declared roster rather than fulfilled Evidence.** Rejected — gameable: declare the whole team, one person uploads, everyone earns the coordinated-effort bonus with no proof. Evidence is the basis of review (ADR-0002); credit must follow it.
- **Allow partial approval / post-approval roster edits with recompute.** Rejected — a mutable approved score undermines leaderboard integrity. `reject`-to-reopen already un-freezes an Activity when a genuine correction is needed, reusing an existing transition.
- **Sequence the #79–#85 submissions refactor first, then remodel.** Rejected — that refactor splits, re-seams, and prunes a module we are about to delete. Its good ideas (the View seam, the module split into `views`/`mutations`) are folded into the Activity build instead; the issues are superseded.
