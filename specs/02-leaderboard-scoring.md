# Leaderboard & Scoring System

**Priority:** CRITICAL
**Status:** Not Implemented
**Estimated Effort:** 2-3 days

## Problem Statement

Currently, there is no way to:

- Track team points/scores
- Display tournament leaderboards
- Rank teams
- Determine tournament winners
- Show competitive standings

The UI displays hardcoded "0 pts" or "- pts" for teams. Submissions are tracked but don't contribute to any scoring. This prevents the platform from functioning as a competitive tournament system.

## Current State

### What Exists

- Submissions tracked with approval states (pending/approved/rejected)
- Tournament date ranges (start/end)
- Team associations with tournaments
- Basic team listing in tournament detail pages

### What's Missing

- No `points` or `score` field in teams table
- No calculation logic for points
- No leaderboard query
- No leaderboard UI component
- No winner determination logic

### Evidence

- `team-details-card.tsx` expects a `score` prop but there's no data source
- `tournament-details-card.tsx` shows "- pts" for teams (hardcoded)
- CLAUDE.md mentions "Tournament leaderboard UI not yet implemented" (line 174)

## Requirements

### Functional Requirements

1. **Point Tracking**

   - Each approved submission = 1 point for the team
   - Points automatically recalculated when submissions approved/rejected
   - Points tied to specific tournament
   - Historical point tracking (point changes over time)

2. **Leaderboard Display**

   - Show all teams in tournament ranked by points
   - Display: Rank, Team Name, Points, Members, Last Activity
   - Real-time updates as submissions are approved
   - Sortable by different metrics (points, name, member count)
   - Filter by date range (for progress tracking)

3. **Team Rankings**

   - #1, #2, #3 with visual badges/medals
   - Tie-breaking logic (same points):
     - More recent activity wins
     - Earlier join date wins (fallback)
   - Ranking updates within 1 second of point change

4. **Winner Determination**

   - After tournament end date: winner announced
   - Top 3 teams highlighted
   - Winner badge/trophy on team page
   - Tournament archive shows historical winners

5. **Statistics**
   - Average points per day
   - Team completion rate (submissions / expected days)
   - Member contribution breakdown (who contributed how many points)
   - Tournament-wide stats (total submissions, average team score)

### Non-Functional Requirements

- Leaderboard query executes in <200ms
- Point calculations are atomic (no race conditions)
- Historical data preserved (points at specific dates)
- Supports up to 100 teams per tournament efficiently
- Real-time updates via Convex reactivity

## Database Schema Changes

### Modified Tables

```typescript
// convex/schema.ts

teams: defineTable({
  name: v.string(),
  tournamentId: v.id("tournaments"),
  createdBy: v.id("users"),
  points: v.number(), // NEW - current total points
  lastActivityAt: v.optional(v.string()), // NEW - for tie-breaking
})
  .index("by_tournament", ["tournamentId"])
  .index("by_tournament_and_name", ["tournamentId", "name"])
  .index("by_tournament_and_points", ["tournamentId", "points"]), // NEW - for leaderboard

tournaments: defineTable({
  name: v.string(),
  description: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  teamMinSize: v.optional(v.number()),
  teamMaxSize: v.optional(v.number()),
  createdBy: v.id("users"),
  winnerId: v.optional(v.id("teams")), // NEW - tournament winner
  completedAt: v.optional(v.string()), // NEW - when tournament finished
}),
```

### New Tables (Optional - for advanced features)

```typescript
// For historical tracking (nice-to-have)
teamPointHistory: defineTable({
  teamId: v.id("teams"),
  tournamentId: v.id("tournaments"),
  points: v.number(),
  date: v.string(), // ISO date
  submissionId: v.optional(v.id("submissions")), // What caused the change
})
  .index("by_team", ["teamId"])
  .index("by_team_and_date", ["teamId", "date"])
  .index("by_tournament_and_date", ["tournamentId", "date"]),
```

## Backend Implementation

### Modified Mutations

#### `submissions.approve` (update existing)

```typescript
// After approving submission:
// 1. Get team
// 2. Increment team.points by 1
// 3. Update team.lastActivityAt to now
// 4. (Optional) Create teamPointHistory record
```

#### `submissions.reject` (update existing)

```typescript
// If previously approved submission is now rejected:
// 1. Get team
// 2. Decrement team.points by 1
// 3. Update team.lastActivityAt to now
```

#### `submissions.remove` (update existing - soft delete)

```typescript
// If approved submission is deleted:
// 1. Get team
// 2. Decrement team.points by 1 if state was "approved"
// 3. Update lastActivityAt
```

### New Mutations

#### `tournaments.determineWinner`

```typescript
export const determineWinner = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Get tournament and validate it has ended
    // Get all teams sorted by points desc, lastActivityAt desc
    // Set tournament.winnerId to top team
    // Set tournament.completedAt to now
    // Return winner team
  },
});
```

#### `teams.recalculatePoints`

```typescript
// Admin utility to fix points if needed
export const recalculatePoints = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Count all approved submissions for team
    // Update team.points to match count
    // Return new points value
  },
});
```

### New Queries

#### `tournaments.getLeaderboard`

```typescript
export const getLeaderboard = query({
  args: {
    tournamentId: v.id("tournaments"),
    limit: v.optional(v.number()), // default 100
  },
  handler: async (ctx, args) => {
    // Get all teams for tournament
    // Sort by points DESC, lastActivityAt DESC
    // Join with member count
    // Add rank (1, 2, 3, ...)
    // Return array of:
    // {
    //   rank: number,
    //   teamId: Id<"teams">,
    //   teamName: string,
    //   points: number,
    //   memberCount: number,
    //   lastActivityAt: string,
    //   isWinner: boolean,
    // }
  },
});
```

#### `tournaments.getWinner`

```typescript
export const getWinner = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament?.winnerId) return null;

    const team = await ctx.db.get(tournament.winnerId);
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", tournament.winnerId))
      .collect();

    // Return winner team with full details
  },
});
```

#### `teams.getStatistics`

```typescript
export const getStatistics = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const tournament = await ctx.db.get(team.tournamentId);
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Calculate:
    // - Total submissions
    // - Approved submissions
    // - Approval rate
    // - Average points per day
    // - Current streak (consecutive days with submissions)
    // - Member contributions (submissions per user)
    // - Expected days vs actual submission days

    return {
      totalSubmissions: number,
      approvedSubmissions: number,
      approvalRate: number,
      averagePointsPerDay: number,
      currentStreak: number,
      memberContributions: { userId: Id<"users">, count: number }[],
      completionRate: number,
    };
  },
});
```

#### `tournaments.getStatistics`

```typescript
export const getStatistics = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    // Calculate tournament-wide statistics:
    // - Total teams
    // - Total submissions
    // - Average team score
    // - Most active team
    // - Highest scoring day
    // - Participation rate

    return {
      totalTeams: number,
      totalSubmissions: number,
      averageTeamScore: number,
      mostActiveTeam: { teamId, name, points },
      highestScoringDay: { date, submissions },
      participationRate: number,
    };
  },
});
```

## Frontend Implementation

### New Components

#### `TournamentLeaderboard`

**Location:** `src/components/tournaments/tournament-leaderboard.tsx`

```typescript
interface TournamentLeaderboardProps {
  tournamentId: Id<"tournaments">;
}

// Features:
// - Table with columns: Rank, Team Name, Points, Members, Last Activity
// - Top 3 highlighted with gold/silver/bronze
// - Click team row to navigate to team detail page
// - Real-time updates via Convex query
// - Loading skeleton
// - Empty state if no teams
```

#### `TeamStatisticsCard`

**Location:** `src/components/teams/team-statistics-card.tsx`

```typescript
interface TeamStatisticsCardProps {
  teamId: Id<"teams">;
}

// Displays:
// - Total points (large, prominent)
// - Approval rate percentage
// - Current streak (consecutive days)
// - Average points per day
// - Member contribution chart/list
// - Completion rate progress bar
```

#### `WinnerAnnouncement`

**Location:** `src/components/tournaments/winner-announcement.tsx`

```typescript
interface WinnerAnnouncementProps {
  tournamentId: Id<"tournaments">;
}

// Features:
// - Trophy icon with team name
// - Confetti animation (optional)
// - List of team members
// - Final score
// - "View Leaderboard" button
```

#### `LeaderboardPodium`

**Location:** `src/components/tournaments/leaderboard-podium.tsx`

```typescript
// Visual podium display for top 3 teams
// Gold/Silver/Bronze styling
// Team avatars/names
// Points displayed
// Used in tournament detail page
```

### Modified Components

#### `TournamentDetailsCard`

**Location:** `src/components/tournaments/tournament-details-card.tsx`

- Replace hardcoded "- pts" with actual team points from query
- Add "View Leaderboard" button
- Show winner badge if tournament completed
- Link to leaderboard page

#### `TeamDetailsCard`

**Location:** `src/components/teams/team-details-card.tsx`

- Display actual `score` prop from database
- Add rank badge (#1, #2, etc.)
- Show "Tournament Winner" badge if applicable
- Link to statistics page

#### `Dashboard`

**Location:** `src/app/(all)/dashboard/page.tsx`

- Add "Your Rankings" section showing user's team ranks
- Quick stats: total points across all tournaments
- Leaderboard preview for active tournaments

### New Pages

#### `/tournaments/[id]/leaderboard`

**Location:** `src/app/(all)/tournaments/[id]/leaderboard/page.tsx`

- Full leaderboard table
- Podium visual for top 3
- Tournament info header
- Statistics sidebar
- Export leaderboard button (CSV - future)
- Real-time updates

#### `/teams/[id]/statistics`

**Location:** `src/app/(all)/teams/[id]/statistics/page.tsx`

- Detailed team statistics
- Member contribution breakdown
- Submission timeline/calendar
- Performance charts (points over time)
- Comparison to tournament average

## UI/UX Considerations

### Visual Hierarchy

1. **Podium Positions (Top 3)**

   - Gold: Large, prominent, trophy icon
   - Silver: Medium, star icon
   - Bronze: Smaller, medal icon

2. **Leaderboard Colors**

   - Winner: Gold background (#FFD700)
   - Top 3: Gradient backgrounds
   - Current user's team: Highlighted row
   - Rest: Standard styling

3. **Rank Badges**
   - #1-3: Medal icons with colors
   - #4-10: Numbered badges
   - #11+: Plain numbers

### Real-Time Updates

- Leaderboard refreshes automatically when submissions approved
- Toast notification: "New points! Check the leaderboard"
- Smooth animations when rank changes
- Optimistic UI updates

### Loading States

- Skeleton loaders for leaderboard table
- Shimmer effect on point counters
- Graceful degradation if data slow to load

### Empty States

- No teams yet: "Be the first to create a team!"
- No submissions: "Start submitting to earn points"
- Tournament not started: "Leaderboard opens when tournament begins"

## Scoring Rules (MVP)

### Basic Rule

- 1 approved submission = 1 point
- Rejected submission = 0 points
- Pending submission = 0 points (until approved)

### Tie-Breaking

1. Team with more points wins
2. If equal points: team with more recent activity (lastActivityAt)
3. If still tied: team created earlier wins

### Edge Cases

1. **Submission re-approved after rejection**

   - Point is added back

2. **Submission deleted after approval**

   - Point is subtracted

3. **Multiple submissions same day**

   - Each counts (1 point each)

4. **Team disbanded mid-tournament**
   - Points remain in leaderboard (historical record)
   - Marked as "inactive" or "disbanded"

## Future Scoring Enhancements (Post-MVP)

- Bonus points for streaks (5 days in a row = +5 bonus)
- Daily challenges with extra points
- Difficulty multipliers (hard activities = 2x points)
- Penalty for rejected submissions (-0.5 points)
- Team size normalization (points per member)
- Weekly leaderboards
- Individual contributor leaderboards

## Testing Checklist

### Unit Tests

- [ ] Approving submission increases team points
- [ ] Rejecting approved submission decreases points
- [ ] Deleting approved submission decreases points
- [ ] Points never go negative
- [ ] Tie-breaking works correctly
- [ ] Winner determination selects highest points

### Integration Tests

- [ ] Leaderboard updates in real-time
- [ ] Multiple teams ranked correctly
- [ ] Point recalculation fixes inconsistencies
- [ ] Tournament winner set correctly after end date

### UI Tests

- [ ] Leaderboard displays all teams
- [ ] Rank badges show correct colors
- [ ] Winner announcement appears
- [ ] Statistics calculate correctly
- [ ] Loading states render
- [ ] Empty states render

## Migration & Deployment

### Data Migration

```typescript
// One-time script to add points to existing teams
// Run this before deploying frontend changes

async function migrateTeamPoints(ctx) {
  const teams = await ctx.db.query("teams").collect();

  for (const team of teams) {
    // Count approved submissions
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .filter((q) => q.eq(q.field("state"), "approved"))
      .collect();

    // Update team with point count
    await ctx.db.patch(team._id, {
      points: submissions.length,
      lastActivityAt: submissions[submissions.length - 1]?.createdAt,
    });
  }
}
```

### Deployment Steps

1. **Schema Update**

   - Add `points` and `lastActivityAt` to teams
   - Add `winnerId` and `completedAt` to tournaments
   - Deploy schema changes

2. **Run Migration**

   - Execute data migration to populate points
   - Verify all teams have correct points

3. **Backend Updates**

   - Deploy modified mutations (approve, reject, remove)
   - Deploy new queries (getLeaderboard, getWinner, getStatistics)
   - Test via Convex dashboard

4. **Frontend Updates**

   - Deploy leaderboard component
   - Deploy modified team/tournament cards
   - Deploy new pages
   - Test in production

5. **Monitoring**
   - Watch for point calculation errors
   - Monitor query performance
   - Check real-time update behavior

## Success Metrics

- Leaderboard query execution time: <200ms (p95)
- Zero point calculation errors
- 90%+ of users view leaderboard weekly during active tournament
- Real-time updates within 1 second
- Top 3 teams have >50% more points than median (indicates competition)

## Open Questions

1. **Should points be adjustable by admins?**

   - Pros: Can award bonus points for special activities
   - Cons: Could be seen as unfair

2. **Display points for ended tournaments?**

   - Yes - show historical leaderboards

3. **Allow team name on leaderboard even after team deleted?**

   - Yes - maintain historical record

4. **Show individual contributor rankings?**
   - Post-MVP feature
