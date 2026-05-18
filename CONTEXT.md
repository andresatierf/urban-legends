# Urban Legends

Tournament tracking platform: administrators run **Tournaments**; participants form **Teams** and submit daily activity entries that are reviewed and scored.

## Language

### Domain entities

**Tournament**:
A scoring competition with a start date, end date, scoring rules, and team-size constraints.
_Avoid_: Event, contest, league.

**Team**:
A group of users participating together in exactly one **Tournament**. Carries a **JoinPolicy** that gates user-initiated **JoinRequests**.

**JoinPolicy**:
A **Team** attribute with values `open` or `closed`, controlling whether a **User** may initiate a **JoinRequest** (`initiator: "user"`). `open` permits user-initiated requests; `closed` rejects them. Captain-initiated invites (`initiator: "team"`) are unaffected by **JoinPolicy** in either state. **JoinPolicy** does _not_ hide a Team from listings or hide its roster — it is purely an authorisation gate on one side of the **JoinRequest** model.
_Avoid_: visibility, public/private (these terms imply concealment, which **JoinPolicy** does not provide).

**TeamMember**:
The relationship of a **User** to a **Team**, carrying their team-internal role (`captain` or `member`).
_Avoid_: Participant, player record.

**Captain**:
A **TeamMember** whose team-internal role is `captain` — responsible for the team's roster within their team.
_Avoid_: Team leader, team admin (the latter conflicts with the system **Admin** role).

**Submission**:
An activity entry made by a **User** for their **Team** on a given date, in one of `pending`, `approved`, `rejected`, `deleted` states. May be `individual` or `team` typed.

**Evidence**:
An image file attached to a **Submission**, required (1–5 per Submission) for review. Stored in Convex storage; re-encoded client-side before upload to drop EXIF metadata as a side effect of the canvas round-trip.
_Avoid_: photo, attachment, proof.

**SubmissionGroup**:
The aggregation of all **Submissions** by one **Team** on one date — used to compute team-exercise rollups.

**View**:
The composed read-model for one screen — bundles every entity, derived flag, enriched relation, and permission the screen needs so UI components consume the **View** whole instead of assembling it from many queries. A **View** is named after the screen it serves (`SubmissionView`, `AdminDashboardView`, `ReviewerQueueView`, …) and lives in `convex/views/`. Authority gating happens inside the **View** query; the **View** is the single seam between Convex and the screen.
_Avoid_: ViewModel, screen DTO, page data (the term **View** is the convention; instances are concrete).

**SubmissionView**:
A **View** — the composed read-model of a **Submission** as it appears on the detail screen — bundles the **Submission** with its **Team**, **Tournament**, **Submitter**, **Teammates** (for team-typed Submissions in non-terminal state), the **User** who managed the review (`managedBy`), the derived `isTeamExercise` flag, **Evidence** with resolved storage URLs, and the viewer's per-action permission flags.
_Avoid_: SubmissionDetails, submission-with-context.

**DashboardView**:
A **View** — the composed read-model of the home screen, scoped to a single **Tournament** that the viewer is a **TeamMember** of. Bundles the selected **Tournament** with its lifecycle state (`upcoming` / `active` / `ended-recent` / `ended-stale`) and timeline framing (day N of M, days-to-end); the viewer's **Team** in that tournament with its **rank**, **points**, and **gap** to the team directly above; the full ranked roster of competing **Teams** for the standings card; the viewer's submission count for today against `maxSubmissionsPerDay` (counting `pending` + `approved` only, never `rejected`) for the submit-today banner; the set of switchable tournaments the viewer participates in (active + ended within the grace window); and the viewer's actionable **JoinRequests** — `invite`-initiated requests addressed to them, plus `request`-initiated requests addressed to **Teams** they captain. Does _not_ include cross-tournament aggregates, personal-stat rollups (streaks, weekly approved), activity feeds, or operator stats — those are not the screen's job.
_Avoid_: HomeView, PlayerDashboard (the screen is role-adaptive, not player-only — Operators see the same view when wearing their player hat).

**JoinRequest**:
An outstanding intent for a **User** to become a **TeamMember** of a **Team**. Created by either `request` (User-initiated) or `invite` (Team-initiated); both produce the same row shape, distinguished by an `initiator` field. Resolved by `accept` (recipient — produces a **TeamMember**), `reject` (recipient), `cancel` (initiator), or `expire` (timeout).
_Avoid_: invitation, application, membership offer (these described the two halves separately before unification).

**NotificationEvent**:
A value produced by a domain transition that warrants user-facing notification. A discriminated union over a fixed vocabulary of transitions (e.g. `submission.approved`, `joinRequest.accepted`, `role.granted`). Carries only the IDs needed to identify the transition; the **Notifier** reads everything else from the DB. Lifecycle modules return `{ result, events: NotificationEvent[] }` from mutating functions; public mutations forward `events` to the **Notifier**. Scope is intentionally narrow — this is _not_ a generic domain-event bus and has no subscribers other than the **Notifier**.
_Avoid_: DomainEvent (overstates scope), Trigger (overloads cron/db terminology), Notification (that name is taken by the persisted row).

**Notifier**:
The deepened module that consumes **NotificationEvents** and fans them out to one or more persisted **Notifications**. Owns the mapping from each transition to its audiences, copy, and `actionMetadata`. Public mutations call `Notifier.publish(events)` once; the **Notifier** schedules an internal dispatch mutation per event, which reads the referenced entities and enqueues `internal.notifications.create` calls. Single source of truth for "who hears about what" — adding a new audience for an existing transition is a one-file change.
_Avoid_: NotificationDispatcher, NotificationOrchestrator (longer without adding clarity), Triggers (the predecessor module name; deliberately retired).

### Roles & authorization

Roles split on **two axes**: where they're stored, and the kind of authority they grant.

**System role**:
A role granting platform-wide authority, stored in `userRoles`. Today: `dev`, `admin`, `organizer`.

**Organizer**:
A **System role** whose sole privilege is creating new **Tournaments**. An **Organizer** does not gain authority over **Tournaments** they did not create.
_Avoid_: Creator, host (both overload other concepts).

**Tournament role**:
A role granting authority over exactly one **Tournament**, stored in `tournamentRoles`. Today: `tournament_manager`, `reviewer`.
_Avoid_: scoped role, per-tournament role (use **Tournament role** consistently).

**Player**:
A **User** who has at least one **TeamMember** record in some team belonging to a given **Tournament**. Derived from `teamMembers`, never stored as a role.
_Avoid_: participant (the term "participant" overlaps with **TeamMember**).

**Authority**:
The deepened module that answers "can this **User** perform this action on this subject?" — composes **System role**, **Tournament role**, **TeamMember**, and **Captain** status into a single source of truth for permission decisions.
_Avoid_: ACL, permissions module, auth (the latter is reserved for authentication via Clerk).

### Authority composition rules

The **Authority** module composes three independent axes:

1. **System axis** (override): `dev` and `admin` grant _every_ permission, system-wide. `organizer` is a sibling that grants only "create new **Tournament**" — it does not cascade into management of any **Tournament**.
2. **Tournament axis** (per-tournament, linear): `tournament_manager` > `reviewer`. A `tournament_manager` of Tournament T inherits `reviewer` privileges in T only.
3. **Team axis** (per-team): **Captain** status, derived from `teamMembers.role`.

When an **Organizer** creates a **Tournament**, the **Authority** module grants them `tournament_manager` of that **Tournament** as a side effect of creation.

### JoinRequest rules

1. **Asymmetric rejection lockout**: a `rejected` **JoinRequest** blocks the **User**-direction `request` for the same (User, Team) pair, so a rejected user cannot keep pestering the team. The **Team**-direction `invite` is _not_ blocked — a **Captain** who rejected by mistake (or changed their mind) may re-invite the same user.
2. **Expiry**: every **JoinRequest** carries a required `expiresAt` of 7 days from creation, in either direction. A `pending` row past its `expiresAt` is `expired` on next observation.
3. **Pre-accept capacity**: `accept` rejects if accepting would exceed the **Team**'s **Tournament**-defined size cap. Enforced inside the lifecycle module so every accept path (public mutation, future admin tooling, tests) sees the same rule.
4. **Pre-accept uniqueness**: `accept` rejects if the **User** is already a **TeamMember** of any other **Team** in the same **Tournament**. The companion to rule 5 (cascade) — this rule handles the already-accepted case, cascade handles the pending case.
5. **Cascade on accept**: when a **JoinRequest** is `accepted` and produces a **TeamMember** in **Tournament** T, all _other_ pending **JoinRequests** for the same **User** in any **Team** of T are `cancelled` — together with rule 4, a User cannot be a **TeamMember** of two **Teams** in the same **Tournament**.

## Relationships

- A **Tournament** has many **Teams**.
- A **Team** has many **TeamMembers**, exactly one of whom is its **Captain**.
- A **Team** has many **Submissions**; each **Submission** belongs to exactly one **Team** and one **User**.
- **Submissions** by one **Team** on one date are aggregated into a **SubmissionGroup**.
- A **JoinRequest** links a **User** to a **Team**; on `accept` it produces a **TeamMember**.
- A **User** may have any number of **System roles** and any number of **Tournament roles** (the latter scoped per **Tournament**).
- A **User** is a **Player** of a **Tournament** iff they have a **TeamMember** in any of its **Teams**.
- The **Authority** module decides every permission question by reading **System roles**, **Tournament roles**, and **TeamMember** state.

## Example dialogue

> **Dev:** "Can a **Reviewer** for Tournament A approve a **Submission** belonging to Tournament B?"
> **Domain expert:** "No — **Tournament roles** apply only to the **Tournament** they were granted in. **Authority** must read the **Submission**'s tournament before checking."
>
> **Dev:** "What about an **Admin**?"
> **Domain expert:** "Yes — **System roles** apply across all **Tournaments**."
>
> **Dev:** "If a **User** is a **Captain** of one team and a regular **TeamMember** of another, are they considered a **Player** in both **Tournaments**?"
> **Domain expert:** "Yes — **Player** is per-**Tournament**, derived from any **TeamMember** record in that **Tournament**."

## Testing conventions

Convex test files live alongside their source file in the same directory — not in a `__tests__/` subdirectory. A module at `convex/foo/bar.ts` is tested by `convex/foo/bar.test.ts`. Test helpers shared within a module (e.g. `invariants.ts`) follow the same rule. The `vitest.config.ts` glob `convex/**/*.test.ts` picks up files at any depth, so no config change is needed when adding tests.

## Flagged ambiguities

- The legacy roles `player` and `viewer` were stored in `userRoles` but expressed nothing the system needed: `player` is now derived from **TeamMember**; `viewer` is the absence of any role and was deleted. Legacy rows of either type are deleted on migration.
- Pre-migration `tournament_manager` and `reviewer` rows in `userRoles` are deleted — not promoted into `tournamentRoles` — because the application has no production users yet.
- "Authentication" (Clerk identity) and "**Authority**" (permission decisions) are distinct — never collapse them under "auth".
