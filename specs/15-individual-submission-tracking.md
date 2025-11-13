# Individual Submission Tracking & Multi-Member Verification

**Priority:** HIGH
**Status:** Design Phase
**Estimated Effort:** 5-7 days

## Executive Summary

The current submission system tracks team-based submissions with an optional "teammates" array, but it has a critical flaw: it doesn't enforce that ALL participating team members individually submit and verify their participation. This spec proposes a data model redesign that requires individual member submissions while preventing double-counting of points through a grouped submission system.

**Primary Benefits:**
- Ensures accountability - every participant must personally confirm their activity
- Prevents one member from submitting on behalf of others
- Maintains accurate participation tracking for team exercise threshold calculations
- Eliminates double-counting of points through submission grouping

**Timeline:** Medium complexity - requires schema changes, migration strategy, and UI updates across submission flow

## Problem Statement

### Current System Issues

With the existing `submissions` table structure:

```typescript
submissions: {
  userId: Id<"users">,           // Who created the submission
  teamId: Id<"teams">,
  tournamentId: Id<"tournaments">,
  date: string,
  teammates: Id<"users">[],      // Who participated (optional array)
  state: "pending" | "approved" | "rejected" | "deleted",
  tier: "base" | "advanced",
  pointsEarned: number,
}
```

**Problems:**

1. **No Individual Accountability:** One member can submit for the entire team without others confirming
2. **Ambiguous Participation:** The `teammates` array doesn't track WHO actually submitted vs who was listed
3. **No Verification Mechanism:** Listed teammates never see or approve their inclusion
4. **Approval Confusion:** If one submission gets rejected, should it affect all listed participants?
5. **Double-Counting Risk:** If multiple members submit the same activity, points could be awarded multiple times
6. **Incomplete Participation Data:** Can't track which members consistently participate vs ride along

### Real-World Scenario

**Current Broken Flow:**
1. Alice, Bob, and Charlie do a team workout together
2. Alice creates a submission listing Bob and Charlie as teammates
3. Bob and Charlie never confirm they participated
4. Admin approves, team gets points
5. **Problem:** Bob might submit the same workout again, earning duplicate points

**New Flow - Team Activity:**
1. Alice, Bob, and Charlie do a team workout together
2. Alice creates submission for 2025-01-15, selects "Team Activity"
3. Bob creates submission for 2025-01-15, selects "Team Activity" (joins same group)
4. Charlie creates submission for 2025-01-15, selects "Team Activity" (joins same group)
5. System creates ONE submission group with 3 participants
6. Admin approves the group once
7. Team gets points ONCE based on 3/3 members participating (100% = team exercise)

**New Flow - Individual Activity:**
1. Alice does a solo workout on 2025-01-15
2. Alice creates submission for 2025-01-15, selects "Individual Activity"
3. Submission remains standalone (not grouped)
4. Admin approves Alice's individual submission
5. Team gets individual exercise points
6. **Note:** Bob can also do a different individual workout on 2025-01-15 (multiple individual activities allowed per day)

**Mixed Flow - Same Day:**
1. Alice does individual workout in morning (submission type: "individual")
2. Later that day, Alice, Bob, and Charlie do team workout together
3. Alice, Bob, Charlie each create "Team Activity" submissions for same date
4. Result: Alice has TWO submissions for the day (one individual, one team)
5. Both submissions can be approved independently

## Requirements

### Functional Requirements

1. **Individual Submission Required**
   - Each participating team member must create their own submission for an activity
   - Users explicitly indicate if the activity was done alone (individual) or with teammates (team activity)
   - Cannot submit on behalf of another member

2. **Daily Submission Limit**
   - Tournament organizers define `maxSubmissionsPerDay` when creating tournament
   - Limit applies to total submissions per user per day (individual + team combined)
   - Default: No limit (null/undefined = unlimited submissions)
   - Example: If limit = 3, user can create max 3 submissions on a given day (any combination of individual/team)
   - Validation enforced at submission creation time

3. **Submission Grouping**
   - Only submissions marked as "team activity" are grouped together
   - Submissions marked as "individual" remain standalone and are NOT grouped
   - **Constraint:** Only ONE team activity group allowed per team per day
   - **Flexibility:** Multiple individual activities can occur on the same day (up to daily limit)
   - Group status derived from individual submission states
   - One approval action affects the entire team activity group
   - Points calculated based on group participation rate

4. **Participation Tracking**
   - Track which members submitted for each team activity date
   - Calculate participation rate: `submitted_members / total_team_members` (for team activities only)
   - Individual activities: participation rate is always 1 (just the submitter)
   - Distinguish between individual exercise and team exercise based on participation rate threshold

5. **Approval Workflow**
   - **Team Activities:** Admin reviews grouped submissions together
     - Single approval/rejection applies to all submissions in group
     - All individual submissions in group transition to same state
     - Points awarded ONCE per group, not per submission
   - **Individual Activities:** Admin reviews and approves each submission independently
     - Each individual submission earns individual exercise points
     - No grouping or coordination required

6. **No Double-Counting**
   - Points awarded at group level, stored on each individual submission
   - Recalculation uses group-based logic
   - Deleting one submission doesn't affect group points unless it changes the participation rate significantly

7. **Member Awareness**
   - Members can see who else from their team submitted for a given date
   - Visual indicators show incomplete team participation
   - Dashboard highlights missing submissions

### Non-Functional Requirements

- Backward compatibility with existing submissions during migration
- Group queries execute in &lt;300ms
- Approval mutation updates all grouped submissions atomically
- Real-time UI updates show teammate submission status
- Support up to 20 members per team efficiently

## Current State Analysis

### Current Data Model

**Submissions Table:**
- `userId`: Creator of submission
- `teammates`: Array of participating user IDs (optional, may be empty)
- One row per submission
- Points calculated as: `participantCount = teammates.length + 1`

**Current Scoring Logic (from `submissions.approve`):**

```typescript
const totalTeamMembers = teamMembers.length;
const participantCount = Math.min(
  totalTeamMembers,
  submission.teammates.length + 1,  // Submitter + listed teammates
);
const participationRate = totalTeamMembers > 0
  ? participantCount / totalTeamMembers
  : 0;
const isTeamExercise = participationRate >= scoringConfig.teamExerciseThreshold;
```

**Issues:**
- Relies on submitter's honesty about who participated
- No verification from listed teammates
- No mechanism to detect duplicate submissions

### Current Submission Form

**Location:** `src/components/form/upsert-submission-form.tsx`

**Current Flow:**
1. User selects team and date
2. Optional: Adds description
3. Selects tier (base/advanced)
4. **Optional: Adds teammates from combobox (array field)**
5. Submits

**Current teammates implementation:**
- Dynamic array field with combobox selection
- Can add 0 to `teamMaxSize - 1` teammates
- No validation that teammates also submitted

### Current Calendar UI

**Location:** `src/components/submissions/calendar-date-cell.tsx`

**Current Display:**
- Shows one submission per date per user
- Color-coded by state (pending/approved/rejected)
- Points displayed if approved

**Missing:**
- No indication of team participation
- No way to see who else submitted
- No "awaiting team members" state

## Proposed Solution

### Option A: Submission Groups (Recommended)

Create a new `submissionGroups` table that aggregates individual submissions.

#### Architecture

**Individual Submissions:** Users still create individual `submission` records
**Automatic Grouping:** System creates/updates a `submissionGroup` when submissions share `teamId + date`
**Group-Based Approval:** Admin approves the group, which cascades to individual submissions
**Point Calculation:** Happens at group level based on participation rate

#### Advantages

✅ Clear separation of concerns (individual tracking vs group scoring)
✅ Maintains audit trail (who submitted when)
✅ Easy to implement approval workflow (one group action)
✅ Natural fit for existing UI patterns (admin reviews groups)
✅ Straightforward migration path
✅ Enables rich participation analytics

#### Disadvantages

❌ Additional table increases complexity
❌ Requires triggers/hooks to keep groups in sync
❌ Need to migrate existing submissions to groups

### Option B: Virtual Grouping (Query-Time)

No new table - group submissions at query time using `teamId + date`.

#### Architecture

**Submissions Table:** Remove `teammates` field entirely
**Query-Time Grouping:** Queries aggregate by `(teamId, date)` to create virtual groups
**Approval Logic:** Mutation finds all submissions in group and updates them
**Point Calculation:** Happens during approval by counting related submissions

#### Advantages

✅ Simpler schema (no new table)
✅ No sync issues (groups derived from data)
✅ Easier migration (just remove `teammates` field)

#### Disadvantages

❌ Complex queries (always need to aggregate)
❌ Performance concerns (grouping on every query)
❌ Harder to cache group state
❌ Approval mutation more complex (find all, then update all)
❌ No single source of truth for group metadata

### Option C: Confirmation System

Keep current structure but add `submissionConfirmations` table.

#### Architecture

**Submissions Table:** Creator's submission with `teammates` array
**Confirmations Table:** Other members confirm their participation
**Hybrid Approval:** Admin approves submission after all confirmations received
**Point Calculation:** Based on confirmations + original submission

#### Advantages

✅ Minimal changes to existing submission flow
✅ Preserves "someone initiates, others confirm" pattern

#### Disadvantages

❌ Confusing UX (why is one person's submission special?)
❌ Doesn't solve double-submission problem
❌ Complex state management (pending confirmations)
❌ Still relies on someone else initiating

### Recommended Approach: Option A (Submission Groups)

**Rationale:**
- Most scalable and maintainable long-term
- Clear data model that matches domain logic
- Best enables future features (e.g., group comments, attachments)
- Provides clean audit trail
- Simplifies admin approval workflow

## Technical Design

### Database Schema Changes

#### Modified: `tournaments` Table

```typescript
// convex/schema.ts

tournaments: defineTable({
  // ... existing fields ...
  maxSubmissionsPerDay: v.optional(v.number()), // NEW - limit submissions per user per day
  // null/undefined = unlimited
  // Examples: 1 (one submission per day), 3 (up to three per day), etc.
})
```

**Purpose:**
- Allows tournament organizers to control activity volume
- Prevents submission spam or gaming the system
- Flexible: can be set to any positive number or left unlimited
- **Default:** Unlimited (backwards compatible)

**Validation:**
- Must be positive integer if set
- Recommended range: 1-10 submissions per day
- Applied at submission creation time

#### Modified: `submissions` Table

```typescript
// convex/schema.ts

submissions: defineTable({
  userId: v.id("users"),                    // Who submitted (UNCHANGED)
  teamId: v.id("teams"),                    // UNCHANGED
  tournamentId: v.id("tournaments"),        // UNCHANGED
  date: v.string(),                         // YYYY-MM-DD (UNCHANGED)
  description: v.optional(v.string()),      // UNCHANGED
  // REMOVED: teammates field (no longer needed)
  submissionType: v.union(
    v.literal("individual"),
    v.literal("team"),
  ),                                        // NEW - indicates if activity was done alone or with team
  state: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("deleted"),
  ),                                        // UNCHANGED
  createdBy: v.id("users"),                 // UNCHANGED
  managedBy: v.optional(v.id("users")),     // UNCHANGED
  tier: v.union(v.literal("base"), v.literal("advanced")), // UNCHANGED
  pointsEarned: v.number(),                 // UNCHANGED - points per individual
  submissionGroupId: v.optional(v.id("submissionGroups")), // NEW - reference to group (only for team submissions)
})
  .index("by_user", ["userId"])
  .index("by_user_and_date", ["userId", "date"])
  .index("by_team", ["teamId"])
  .index("by_team_and_date", ["teamId", "date"])
  .index("by_team_and_type", ["teamId", "submissionType"]) // NEW - find team activities
  .index("by_tournament_and_date", ["tournamentId", "date"])
  .index("by_state", ["state"])
  .index("by_user_and_state", ["userId", "state"])
  .index("by_group", ["submissionGroupId"])  // NEW - for group queries
```

**Key Changes:**
- ❌ **Removed:** `teammates: v.array(v.id("users"))` - no longer storing participant list
- ✅ **Added:** `submissionType` - user explicitly indicates "individual" or "team" activity
- ✅ **Added:** `submissionGroupId` - links team submissions to their group (null for individual)

#### New: `submissionGroups` Table

```typescript
// convex/schema.ts

submissionGroups: defineTable({
  teamId: v.id("teams"),
  tournamentId: v.id("tournaments"),
  date: v.string(),                         // YYYY-MM-DD
  state: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("deleted"),
  ),
  tier: v.union(v.literal("base"), v.literal("advanced")), // Derived from submissions (highest tier wins)
  participantCount: v.number(),             // How many members submitted for this team activity
  totalTeamMembers: v.number(),             // Team size at time of submission
  participationRate: v.number(),            // participantCount / totalTeamMembers
  isTeamExercise: v.boolean(),              // participationRate >= threshold
  pointsEarned: v.number(),                 // Total points for team (calculated on approval)
  managedBy: v.optional(v.id("users")),     // Admin who approved/rejected
  createdAt: v.string(),                    // First submission in group
  updatedAt: v.string(),                    // Last modification
})
  .index("by_team", ["teamId"])
  .index("by_team_and_date", ["teamId", "date"]) // Ensures uniqueness: one group per team per date
  .index("by_tournament_and_date", ["tournamentId", "date"])
  .index("by_state", ["state"])
```

**Purpose:**
- Represents the logical "group" of team activity submissions for a team on a specific date
- **Only exists for team activities** - individual submissions have no group
- **Constraint:** One group per team per date (enforced by unique index on teamId + date)
- Stores aggregate metadata (participation rate, team exercise status)
- Primary entity for admin approval workflow
- Source of truth for team activity points calculation

#### Indexes Rationale

**Existing indexes maintained:**
- `by_user_and_date`: Fetch user's submission for calendar view
- `by_team_and_date`: Find all submissions for team on date (for grouping)
- `by_state`: Admin dashboard filters

**New indexes:**
- `by_group`: Efficiently load all individual submissions in a group
- `submissionGroups.by_team_and_date`: Ensure one group per team per date (uniqueness enforcement)

### Backend Implementation

#### Core Business Logic

**Submission Lifecycle:**

**For Individual Activities:**
1. **User creates submission** → `submissions.upsert` with `submissionType: "individual"`
2. **No grouping** → Submission remains standalone
3. **Admin approves** → `submissions.approve` (individual approval)
4. **Points calculated** → Individual exercise points awarded
5. **Team points updated** → Add individual points to team total

**For Team Activities:**
1. **User creates submission** → `submissions.upsert` with `submissionType: "team"`
2. **System validates** → Check if team activity group already exists for that date
3. **System finds or creates group** → `submissionGroups.upsertGroup` (internal)
4. **System updates group metadata** → Recalculate participation rate
5. **Admin approves group** → `submissionGroups.approve`
6. **System updates all submissions in group** → Cascade approval
7. **System calculates points** → Award team exercise points ONCE
8. **System updates group state** → Mark as approved

#### Mutation: `submissions.upsert` (Modified)

```typescript
// convex/submissions.ts

export const upsert = mutation({
  args: {
    _id: v.optional(v.id("submissions")),
    date: v.string(),
    teamId: v.id("teams"),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("base"), v.literal("advanced"))),
    submissionType: v.union(v.literal("individual"), v.literal("team")), // NEW - required
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate team membership
    const [membership, team] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", args.teamId).eq("userId", user._id),
        )
        .first(),
      ctx.db.get(args.teamId),
    ]);

    if (!membership) throw new Error("You are not a member of this team");
    if (!team) throw new Error("Team not found");

    // Get tournament for validation
    const tournament = await ctx.db.get(team.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    // CONSTRAINT: Check daily submission limit per user
    if (tournament.maxSubmissionsPerDay && !args._id) {
      // Count existing submissions for this user on this date
      const existingSubmissions = await ctx.db
        .query("submissions")
        .withIndex("by_user_and_date", (q) =>
          q.eq("userId", user._id).eq("date", args.date)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("tournamentId"), team.tournamentId),
            q.neq(q.field("state"), "deleted")
          )
        )
        .collect();

      if (existingSubmissions.length >= tournament.maxSubmissionsPerDay) {
        throw new Error(
          `Daily submission limit reached (${tournament.maxSubmissionsPerDay} per day). You have already submitted ${existingSubmissions.length} time(s) today.`
        );
      }
    }

    // CONSTRAINT: Only one team activity group per team per day
    if (args.submissionType === "team") {
      const existingGroup = await ctx.db
        .query("submissionGroups")
        .withIndex("by_team_and_date", (q) =>
          q.eq("teamId", args.teamId).eq("date", args.date)
        )
        .first();

      // Check if user already submitted for this team activity
      if (existingGroup && !args._id) {
        const userInGroup = await ctx.db
          .query("submissions")
          .withIndex("by_group", (q) => q.eq("submissionGroupId", existingGroup._id))
          .filter((q) => q.eq(q.field("userId"), user._id))
          .first();

        if (userInGroup) {
          throw new Error("You have already submitted for this team activity today");
        }
        // Otherwise, user can join the existing group
      }
    }

    const data = {
      date: args.date,
      userId: user._id,
      teamId: args.teamId,
      tournamentId: team.tournamentId,
      description: args.description,
      tier: args.tier || "base",
      submissionType: args.submissionType,
    };

    let submissionId: Id<"submissions">;

    if (args._id) {
      // UPDATE EXISTING SUBMISSION
      const submission = await ctx.db.get(args._id);

      if (!submission) throw new Error("Submission not found");
      if (submission.createdBy !== user._id) {
        throw new Error("You do not have permission to update this submission");
      }
      if (submission.state === "approved") {
        throw new Error("You cannot update an approved submission");
      }

      // If changing submission type, need to handle grouping changes
      const typeChanged = submission.submissionType !== args.submissionType;

      await ctx.db.patch(args._id, data);
      submissionId = args._id;

      // If type changed, update groups accordingly
      if (typeChanged) {
        if (args.submissionType === "team") {
          // Changed from individual to team - create/join group
          await upsertSubmissionGroup(ctx, {
            teamId: args.teamId,
            tournamentId: team.tournamentId,
            date: args.date,
          });
        } else {
          // Changed from team to individual - remove from group
          if (submission.submissionGroupId) {
            await ctx.db.patch(submissionId, { submissionGroupId: undefined });
            // Recalculate group without this submission
            await upsertSubmissionGroup(ctx, {
              teamId: args.teamId,
              tournamentId: team.tournamentId,
              date: args.date,
            });
          }
        }
      }
    } else {
      // CREATE NEW SUBMISSION
      submissionId = await ctx.db.insert("submissions", {
        ...data,
        state: "pending",
        createdBy: user._id,
        pointsEarned: 0, // Will be calculated on approval
      });
    }

    // UPSERT SUBMISSION GROUP (only for team activities)
    if (args.submissionType === "team") {
      await upsertSubmissionGroup(ctx, {
        teamId: args.teamId,
        tournamentId: team.tournamentId,
        date: args.date,
      });
    }

    return submissionId;
  },
});
```

**Key Changes:**
- ✅ **Added:** `submissionType` parameter (required) - user explicitly chooses "individual" or "team"
- ✅ **Added:** Daily submission limit validation - checks `tournament.maxSubmissionsPerDay`
- ✅ **Added:** Constraint validation - only one team activity group per team per date
- ✅ **Added:** User can join existing team activity group if it exists
- ✅ **Added:** Handle submission type changes (team ↔ individual)
- ✅ **Changed:** Only call `upsertSubmissionGroup` for team activities
- ❌ **Removed:** `teammateIds` parameter

#### Internal Function: `upsertSubmissionGroup`

```typescript
// convex/submissions.ts (internal helper)

async function upsertSubmissionGroup(
  ctx: MutationCtx,
  args: {
    teamId: Id<"teams">,
    tournamentId: Id<"tournaments">,
    date: string,
  }
) {
  // Find all TEAM activity submissions for this team on this date
  // (Individual submissions are NOT grouped)
  const submissions = await ctx.db
    .query("submissions")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date)
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("submissionType"), "team"),
        q.neq(q.field("state"), "deleted")
      )
    )
    .collect();

  if (submissions.length === 0) {
    // All submissions deleted - delete group if exists
    const existingGroup = await ctx.db
      .query("submissionGroups")
      .withIndex("by_team_and_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date)
      )
      .first();

    if (existingGroup) {
      await ctx.db.delete(existingGroup._id);
    }
    return;
  }

  // Get current team member count
  const teamMembers = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  const totalTeamMembers = teamMembers.length;
  const participantCount = submissions.length;
  const participationRate = totalTeamMembers > 0
    ? participantCount / totalTeamMembers
    : 0;

  // Get tournament for threshold
  const tournament = await ctx.db.get(args.tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const scoringConfig = tournament.scoringConfig || {
    individualPoints: { base: 1, advanced: 1 },
    teamExercisePoints: { base: 1, advanced: 1 },
    teamExerciseThreshold: 0.5,
  };

  const isTeamExercise = participationRate >= scoringConfig.teamExerciseThreshold;

  // Determine tier - use highest tier if mixed
  const hasAdvanced = submissions.some((s) => s.tier === "advanced");
  const tier = hasAdvanced ? "advanced" : "base";

  // Determine group state - all must be same state
  const states = new Set(submissions.map((s) => s.state));
  let groupState: "pending" | "approved" | "rejected" | "deleted";

  if (states.size === 1) {
    groupState = Array.from(states)[0] as typeof groupState;
  } else {
    // Mixed states - default to pending
    groupState = "pending";
  }

  // Calculate points if approved
  let pointsEarned = 0;
  if (groupState === "approved") {
    pointsEarned = isTeamExercise
      ? scoringConfig.teamExercisePoints[tier]
      : scoringConfig.individualPoints[tier];
  }

  const now = new Date().toISOString();

  // Find existing group
  const existingGroup = await ctx.db
    .query("submissionGroups")
    .withIndex("by_team_and_date", (q) =>
      q.eq("teamId", args.teamId).eq("date", args.date)
    )
    .first();

  const groupData = {
    teamId: args.teamId,
    tournamentId: args.tournamentId,
    date: args.date,
    state: groupState,
    tier,
    participantCount,
    totalTeamMembers,
    participationRate,
    isTeamExercise,
    pointsEarned,
    updatedAt: now,
  };

  if (existingGroup) {
    // Update existing group
    await ctx.db.patch(existingGroup._id, groupData);

    // Update all submissions with group reference
    for (const submission of submissions) {
      if (submission.submissionGroupId !== existingGroup._id) {
        await ctx.db.patch(submission._id, {
          submissionGroupId: existingGroup._id,
        });
      }
    }

    return existingGroup._id;
  } else {
    // Create new group
    const groupId = await ctx.db.insert("submissionGroups", {
      ...groupData,
      createdAt: now,
    });

    // Link all submissions to group
    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        submissionGroupId: groupId,
      });
    }

    return groupId;
  }
}
```

**Purpose:**
- Aggregates individual submissions into a group
- Recalculates participation metrics
- Determines group tier (highest tier wins)
- Determines group state (must be unanimous or defaults to pending)
- Links individual submissions to group

#### Mutation: `submissionGroups.approve` (New)

```typescript
// convex/submissionGroups.ts (new file)

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, validateIsAdmin } from "./users";

export const approve = mutation({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user, "You do not have permission to approve submissions");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    const previousState = group.state;

    // Get tournament for scoring
    const tournament = await ctx.db.get(group.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const scoringConfig = tournament.scoringConfig || {
      individualPoints: { base: 1, advanced: 1 },
      teamExercisePoints: { base: 1, advanced: 1 },
      teamExerciseThreshold: 0.5,
    };

    // Calculate points based on group participation
    const pointsEarned = group.isTeamExercise
      ? scoringConfig.teamExercisePoints[group.tier]
      : scoringConfig.individualPoints[group.tier];

    // Update group
    await ctx.db.patch(args.groupId, {
      state: "approved",
      managedBy: user._id,
      pointsEarned,
      updatedAt: new Date().toISOString(),
    });

    // Update all individual submissions in group
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        state: "approved",
        managedBy: user._id,
        pointsEarned, // Each submission gets same points (for consistency)
      });
    }

    // Update team points (only if transitioning to approved)
    if (previousState !== "approved") {
      const team = await ctx.db.get(group.teamId);
      if (team) {
        await ctx.db.patch(group.teamId, {
          points: (team.points || 0) + pointsEarned,
          lastActivityAt: new Date().toISOString(),
        });
      }
    } else if (group.pointsEarned !== pointsEarned) {
      // Re-approval with different points (e.g., participation changed)
      const team = await ctx.db.get(group.teamId);
      if (team) {
        const pointsDiff = pointsEarned - (group.pointsEarned || 0);
        await ctx.db.patch(group.teamId, {
          points: (team.points || 0) + pointsDiff,
          lastActivityAt: new Date().toISOString(),
        });
      }
    }
  },
});
```

**Key Points:**
- Approves entire group atomically
- Calculates points at group level based on participation rate
- Updates all individual submissions to approved state
- Awards points to team ONCE (not per submission)

#### Mutation: `submissionGroups.reject` (New)

```typescript
// convex/submissionGroups.ts

export const reject = mutation({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    validateIsAdmin(user, "You do not have permission to reject submissions");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Submission group not found");

    const previousState = group.state;
    const previousPoints = group.pointsEarned || 0;

    // Update group
    await ctx.db.patch(args.groupId, {
      state: "rejected",
      managedBy: user._id,
      pointsEarned: 0,
      updatedAt: new Date().toISOString(),
    });

    // Update all individual submissions in group
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.patch(submission._id, {
        state: "rejected",
        managedBy: user._id,
        pointsEarned: 0,
      });
    }

    // Decrement team points if previously approved
    if (previousState === "approved" && previousPoints > 0) {
      const team = await ctx.db.get(group.teamId);
      if (team) {
        await ctx.db.patch(group.teamId, {
          points: Math.max(0, (team.points || 0) - previousPoints),
          lastActivityAt: new Date().toISOString(),
        });
      }
    }
  },
});
```

#### Query: `submissionGroups.list` (New)

```typescript
// convex/submissionGroups.ts

export const list = query({
  args: {
    teamId: v.optional(v.id("teams")),
    tournamentId: v.optional(v.id("tournaments")),
    state: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("deleted"),
      ),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    let query = ctx.db.query("submissionGroups");

    if (args.teamId) {
      query = query.filter((q) => q.eq(q.field("teamId"), args.teamId));
    }

    if (args.tournamentId) {
      query = query.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId)
      );
    }

    if (args.state) {
      query = query.filter((q) => q.eq(q.field("state"), args.state));
    }

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));
    }

    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));
    }

    const groups = await query.collect();

    return groups.toSorted((a, b) => a.date.localeCompare(b.date));
  },
});
```

#### Query: `submissionGroups.getWithSubmissions` (New)

```typescript
// convex/submissionGroups.ts

export const getWithSubmissions = query({
  args: { groupId: v.id("submissionGroups") },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    // Get all individual submissions
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_group", (q) => q.eq("submissionGroupId", args.groupId))
      .collect();

    // Enrich with user data
    const submissionsWithUsers = await Promise.all(
      submissions.map(async (submission) => {
        const user = await ctx.db.get(submission.userId);
        return {
          ...submission,
          user: user ? {
            _id: user._id,
            name: user.name,
            email: user.email
          } : null,
        };
      })
    );

    return {
      ...group,
      submissions: submissionsWithUsers,
    };
  },
});
```

**Purpose:** Admin review screen needs to see all participants in a group

#### Modified Mutation: `submissions.remove`

```typescript
// convex/submissions.ts

export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const isAdmin = user.roleNames.includes("admin");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    if (!isAdmin && submission.userId !== user._id) {
      throw new Error("You do not have permission to remove this submission");
    }

    if (submission.state === "deleted") {
      throw new Error("Submission already deleted");
    }

    if (submission.state === "rejected") {
      throw new Error("Cannot remove a rejected submission");
    }

    const previousState = submission.state;
    const wasApproved = previousState === "approved";

    // Mark submission as deleted
    await ctx.db.patch(args.submissionId, {
      state: "deleted",
      managedBy: user._id,
    });

    // Update the submission group
    const team = await ctx.db.get(submission.teamId);
    if (team) {
      // This will recalculate group participation and points
      await upsertSubmissionGroup(ctx, {
        teamId: submission.teamId,
        tournamentId: submission.tournamentId,
        date: submission.date,
      });

      // If group was approved and points changed, adjust team points
      if (wasApproved && submission.submissionGroupId) {
        const updatedGroup = await ctx.db.get(submission.submissionGroupId);

        if (updatedGroup) {
          // Recalculate points difference
          const oldPoints = submission.pointsEarned || 0;
          const newPoints = updatedGroup.pointsEarned || 0;
          const pointsDiff = newPoints - oldPoints;

          if (pointsDiff !== 0) {
            await ctx.db.patch(submission.teamId, {
              points: Math.max(0, (team.points || 0) + pointsDiff),
              lastActivityAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  },
});
```

**Key Change:** Deleting a submission triggers group recalculation, which may change the participation rate and points

### Frontend Implementation

#### Modified Component: `UpsertTournamentFormButton`

**Location:** `src/components/form/upsert-tournament-form-button.tsx`

**Changes:**

Add `maxSubmissionsPerDay` field to tournament creation/edit form:

```tsx
{/* Daily Submission Limit */}
<form.Field
  name="maxSubmissionsPerDay"
  children={(field) => (
    <div className="space-y-2">
      <Label htmlFor="maxSubmissionsPerDay">
        Max Submissions Per Day
        <span className="text-muted-foreground text-xs ml-2">(optional)</span>
      </Label>
      <Input
        id="maxSubmissionsPerDay"
        type="number"
        min="1"
        max="100"
        placeholder="Unlimited"
        value={field.state.value ?? ""}
        onChange={(e) =>
          field.handleChange(
            e.target.value ? Number(e.target.value) : undefined
          )
        }
      />
      <p className="text-muted-foreground text-xs">
        Maximum number of submissions each user can create per day.
        Leave empty for unlimited submissions.
      </p>
    </div>
  )}
/>
```

**Schema Update:**
```typescript
const formSchema = z.object({
  // ... existing fields ...
  maxSubmissionsPerDay: z.number().int().min(1).optional(),
});
```

**Default Values:**
```typescript
defaultValues: {
  // ... existing fields ...
  maxSubmissionsPerDay: tournament?.maxSubmissionsPerDay ?? undefined,
}
```

#### Modified Component: `UpsertSubmissionFormDialog`

**Location:** `src/components/form/upsert-submission-form.tsx`

**Changes:**

1. **Add daily limit indicator** - show remaining submissions
2. **Add submissionType field** - radio buttons or toggle
3. **Update validation schema:**

```typescript
const formSchema = z.object({
  teamId: z.custom<Id<"teams">>(
    (val) => typeof val === "string" && val.length >= 1,
    "Please select a team",
  ),
  description: z.string().optional(),
  date: z.string().min(1, "You must select a date."),
  submissionType: z.union([z.literal("individual"), z.literal("team")]), // NEW - required
  tier: z.union([z.literal("base"), z.literal("advanced")]),
});
```

3. **Update form default values:**

```typescript
defaultValues: {
  date: submission?.date ?? date ?? "",
  description: submission?.description ?? "",
  teamId: submission?.teamId ?? teamId ?? "",
  submissionType: submission?.submissionType ?? "individual", // NEW - default to individual
  tier: submission?.tier ?? "base",
}
```

4. **Add submission type selector UI:**

```tsx
{/* Submission Type Selector */}
<form.Field
  name="submissionType"
  children={(field) => (
    <div className="space-y-2">
      <Label>Activity Type</Label>
      <RadioGroup
        value={field.state.value}
        onValueChange={field.handleChange}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="individual" id="individual" />
          <Label htmlFor="individual" className="font-normal">
            Individual Activity
            <span className="block text-muted-foreground text-xs">
              I did this activity on my own
            </span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="team" id="team" />
          <Label htmlFor="team" className="font-normal">
            Team Activity
            <span className="block text-muted-foreground text-xs">
              I did this activity with my teammates
            </span>
          </Label>
        </div>
      </RadioGroup>
      {field.state.value === "team" && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            All participating teammates must submit individually.
            Only one team activity is allowed per day.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )}
/>
```

5. **Remove teammates UI section** - delete entire section
6. **Add daily limit indicator before form:**

```tsx
{/* Daily Submission Limit Indicator */}
{tournament?.maxSubmissionsPerDay && (
  <Alert variant={remainingSubmissions === 0 ? "destructive" : "default"}>
    <Info className="h-4 w-4" />
    <AlertTitle>Daily Submission Limit</AlertTitle>
    <AlertDescription>
      You have {remainingSubmissions} of {tournament.maxSubmissionsPerDay} submissions remaining today.
      {remainingSubmissions === 0 && " You cannot create more submissions today."}
    </AlertDescription>
  </Alert>
)}
```

**Query to get remaining submissions:**
```typescript
// In component
const userSubmissionsToday = useQuery(
  api.submissions.getUserSubmissionsForDate,
  { userId: user._id, date, tournamentId: tournament._id }
);

const submissionsCount = userSubmissionsToday?.filter(
  (s) => s.state !== "deleted"
).length ?? 0;

const remainingSubmissions = tournament?.maxSubmissionsPerDay
  ? Math.max(0, tournament.maxSubmissionsPerDay - submissionsCount)
  : Infinity;

// Disable submit button if limit reached
const isLimitReached = remainingSubmissions === 0;
```

7. **Update dialog description:**

```typescript
<DialogDescription>
  {submission
    ? "Edit your submission details"
    : "Create your submission for this activity"}
  {date && ` for ${date}`}
</DialogDescription>
```

#### New Component: `SubmissionGroupCard`

**Location:** `src/components/submissions/submission-group-card.tsx`

```typescript
"use client";

import { useQuery } from "convex/react";
import { CheckCircle, Clock, XCircle, Users, Award } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SubmissionGroupCardProps {
  groupId: Id<"submissionGroups">;
  showActions?: boolean;
}

export function SubmissionGroupCard({
  groupId,
  showActions = false
}: SubmissionGroupCardProps) {
  const groupData = useQuery(
    api.submissionGroups.getWithSubmissions,
    { groupId }
  );

  if (!groupData) {
    return <Card className="animate-pulse"><CardContent className="h-32" /></Card>;
  }

  const { submissions, ...group } = groupData;

  const stateConfig = {
    pending: { icon: Clock, color: "bg-yellow-500", label: "Pending" },
    approved: { icon: CheckCircle, color: "bg-green-500", label: "Approved" },
    rejected: { icon: XCircle, color: "bg-red-500", label: "Rejected" },
    deleted: { icon: XCircle, color: "bg-gray-500", label: "Deleted" },
  };

  const StateIcon = stateConfig[group.state].icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StateIcon className={`h-5 w-5 ${stateConfig[group.state].color.replace('bg-', 'text-')}`} />
            <CardTitle>{new Date(group.date).toLocaleDateString()}</CardTitle>
          </div>
          <Badge variant={group.state === "approved" ? "success" : "secondary"}>
            {stateConfig[group.state].label}
          </Badge>
        </div>
        <CardDescription>
          {group.participantCount} / {group.totalTeamMembers} members participated
          ({(group.participationRate * 100).toFixed(0)}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Participation Indicator */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {group.isTeamExercise ? "Team Exercise" : "Individual Exercise"}
            </span>
            {group.state === "approved" && (
              <div className="ml-auto flex items-center gap-1">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-sm">{group.pointsEarned} pts</span>
              </div>
            )}
          </div>

          {/* Tier Badge */}
          <div>
            <Badge variant={group.tier === "advanced" ? "default" : "outline"}>
              {group.tier === "advanced" ? "Advanced Tier" : "Base Tier"}
            </Badge>
          </div>

          {/* Participants List */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Participants:</p>
            <div className="flex flex-wrap gap-2">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {submission.user?.name.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{submission.user?.name || "Unknown"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Descriptions (if any) */}
          {submissions.some(s => s.description) && (
            <div>
              <p className="mb-2 text-muted-foreground text-sm">Notes:</p>
              <ul className="space-y-1 text-sm">
                {submissions.filter(s => s.description).map((submission) => (
                  <li key={submission._id} className="flex gap-2">
                    <span className="font-medium">{submission.user?.name}:</span>
                    <span className="text-muted-foreground">{submission.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Purpose:** Displays grouped submission with all participants for admin review

#### Modified Component: `CalendarDateCell`

**Location:** `src/components/submissions/calendar-date-cell.tsx`

**Add visual indicator for participation status:**

```typescript
// Add to interface
interface CalendarDateCellProps {
  date: Date;
  submission?: {
    _id: Id<"submissions">;
    state: "pending" | "approved" | "rejected" | "deleted";
    description?: string;
    pointsEarned?: number;
  };
  groupInfo?: {  // NEW - shows team participation
    participantCount: number;
    totalTeamMembers: number;
    isTeamExercise: boolean;
  };
  isToday: boolean;
  isDisabled: boolean;
  isOutsideTournament: boolean;
  onClick: (date: string) => void;
}

// Inside component, add participation indicator
{groupInfo && (
  <span className="mt-0.5 text-[10px] opacity-75">
    {groupInfo.participantCount}/{groupInfo.totalTeamMembers}
    {groupInfo.isTeamExercise && " 🏆"}
  </span>
)}
```

#### New Page: Admin Submission Groups Review

**Location:** `src/app/(all)/admin/submission-groups/page.tsx`

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { SubmissionGroupCard } from "@/components/submissions/submission-group-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSubmissionGroupsPage() {
  const pendingGroups = useQuery(api.submissionGroups.list, {
    state: "pending"
  });
  const approvedGroups = useQuery(api.submissionGroups.list, {
    state: "approved"
  });
  const rejectedGroups = useQuery(api.submissionGroups.list, {
    state: "rejected"
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 font-bold text-3xl">Submission Groups</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingGroups?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedGroups?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedGroups?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingGroups?.map((group) => (
            <SubmissionGroupCard
              key={group._id}
              groupId={group._id}
              showActions
            />
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedGroups?.map((group) => (
            <SubmissionGroupCard key={group._id} groupId={group._id} />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedGroups?.map((group) => (
            <SubmissionGroupCard key={group._id} groupId={group._id} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Modified Query: `submissions.getMonthSubmissions`

**Update to return group info:**

```typescript
// Return type update
return submissions.reduce(
  (acc, sub) => {
    acc[sub.date] = {
      _id: sub._id,
      state: sub.state,
      description: sub.description,
      pointsEarned: sub.pointsEarned || 0,
      submissionGroupId: sub.submissionGroupId, // NEW
    };
    return acc;
  },
  {} as Record<string, { ... }>
);
```

### UI/UX Flow

#### User Submission Flow

**Before (Old):**
1. User opens calendar, clicks date
2. Form: Select team, date, tier, **add teammates**
3. Submit
4. Shows as "pending"

**After (New):**
1. User opens calendar, clicks date
2. Form: Select team, date, tier (simplified - no teammates)
3. Submit
4. Shows as "pending" with participant count (e.g., "1/5 submitted")
5. **Notification:** "Waiting for other team members to submit"
6. Other members see indicator: "2/5 teammates submitted"
7. When threshold met, visual changes to "Team Exercise"

#### Admin Approval Flow

**Before (Old):**
1. Admin sees list of individual submissions
2. Approves each one individually
3. Each approval awards points
4. **Problem:** May approve duplicates

**After (New):**
1. Admin sees list of **submission groups** (one row per team per date)
2. Expands group to see all participants
3. Approves **entire group** with one action
4. All individual submissions change to "approved"
5. Team gets points **once** based on group participation rate

#### Calendar View Enhancement

**Display Logic:**
- User sees their own submission status
- Hover shows: "You + 2 teammates submitted (3/5)"
- Color intensity indicates participation rate:
  - 0-49%: Light color (individual)
  - 50-100%: Dark color (team exercise)
- Icon: Trophy emoji 🏆 if team exercise achieved

## Edge Cases & Handling

### 1. User Tries to Create Multiple Team Activities on Same Day

**Scenario:** Alice creates a team activity for Jan 1. Later, Alice tries to create another team activity for Jan 1.

**Handling:**
- Validation error: "A team activity already exists for this date"
- User must choose to either:
  - Join the existing team activity (if not already joined)
  - Create an individual activity instead
  - Wait for the next day
- **Prevents:** Multiple team activity groups per team per day

### 2. User Switches Between Individual and Team After Submission

**Scenario:** Alice creates individual submission for Jan 1. Later edits it to change type to "team".

**Handling:**
- **Individual → Team:**
  - Check if team activity group exists for that date
  - If exists: Add submission to existing group
  - If not: Create new group
  - Recalculate group participation
- **Team → Individual:**
  - Remove submission from group
  - Recalculate group (may change team exercise status)
  - Submission becomes standalone
- **Limitation:** Cannot switch type if submission is already approved

### 3. Multiple Individual Activities on Same Day

**Scenario:** Alice creates 3 individual submissions for Jan 1 (morning workout, afternoon run, evening yoga).

**Handling:**
- **Allow:** Multiple individual submissions per user per day
- Each submission stands alone
- Each gets approved/rejected independently
- Each earns individual exercise points when approved
- **UI consideration:** Calendar might show "3 individual activities" instead of single dot

### 4. Individual Activity Exists When User Tries to Create Team Activity

**Scenario:** Alice has individual submission for Jan 1. Team decides to do team workout on Jan 1. Alice creates team activity submission.

**Handling:**
- **Allow:** Both can coexist
- Alice has 2 submissions for Jan 1:
  - One individual (standalone)
  - One team (in group with teammates)
- Both can be approved independently
- Team earns points from both

### 5. User Joins Team Activity Group After It's Already Approved

**Scenario:** Team activity for Jan 1 has 3/5 members, gets approved (60% participation = team exercise, 20 pts). Dave submits late for same team activity.

**Handling:**
- **Option A (Recommended):** Reject late submission
  - Error: "This team activity has already been approved"
  - Prevents point recalculation confusion

- **Option B:** Allow but change group state to pending
  - Group goes back to pending
  - Participation changes to 4/5 (80%)
  - Admin must re-approve
  - Points may change if threshold affects tier

**Decision needed from stakeholders.**

### 6. User Reaches Daily Submission Limit

**Scenario:** Tournament has `maxSubmissionsPerDay = 3`. Alice creates 2 individual submissions and 1 team submission on Jan 1. Alice tries to create another submission.

**Handling:**
- Validation error: "Daily submission limit reached (3 per day). You have already submitted 3 time(s) today."
- **Frontend:** Submit button disabled with tooltip explaining limit
- **Backend:** Mutation throws error
- Limit counts both individual and team submissions
- Deleted submissions do NOT count toward limit

### 7. Editing Submission Doesn't Count Toward Limit

**Scenario:** Alice creates submission (1/3 used). Alice edits the same submission.

**Handling:**
- **Allow:** Editing existing submission does NOT count toward daily limit
- Validation only checks limit for NEW submissions (`!args._id`)
- Users can freely edit their submissions without penalty

### 8. Daily Limit Reset at Midnight

**Scenario:** Alice uses all 3 submissions on Jan 1. On Jan 2, can Alice submit again?

**Handling:**
- **Yes:** Limit is per-day, not cumulative
- Jan 2 submissions are counted separately from Jan 1
- Each calendar day has its own limit
- Timezone: Uses the `date` string (YYYY-MM-DD) from submission

### 9. Tournament Owner Changes Limit Mid-Tournament

**Scenario:** Tournament starts with limit = 5. After 1 week, admin changes to limit = 2. Alice has already submitted 3 times today.

**Handling:**
- **Retroactive:** Existing submissions are not affected
- **Future:** New submissions must respect new limit
- Alice cannot create more submissions today (3 > 2)
- Tomorrow Alice can create up to 2 submissions
- **UI:** Show warning: "Limit was recently changed"

### 10. Member Joins Team Mid-Tournament

**Scenario:** Team has 4 members. They submit on Jan 1 (4/4 = 100% = team exercise). On Jan 2, 5th member joins. Now only 4/5 submit (80% = still team exercise if threshold is 50%).

**Handling:**
- `totalTeamMembers` is calculated at submission time (current count)
- Historical submissions retain their original `totalTeamMembers` value
- Group metadata is frozen once approved
- New member's absence doesn't retroactively affect past submissions

### 11. Member Leaves Team

**Scenario:** Team has 5 members. On Jan 1, 3 members submit (3/5 = 60% = team exercise). On Jan 2, one member leaves. Team now has 4 members.

**Handling:**
- Past submissions still show 3/5 (historical record)
- Future submissions calculate against 4 members
- Member who left still appears in historical groups
- Their submissions remain but are not deletable by them

### 12. Mixed Tiers in Same Group

**Scenario:** Alice submits "base" tier, Bob submits "advanced" tier for same date.

**Handling:**
- Group tier = highest tier submitted (advanced)
- Group gets advanced tier points
- **Rationale:** Reward the team for doing harder work
- **UI:** Show badge "Mixed tiers → Advanced awarded"

**Alternative (stricter):** Could require all members to submit same tier, reject if mixed. This would require admin decision.

### 13. Late Submission After Group Approved

**Scenario:** Team submits 3/5 members on Jan 1. Admin approves (3/5 = 60% = team exercise, 20 pts awarded). On Jan 2, 4th member submits late for Jan 1.

**Handling:**

**Option A (Recommended):** Prevent late submission
- Once group is approved, cannot add more submissions
- Error: "This date has already been approved for your team"

**Option B:** Allow but don't recalculate
- Allow late submission but mark as "informational only"
- Points already awarded, not recalculated
- Show "⚠️ Added after approval" badge

**Option C:** Allow and recalculate
- Recalculate group participation (now 4/5 = 80%)
- If points change (unlikely with same threshold), update team score
- Admin gets notification to re-review

**Decision needed from stakeholders.**

### 14. Deleting Submission from Approved Group

**Scenario:** Group with 3/5 members approved as team exercise (60%, threshold 50%, 20 pts). One member deletes their submission. Now only 2/5 (40%).

**Handling:**
- Deletion triggers group recalculation
- New participation rate: 40% < 50% threshold
- **Exercise type changes:** Team → Individual
- **Points change:** 20 pts (team) → 2 pts (individual)
- Team score adjusted: -18 points
- Admin notified of significant change
- **Prevention:** Could require admin approval to delete approved submission

### 15. All Members Delete Their Submissions

**Scenario:** Entire group deletes their submissions for a date.

**Handling:**
- Last deletion triggers group deletion
- All points removed
- No orphaned group records

### 16. Partial Submission on Same Day Different Teams

**Scenario:** Alice is on Team A and Team B. She submits for Team A on Jan 1. Can she also submit for Team B on Jan 1?

**Handling:**
- **Yes** - submissions are per team
- Duplicate check is scoped to `(userId, teamId, date)` tuple
- Alice's submission for Team A doesn't prevent Team B submission
- Each submission contributes to different team's group
- **Note:** Daily limit is per user per TOURNAMENT, not per team (if `maxSubmissionsPerDay = 3`, Alice can't create 3 for Team A + 3 for Team B if both are in same tournament)

### 17. Approval State Conflicts

**Scenario:** Group has 3 submissions. Admin approves 2 individually, rejects 1. What's the group state?

**Handling:**
- **Prevent individual approval** - only allow group-level approval
- Remove individual `submissions.approve` and `submissions.reject` mutations
- Force admin to use `submissionGroups.approve` and `submissionGroups.reject`
- All submissions in group always have same state

**Alternative:** If individual mutations remain, group state = majority state or default to pending if mixed.

### 18. Zero Team Members

**Scenario:** Edge case - team has no members (data inconsistency).

**Handling:**
- `totalTeamMembers = 0` → `participationRate = 0`
- Group cannot be approved (validation error)
- Admin must fix team data first

### 19. Submission Before Joining Team

**Scenario:** Alice creates submission for Team A on Jan 1. On Jan 2, she's removed from Team A.

**Handling:**
- Historical submission remains
- Still part of group
- Cannot edit or delete (no longer a member)
- Shows in team's history
- **Prevention:** Could add check on submission creation

## Migration Strategy

### Phase 1: Schema Deployment (Zero Downtime)

**Step 1:** Add new fields without breaking changes

```typescript
// convex/schema.ts - Additive changes only

submissions: defineTable({
  // ... existing fields ...
  teammates: v.optional(v.array(v.id("users"))), // Keep for backward compat during migration
  submissionType: v.optional(v.union(v.literal("individual"), v.literal("team"))), // NEW - optional during migration
  submissionGroupId: v.optional(v.id("submissionGroups")), // NEW
})
```

**Step 2:** Deploy new `submissionGroups` table

```typescript
submissionGroups: defineTable({ ... })
```

**Deploy:** These are additive changes, no downtime required.

### Phase 2: Data Migration

**Create migration mutation:**

```typescript
// convex/migrations.ts

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const migrateSubmissionsToGroups = internalMutation({
  args: {},
  handler: async (ctx) => {
    const submissions = await ctx.db.query("submissions").collect();

    // Step 1: Set submissionType for all existing submissions
    for (const submission of submissions) {
      // If teammates array exists and has items, it was intended as team activity
      // Otherwise, it's individual
      const submissionType =
        submission.teammates && submission.teammates.length > 0
          ? "team"
          : "individual";

      await ctx.db.patch(submission._id, { submissionType });
    }

    // Step 2: Group TEAM submissions by (teamId, date)
    const groupMap = new Map<string, typeof submissions>();

    for (const submission of submissions) {
      if (submission.state === "deleted") continue;
      if (submission.submissionType !== "team") continue; // Only group team activities

      const key = `${submission.teamId}:${submission.date}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(submission);
    }

    // Create groups
    let created = 0;
    for (const [key, subs] of groupMap.entries()) {
      const firstSub = subs[0];

      // Calculate participant count
      // OLD: participantCount = teammates.length + 1
      // NEW: participantCount = number of submissions in group
      const participantCount = subs.length;

      // Get team member count at time of submission
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", firstSub.teamId))
        .collect();

      const totalTeamMembers = teamMembers.length;
      const participationRate = totalTeamMembers > 0
        ? participantCount / totalTeamMembers
        : 0;

      // Get tournament for threshold
      const tournament = await ctx.db.get(firstSub.tournamentId);
      if (!tournament) continue;

      const scoringConfig = tournament.scoringConfig || {
        individualPoints: { base: 1, advanced: 1 },
        teamExercisePoints: { base: 1, advanced: 1 },
        teamExerciseThreshold: 0.5,
      };

      const isTeamExercise = participationRate >= scoringConfig.teamExerciseThreshold;

      // Determine tier (use first submission's tier, or highest if want advanced logic)
      const tier = subs[0].tier || "base";

      // Determine state (all should be same, but take first)
      const state = subs[0].state;

      // Calculate points
      let pointsEarned = 0;
      if (state === "approved") {
        pointsEarned = isTeamExercise
          ? scoringConfig.teamExercisePoints[tier]
          : scoringConfig.individualPoints[tier];
      }

      const now = new Date().toISOString();

      // Create group
      const groupId = await ctx.db.insert("submissionGroups", {
        teamId: firstSub.teamId,
        tournamentId: firstSub.tournamentId,
        date: firstSub.date,
        state,
        tier,
        participantCount,
        totalTeamMembers,
        participationRate,
        isTeamExercise,
        pointsEarned,
        managedBy: firstSub.managedBy,
        createdAt: subs[0]._creationTime?.toString() || now,
        updatedAt: now,
      });

      // Link all submissions to group
      for (const sub of subs) {
        await ctx.db.patch(sub._id, {
          submissionGroupId: groupId,
          pointsEarned, // Normalize points across group
        });
      }

      created++;
    }

    return {
      submissionsProcessed: submissions.length,
      groupsCreated: created
    };
  },
});
```

**Run migration:**

```bash
# Via Convex dashboard or CLI
npx convex run migrations:migrateSubmissionsToGroups
```

**Verify:**
- Check that all submissions have `submissionGroupId`
- Check that group count matches expected
- Spot-check points calculations

### Phase 3: Backend Code Update

**Deploy new backend functions:**
- `submissionGroups.approve`
- `submissionGroups.reject`
- `submissionGroups.list`
- `submissionGroups.getWithSubmissions`
- Modified `submissions.upsert` (without teammates)

**Keep old functions temporarily for rollback.**

### Phase 4: Frontend Update

**Deploy UI changes:**
- Simplified submission form (no teammates field)
- New admin submission groups page
- Updated calendar view with participation indicators

**Feature flag (optional):** Could use feature flag to toggle between old/new UI during rollback window.

### Phase 5: Cleanup (After 1 week)

**Remove deprecated code:**
- Delete `teammates` field from schema
- Make `submissionType` required (remove optional)
- Remove migration scripts
- Update documentation

**Schema final state:**
```typescript
submissions: defineTable({
  // ... other fields ...
  submissionType: v.union(v.literal("individual"), v.literal("team")), // Now required
  // teammates field removed
})
```

**Final deployment:** Clean schema without legacy fields.

## Testing Checklist

### Unit Tests (Backend)

**Individual Activity Tests:**
- [ ] Creating individual submission succeeds (no grouping)
- [ ] Multiple individual submissions per day allowed
- [ ] Individual submission approval awards individual points
- [ ] Individual submission has no submissionGroupId

**Team Activity Tests:**
- [ ] Creating team submission creates/joins group
- [ ] Only one team activity group per team per day enforced
- [ ] User cannot join team activity group twice
- [ ] Adding 2nd team member updates group participation count
- [ ] Deleting team submission updates group participation count
- [ ] Approving group updates all submissions to approved
- [ ] Approving group awards points once to team
- [ ] Rejecting group updates all submissions to rejected
- [ ] Rejecting group removes points from team
- [ ] Mixed tiers in group uses highest tier
- [ ] Participation rate calculates correctly (team activities only)
- [ ] Team exercise threshold respected
- [ ] Deleting all team submissions deletes group

**Type Switching Tests:**
- [ ] Switching individual → team creates/joins group
- [ ] Switching team → individual removes from group
- [ ] Cannot switch type if approved

**Daily Limit Tests:**
- [ ] Creating submission when limit reached fails with error
- [ ] Editing existing submission does NOT count toward limit
- [ ] Deleted submissions do NOT count toward limit
- [ ] Limit counts both individual and team submissions
- [ ] Limit is per user per tournament per day
- [ ] Different days have separate limits
- [ ] Unlimited when maxSubmissionsPerDay is null/undefined
- [ ] Changing tournament limit mid-tournament works correctly

### Integration Tests

**Individual Activity Flow:**
- [ ] Create individual submission → approve → points awarded (no grouping)
- [ ] Multiple individual submissions same day → each approved independently

**Team Activity Flow:**
- [ ] Full team submission flow: create → group → approve → points awarded once
- [ ] Multiple users submit team activity for same date → single group created
- [ ] Group approval is atomic (all submissions updated together)
- [ ] Points recalculation handles participation changes

**Mixed Flow:**
- [ ] User has both individual and team submissions on same day → both approved
- [ ] Migration script sets correct submissionType based on teammates array
- [ ] Migration script creates groups only for team activities
- [ ] Historical individual submissions remain ungrouped

### UI Tests

**Submission Form:**
- [ ] Submission form shows submissionType radio buttons (Individual/Team)
- [ ] Teammates field removed
- [ ] Warning shown when "Team Activity" selected
- [ ] Cannot create 2nd team activity for same day (validation error)
- [ ] Can create multiple individual activities for same day (up to limit)
- [ ] Daily limit indicator shows remaining submissions
- [ ] Submit button disabled when limit reached
- [ ] Editing submission doesn't decrease remaining count

**Tournament Form:**
- [ ] Tournament form shows maxSubmissionsPerDay field
- [ ] Field is optional (can be left empty)
- [ ] Field validates positive integers only
- [ ] Existing tournaments load with current limit value

**Calendar View:**
- [ ] Individual activities show single indicator
- [ ] Team activities show participation count (e.g., "2/5")
- [ ] Team exercise indicator appears when threshold met
- [ ] Multiple submissions same day (individual + team) both visible
- [ ] Points display correctly for both types

**Admin View:**
- [ ] Admin sees individual submissions separately
- [ ] Admin sees grouped team submissions
- [ ] Approving group updates all submission cards
- [ ] Approving individual updates single submission
- [ ] User can see who else submitted for team activity

### Manual Testing Scenarios

**Scenario 1: Individual Activity**
1. Create team with 3 members
2. Alice submits individual activity for Jan 1
3. Verify no group created
4. Admin approves Alice's submission
5. Verify team gets individual exercise points
6. Bob submits different individual activity for Jan 1
7. Verify separate submission (not grouped with Alice)
8. Admin approves Bob's submission
9. Verify team gets additional individual points

**Scenario 2: Simple Team Activity**
1. Create team with 3 members
2. All 3 submit team activity for same date
3. Verify group shows 3/3 (100%)
4. Verify marked as "team exercise"
5. Admin approves group
6. Verify team gets team exercise points ONCE (not individual × 3)

**Scenario 3: Partial Team Participation**
1. Create team with 5 members
2. Only 2 submit team activity for same date
3. Verify group shows 2/5 (40%)
4. Verify marked as "individual exercise" (below 50% threshold)
5. Admin approves
6. Verify team gets individual exercise points

**Scenario 4: Mixed Activities Same Day**
1. Create team with 3 members
2. Alice submits individual activity for Jan 1 at 9am
3. Later, Alice, Bob submit team activity for Jan 1
4. Verify Alice has 2 submissions for Jan 1
5. Verify team group shows 2/3 (67% = team exercise)
6. Admin approves both Alice's individual AND the team group
7. Verify team gets:
   - Individual points (from Alice's solo activity)
   - Team exercise points ONCE (from team group with Alice + Bob)

**Scenario 5: Daily Submission Limit**
1. Create tournament with `maxSubmissionsPerDay = 3`
2. Alice creates individual submission for Jan 1 (1/3 used)
3. Verify UI shows "2 of 3 submissions remaining today"
4. Alice creates another individual submission for Jan 1 (2/3 used)
5. Verify UI shows "1 of 3 submissions remaining today"
6. Alice creates team submission for Jan 1 (3/3 used)
7. Verify UI shows "0 of 3 submissions remaining today"
8. Verify submit button is disabled
9. Alice tries to create 4th submission → Error: "Daily submission limit reached"
10. Next day (Jan 2): Verify Alice can create new submissions (limit reset)

**Scenario 3: Late Deletion**
1. Create team with 4 members
2. All 4 submit (100% = team exercise)
3. Admin approves (team gets 20 pts)
4. One member deletes submission
5. Verify group recalculates to 3/4 (75% = still team exercise)
6. Verify points remain same (still above threshold)

**Scenario 4: Threshold Boundary**
1. Create team with 4 members (threshold = 50%)
2. 2 members submit (50% = exactly threshold)
3. Verify marked as "team exercise"
4. Admin approves
5. Verify team exercise points awarded
6. One member deletes
7. Verify changes to individual exercise (1/4 = 25%)
8. Verify points recalculated downward

## Success Metrics

### Technical Metrics

- Zero double-counting incidents after deployment
- Group creation latency &lt; 100ms (p95)
- Approval mutation completes in &lt; 500ms (p95)
- Migration completes in &lt; 5 minutes for 10,000 submissions
- Zero data consistency errors (groups always match submissions)

### User Metrics

- 90%+ of submissions are individual (not relying on old teammates feature)
- Team exercise threshold achieved in 30%+ of groups (indicates team participation)
- Average participation rate per team increases by 20% (more accountability)
- Admin approval time per submission decreases by 50% (grouping efficiency)

### Business Metrics

- Reduced disputes about "who participated" (accountability)
- Increased tournament engagement (members reminded to submit)
- Higher completion rates (social pressure from team)

## Open Questions

### 1. Late Submission Policy

**Question:** If a group is already approved, should new submissions be allowed?

**Options:**
- A) Reject late submissions (cleanest, recommended)
- B) Allow but mark as informational (doesn't change points)
- C) Allow and recalculate (most flexible but complex)

**Recommendation:** **Option A** - reject late submissions after approval to prevent gaming and maintain data integrity.

---

### 2. Mixed Tier Handling

**Question:** If team members submit different tiers (base vs advanced), which tier should the group use?

**Options:**
- A) Highest tier wins (rewards ambition)
- B) Reject mixed tiers, require admin to decide
- C) Average tier (not possible with base/advanced, would need numeric tiers)

**Recommendation:** **Option A** - use highest tier to encourage advanced participation. Admin can reject if suspicious.

---

### 3. Minimum Participation Threshold

**Question:** Should there be a minimum number of participants to create a group?

**Options:**
- A) No minimum - even 1 person can submit
- B) Require at least 2 people (otherwise why is it a team?)
- C) Configurable per tournament

**Recommendation:** **Option A** - no minimum. Single submissions are valid (just classified as individual exercise). Avoids blocking edge cases.

---

### 4. Deleting Approved Submissions

**Question:** Should members be able to delete their submission after group approval?

**Options:**
- A) Block deletion of approved submissions (prevents point manipulation)
- B) Allow but require admin re-approval
- C) Allow with automatic point recalculation

**Recommendation:** **Option B** - allow deletion but change group state back to "pending" and require re-approval. Balances flexibility with integrity.

---

### 5. Editing Tier After Submission

**Question:** Can users change their tier (base → advanced) after submitting?

**Options:**
- A) Block tier changes after submission
- B) Allow tier changes, triggers group recalculation
- C) Allow only before approval

**Recommendation:** **Option C** - allow tier changes while pending. Once approved, tier is locked. Prevents gaming while allowing corrections.

---

### 6. Cross-Team Submissions

**Question:** If a user is on multiple teams, can they submit for both teams on the same date?

**Current behavior:** Yes, submissions are scoped to (userId, teamId, date).

**Confirmation needed:** Is this the desired behavior? Or should users only be able to submit once per day across all teams?

**Recommendation:** Keep current behavior (one submission per team per day) unless there's a specific rule against it.

---

### 7. Participation Notification Strategy

**Question:** How should we notify team members that others have submitted?

**Options:**
- A) No automatic notifications (users check calendar)
- B) Daily digest email "Your team needs you! 2/5 submitted today"
- C) Real-time push notifications
- D) In-app notification center

**Recommendation:** **Option B** for MVP - daily digest email to encourage participation without spamming. Can add real-time later.

---

### 8. Historical Data Display

**Question:** After migration, should old submissions show the old `teammates` data or new grouped data?

**Options:**
- A) Preserve old display (show teammates array)
- B) Convert to new display (show as group even if not originally submitted that way)
- C) Mark historical submissions differently

**Recommendation:** **Option B** - migrate all data to new format for consistency. May result in some groups with only 1 submission (original creator) if teammates never submitted themselves.

---

### 9. Admin Bulk Actions

**Question:** Should admins be able to approve multiple groups at once?

**Options:**
- A) No - review each group individually (safest)
- B) Yes - checkbox selection with "Approve Selected"
- C) Yes - "Approve All Pending" button with confirmation

**Recommendation:** **Option B** - allow bulk selection but not "approve all" to maintain review quality.

---

### 10. Group Splitting

**Question:** If a group has 5 submissions and admin wants to reject 2 but approve 3, what happens?

**Options:**
- A) Not possible - all or nothing (simplest)
- B) Allow admin to split group (complex, creates 2 new groups)
- C) Allow admin to remove individual submissions then approve remainder

**Recommendation:** **Option C** - admin can delete specific submissions (which removes them from the group), then approve the remaining group. Gives flexibility without complex splitting logic.

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Backend:**
- [ ] Add `submissionGroups` table to schema
- [ ] Add `submissionGroupId` field to submissions
- [ ] Implement `upsertSubmissionGroup` internal function
- [ ] Modify `submissions.upsert` to call group upsert
- [ ] Write migration script

**Testing:**
- [ ] Unit tests for group creation
- [ ] Test duplicate submission prevention

**Deliverable:** Backend supports creating groups automatically

---

### Phase 2: Approval Workflow (Days 3-4)

**Backend:**
- [ ] Implement `submissionGroups.approve` mutation
- [ ] Implement `submissionGroups.reject` mutation
- [ ] Implement `submissionGroups.list` query
- [ ] Implement `submissionGroups.getWithSubmissions` query
- [ ] Update points calculation logic

**Testing:**
- [ ] Test group approval cascades to submissions
- [ ] Test points awarded once per group
- [ ] Test rejection removes points correctly

**Deliverable:** Admin can approve/reject groups, points calculated correctly

---

### Phase 3: UI Updates (Days 5-6)

**Frontend:**
- [ ] Remove teammates field from submission form
- [ ] Create `SubmissionGroupCard` component
- [ ] Create admin submission groups page
- [ ] Update calendar cells with participation count
- [ ] Add group info to calendar hover/tooltip

**Testing:**
- [ ] UI displays participation correctly
- [ ] Cannot submit duplicate
- [ ] Group cards show all participants

**Deliverable:** Complete UI for new submission flow

---

### Phase 4: Migration & Deployment (Day 7)

**Deployment:**
- [ ] Deploy schema changes (additive)
- [ ] Run migration script on production data
- [ ] Verify migration results
- [ ] Deploy new backend functions
- [ ] Deploy new frontend

**Monitoring:**
- [ ] Watch for errors in logs
- [ ] Verify points calculations are correct
- [ ] Check performance metrics

**Deliverable:** Live system with new submission model

---

### Phase 5: Cleanup (Post-deployment)

**After 1 week of stability:**
- [ ] Remove deprecated `teammates` field from schema
- [ ] Remove old individual approval code paths
- [ ] Update documentation
- [ ] Archive old submission form component

**Deliverable:** Clean codebase without legacy code

---

## Rollback Plan

### If Issues Detected Post-Deployment

**Scenario 1: Migration Failed**
- Rollback: Delete all `submissionGroups` records
- Rollback: Remove `submissionGroupId` from submissions
- Deploy: Revert to previous backend code
- No data loss (old data still intact)

**Scenario 2: Points Calculation Wrong**
- Immediate: Disable group approval (feature flag)
- Fix: Correct calculation logic
- Run: `teams.recalculatePoints` for affected teams
- Re-enable: Group approval after verification

**Scenario 3: Performance Issues**
- Add: Database indexes if missing
- Optimize: Queries with excessive filters
- Cache: Group metadata if needed
- Scale: Convex backend (automatic)

**Data Preservation:**
All old data is preserved during migration. Worst case, can delete new tables and revert to old code without data loss.

---

## Documentation Updates Needed

### User-Facing Docs

**Update:** Submission guide
- Document that each member must submit individually
- Explain team exercise vs individual exercise
- Show participation indicators

**Update:** FAQ
- "Why do I need to submit if my teammate already did?"
- "How do team exercise points work?"
- "Can I edit my submission after others submit?"

### Developer Docs

**Update:** CLAUDE.md
- Document new `submissionGroups` table
- Explain grouping logic
- Update submission flow diagrams

**Create:** Migration guide
- How to run migration
- Verification steps
- Rollback procedures

---

## Related Future Enhancements

### Post-MVP Features (Not in Scope)

1. **Submission Descriptions Consolidation**
   - Combine individual descriptions into group description
   - Admin can edit group description

2. **Photo Attachments**
   - Members upload proof photos
   - Group shows gallery of all photos

3. **Pre-Submission Coordination**
   - "Planning" state where members indicate intent
   - Shows "3/5 planning to participate"

4. **Automatic Reminders**
   - Daily notification if team members haven't submitted
   - "Your team is waiting for you!"

5. **Participation Leaderboard**
   - Rank members by submission consistency
   - "Most reliable teammate" badge

6. **Flexible Team Exercise Threshold**
   - Different thresholds per tournament
   - Dynamic threshold based on team size

7. **Partial Credit System**
   - Award scaled points based on participation percentage
   - E.g., 60% participation = 60% of team exercise points

8. **Group Comments**
   - Members can comment on group submissions
   - Admin can leave rejection reasons visible to all

---

## Final Recommendations

### Prioritized Approach

**Must Have (MVP):**
✅ Individual submissions required (no teammates array)
✅ Automatic grouping by (team, date)
✅ Group-based approval workflow
✅ Correct points calculation (no double-counting)
✅ Participation rate tracking

**Should Have (Phase 2):**
⚠️ Participation notifications (daily digest)
⚠️ Admin bulk approval
⚠️ Richer calendar UI (participation indicators)

**Nice to Have (Future):**
💡 Photo attachments
💡 Pre-submission coordination
💡 Participation leaderboards

### Decision Summary

**Chosen Architecture:** Option A (Submission Groups table)
- Provides cleanest separation of concerns
- Enables rich features in future
- Maintains clear audit trail
- Simplifies admin workflow

**Key Design Principles:**
1. **One source of truth:** Groups determine points, not individual submissions
2. **Atomic operations:** Approval/rejection affects entire group
3. **No double-counting:** Points awarded at group level only
4. **Accountability:** Every participant must submit individually
5. **Flexibility:** Handles edge cases gracefully (late deletions, tier changes)

---

## Conclusion

This specification provides a comprehensive plan to transition from team-based submissions (with optional teammates) to individual member submissions with automatic grouping. The new system ensures accountability, prevents double-counting, and maintains accurate participation tracking for the team exercise threshold calculation.

**Timeline:** 5-7 days for full implementation
**Risk Level:** Medium (requires migration, but data is preserved)
**Impact:** High (fixes critical data integrity issue, improves UX)

The proposed solution balances simplicity (users just submit for themselves) with powerful features (automatic grouping, team exercise detection) while maintaining data integrity (no double-counting) and providing a better admin experience (review groups, not individuals).
