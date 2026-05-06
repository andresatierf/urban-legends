# Urban Legends

Tournament tracking platform: administrators run **Tournaments**; participants form **Teams** and submit daily activity entries that are reviewed and scored.

## Language

### Domain entities

**Tournament**:
A scoring competition with a start date, end date, scoring rules, and team-size constraints.
_Avoid_: Event, contest, league.

**Team**:
A group of users participating together in exactly one **Tournament**.

**TeamMember**:
The relationship of a **User** to a **Team**, carrying their team-internal role (`captain` or `member`).
_Avoid_: Participant, player record.

**Captain**:
A **TeamMember** whose team-internal role is `captain` — responsible for the team's roster within their team.
_Avoid_: Team leader, team admin (the latter conflicts with the system **Admin** role).

**Submission**:
An activity entry made by a **User** for their **Team** on a given date, in one of `pending`, `approved`, `rejected`, `deleted` states. May be `individual` or `team` typed.

**SubmissionGroup**:
The aggregation of all **Submissions** by one **Team** on one date — used to compute team-exercise rollups.

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

1. **System axis** (override): `dev` and `admin` grant *every* permission, system-wide. `organizer` is a sibling that grants only "create new **Tournament**" — it does not cascade into management of any **Tournament**.
2. **Tournament axis** (per-tournament, linear): `tournament_manager` > `reviewer`. A `tournament_manager` of Tournament T inherits `reviewer` privileges in T only.
3. **Team axis** (per-team): **Captain** status, derived from `teamMembers.role`.

When an **Organizer** creates a **Tournament**, the **Authority** module grants them `tournament_manager` of that **Tournament** as a side effect of creation.

## Relationships

- A **Tournament** has many **Teams**.
- A **Team** has many **TeamMembers**, exactly one of whom is its **Captain**.
- A **Team** has many **Submissions**; each **Submission** belongs to exactly one **Team** and one **User**.
- **Submissions** by one **Team** on one date are aggregated into a **SubmissionGroup**.
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

## Flagged ambiguities

- The legacy roles `player` and `viewer` were stored in `userRoles` but expressed nothing the system needed: `player` is now derived from **TeamMember**; `viewer` is the absence of any role and was deleted. Legacy rows of either type are deleted on migration.
- Pre-migration `tournament_manager` and `reviewer` rows in `userRoles` are deleted — not promoted into `tournamentRoles` — because the application has no production users yet.
- "Authentication" (Clerk identity) and "**Authority**" (permission decisions) are distinct — never collapse them under "auth".
