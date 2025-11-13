# Team Captain Dashboard

**Priority:** MEDIUM
**Status:** Partially Implemented
**Estimated Effort:** 2 days

## Problem Statement

Team captains have management capabilities scattered across individual team pages but lack a centralized dashboard to efficiently manage all their teams. Captains who manage multiple teams need:

- A single view of all teams they captain
- Aggregated statistics across all their teams
- Consolidated pending actions (join requests, invitations)
- Quick access to team management functions
- Comparison view of team performances
- Efficient navigation between teams

Currently, captains must navigate to each team's page individually to manage members, view requests, and check statistics, leading to inefficiency and potential oversight of important actions.

## Current State

### What Exists

- Team captain role in `teamMembers` table
- Individual team management pages (`/teams/[id]`)
- Join request management on team pages (spec 06)
- Member invitation system (spec 06)
- Team statistics page (`/teams/[id]/statistics`)
- Permission checks for captain actions

### What's Missing

- No `/captain` or `/my-teams` dashboard
- No aggregated view of all teams user captains
- No consolidated pending actions across teams
- No team performance comparison interface
- No captain-specific navigation or sidebar section
- No bulk team management actions

### Evidence

- Spec 06 (team-member-management.md) describes captain functionality but no dashboard
- Team management is per-team only
- User dashboard shows teams user is on, but not captain-specific view
- No captain-specific routes exist

## Requirements

### Functional Requirements

1. **Captain Dashboard Overview**

   - View all teams where user is captain
   - Summary statistics for each team (members, points, rank)
   - Pending actions count (join requests, invitations sent)
   - Quick links to manage each team
   - Filter by tournament, status (active/ended)

2. **Consolidated Pending Actions**

   - Single feed of all pending join requests across all teams
   - Single feed of all sent invitations across all teams
   - Quick approve/reject actions without navigating to team page
   - Prioritized by date (oldest first)
   - Badge counts for pending items

3. **Team Performance Comparison**

   - Side-by-side comparison of teams user captains
   - Metrics: points, rank, member count, submission rate
   - Identify top performing and struggling teams
   - Visual charts/graphs for trends
   - Filter by tournament

4. **Team Management Quick Actions**

   - Create new team button (prominent)
   - Invite member (select team in dialog)
   - Transfer captaincy (for when captain wants to step down)
   - Leave team (with captain transfer requirement)
   - Disband team (if allowed)

5. **Activity Feed**

   - Recent activity across all captain's teams
   - New members joined
   - Submissions made
   - Points earned
   - Rank changes
   - Filter by team

6. **Captain Tools**
   - Member directory across all teams
   - Find inactive members
   - Bulk message team members (future)
   - Export team rosters (CSV)
   - Team health indicators (size, activity, morale)

### Non-Functional Requirements

- Dashboard loads in <1 second
- Real-time updates for join requests and invitations
- Supports captaining up to 20 teams simultaneously
- Mobile-responsive layout
- Toast notifications for new join requests
- Offline mode for viewing cached data

## Database Schema Changes

No schema changes required. Uses existing tables:

- `teams`
- `teamMembers` (with role="captain")
- `joinRequests`
- `teamInvitations`
- `submissions`

Optional enhancements:

```typescript
// Optional: Track captain actions for analytics
captainActions: defineTable({
  captainId: v.id("users"),
  teamId: v.id("teams"),
  actionType: v.union(
    v.literal("member_invited"),
    v.literal("member_removed"),
    v.literal("join_request_approved"),
    v.literal("join_request_rejected"),
    v.literal("captaincy_transferred")
  ),
  targetUserId: v.optional(v.id("users")),
  timestamp: v.string(),
  notes: v.optional(v.string()),
})
  .index("by_captain", ["captainId"])
  .index("by_team", ["teamId"])
  .index("by_timestamp", ["timestamp"]),
```

## Backend Implementation

### New Queries

#### `teams.getCaptainedTeams`

```typescript
export const getCaptainedTeams = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get all teams where user is captain
    const captainMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teams = await Promise.all(
      captainMemberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;

        const tournament = await ctx.db.get(team.tournamentId);

        // Get member count
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        // Get pending join requests count
        const pendingRequests = await ctx.db
          .query("joinRequests")
          .withIndex("by_team_and_status", (q) =>
            q.eq("teamId", team._id).eq("status", "pending")
          )
          .collect();

        // Get pending invitations count
        const pendingInvitations = await ctx.db
          .query("teamInvitations")
          .withIndex("by_team_and_status", (q) =>
            q.eq("teamId", team._id).eq("status", "pending")
          )
          .collect();

        // Get team rank (from leaderboard)
        const leaderboard = await ctx.db
          .query("teams")
          .withIndex("by_tournament", (q) => q.eq("tournamentId", team.tournamentId))
          .collect();

        const sortedTeams = leaderboard.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.lastActivityAt && b.lastActivityAt) {
            return (
              new Date(b.lastActivityAt).getTime() -
              new Date(a.lastActivityAt).getTime()
            );
          }
          return 0;
        });

        const rank = sortedTeams.findIndex((t) => t._id === team._id) + 1;

        return {
          ...team,
          tournament: tournament
            ? {
                id: tournament._id,
                name: tournament.name,
                status:
                  tournament.endDate < new Date().toISOString().split("T")[0]
                    ? "ended"
                    : tournament.startDate > new Date().toISOString().split("T")[0]
                    ? "upcoming"
                    : "active",
              }
            : null,
          memberCount: members.length,
          pendingRequestsCount: pendingRequests.length,
          pendingInvitationsCount: pendingInvitations.length,
          rank,
        };
      })
    );

    return teams.filter((t) => t !== null);
  },
});
```

#### `teams.getCaptainStats`

```typescript
export const getCaptainStats = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    let totalMembers = 0;
    let totalPoints = 0;
    let totalPendingRequests = 0;
    let totalPendingInvitations = 0;
    let totalSubmissions = 0;

    for (const membership of captainedTeams) {
      const team = await ctx.db.get(membership.teamId);
      if (!team) continue;

      // Count members
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      totalMembers += members.length;

      // Add points
      totalPoints += team.points || 0;

      // Count pending requests
      const pendingRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team_and_status", (q) =>
          q.eq("teamId", team._id).eq("status", "pending")
        )
        .collect();
      totalPendingRequests += pendingRequests.length;

      // Count pending invitations
      const pendingInvitations = await ctx.db
        .query("teamInvitations")
        .withIndex("by_team_and_status", (q) =>
          q.eq("teamId", team._id).eq("status", "pending")
        )
        .collect();
      totalPendingInvitations += pendingInvitations.length;

      // Count submissions
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      totalSubmissions += submissions.length;
    }

    return {
      totalTeams: captainedTeams.length,
      totalMembers,
      totalPoints,
      totalPendingRequests,
      totalPendingInvitations,
      totalSubmissions,
    };
  },
});
```

#### `teams.getAllPendingJoinRequests`

```typescript
export const getAllPendingJoinRequests = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get teams user captains
    const captainMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainMemberships.map((m) => m.teamId);

    // Get all pending join requests for those teams
    const allRequests = [];

    for (const teamId of teamIds) {
      const requests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team_and_status", (q) =>
          q.eq("teamId", teamId).eq("status", "pending")
        )
        .collect();

      for (const request of requests) {
        const team = await ctx.db.get(request.teamId);
        const requester = await ctx.db.get(request.userId);
        const tournament = team ? await ctx.db.get(team.tournamentId) : null;

        allRequests.push({
          ...request,
          team: team ? { id: team._id, name: team.name } : null,
          tournament: tournament
            ? { id: tournament._id, name: tournament.name }
            : null,
          requester: requester
            ? { id: requester._id, name: requester.name, email: requester.email }
            : null,
        });
      }
    }

    // Sort by creation time (oldest first)
    return allRequests.sort((a, b) => a._creationTime - b._creationTime);
  },
});
```

#### `teams.getAllPendingInvitations`

```typescript
export const getAllPendingInvitations = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get teams user captains
    const captainMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainMemberships.map((m) => m.teamId);

    // Get all pending invitations for those teams
    const allInvitations = [];

    for (const teamId of teamIds) {
      const invitations = await ctx.db
        .query("teamInvitations")
        .withIndex("by_team_and_status", (q) =>
          q.eq("teamId", teamId).eq("status", "pending")
        )
        .collect();

      for (const invitation of invitations) {
        const team = await ctx.db.get(invitation.teamId);
        const invitedBy = await ctx.db.get(invitation.invitedBy);
        const tournament = team ? await ctx.db.get(team.tournamentId) : null;

        allInvitations.push({
          ...invitation,
          team: team ? { id: team._id, name: team.name } : null,
          tournament: tournament
            ? { id: tournament._id, name: tournament.name }
            : null,
          invitedBy: invitedBy
            ? { id: invitedBy._id, name: invitedBy.name }
            : null,
        });
      }
    }

    // Sort by creation time (oldest first)
    return allInvitations.sort((a, b) => a._creationTime - b._creationTime);
  },
});
```

#### `teams.getCaptainActivity`

```typescript
export const getCaptainActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit || 50;

    // Get teams user captains
    const captainMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainMemberships.map((m) => m.teamId);

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      teamName?: string;
    }> = [];

    for (const teamId of teamIds) {
      const team = await ctx.db.get(teamId);
      if (!team) continue;

      // Recent member joins (via teamMembers creation)
      const recentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .order("desc")
        .take(5);

      for (const member of recentMembers) {
        const memberUser = await ctx.db.get(member.userId);
        activities.push({
          type: "member_joined",
          description: `${memberUser?.name || "User"} joined the team`,
          timestamp: member._creationTime,
          teamName: team.name,
        });
      }

      // Recent submissions
      const recentSubmissions = await ctx.db
        .query("submissions")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .order("desc")
        .take(5);

      for (const submission of recentSubmissions) {
        const submitter = await ctx.db.get(submission.userId);
        let description = `${submitter?.name || "User"} submitted`;
        if (submission.state === "approved") {
          description += ` (${submission.pointsEarned || 0} points earned)`;
        }
        activities.push({
          type: `submission_${submission.state}`,
          description,
          timestamp: submission._creationTime,
          teamName: team.name,
        });
      }
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});
```

## Frontend Implementation

### New Components

#### `CaptainStatsCards`

**Location:** `src/components/captain/captain-stats-cards.tsx`

```typescript
interface CaptainStatsCardsProps {
  stats: {
    totalTeams: number;
    totalMembers: number;
    totalPoints: number;
    totalPendingRequests: number;
    totalPendingInvitations: number;
    totalSubmissions: number;
  };
}

// Features:
// - Grid of stat cards (3x2 layout)
// - Teams: large number, icon
// - Members: total across all teams
// - Points: aggregated points
// - Pending Requests: badge color if > 0, clickable
// - Pending Invitations: count, clickable
// - Submissions: total count
```

#### `CaptainedTeamsList`

**Location:** `src/components/captain/captained-teams-list.tsx`

```typescript
interface CaptainedTeamsListProps {
  teams: Array<CaptainedTeam>;
}

// Features:
// - Grid or list view toggle
// - Each team card shows:
//   - Team name and tournament
//   - Status badge (active/upcoming/ended)
//   - Points and rank
//   - Member count
//   - Pending actions badges (if any)
//   - Quick actions: View Team, Manage Members, Statistics
// - Sort by: name, points, rank, pending actions
// - Filter by: tournament, status
// - Search by team name
```

#### `ConsolidatedJoinRequestsList`

**Location:** `src/components/captain/consolidated-join-requests-list.tsx`

```typescript
interface ConsolidatedJoinRequestsListProps {
  requests: Array<EnrichedJoinRequest>;
  onApprove: (requestId: Id<"joinRequests">) => Promise<void>;
  onReject: (requestId: Id<"joinRequests">, reason?: string) => Promise<void>;
}

// Features:
// - List of all pending join requests across teams
// - Each item shows:
//   - Requester name and email
//   - Team name and tournament
//   - Request message
//   - Time since requested
//   - Actions: Approve, Reject
// - Inline approve/reject
// - Bulk select and approve
// - Filter by team
// - Real-time updates
```

#### `ConsolidatedInvitationsList`

**Location:** `src/components/captain/consolidated-invitations-list.tsx`

```typescript
interface ConsolidatedInvitationsListProps {
  invitations: Array<EnrichedInvitation>;
}

// Features:
// - List of all sent invitations across teams
// - Each item shows:
//   - Invitee email
//   - Team name and tournament
//   - Status (pending/accepted/rejected/expired)
//   - Sent by (should be current user or other captain)
//   - Time since sent
//   - Actions: Resend (if expired), Cancel
// - Filter by team, status
// - Expired invitations highlighted
```

#### `TeamComparisonTable`

**Location:** `src/components/captain/team-comparison-table.tsx`

```typescript
interface TeamComparisonTableProps {
  teams: Array<CaptainedTeam & { stats: TeamStatistics }>;
}

// Features:
// - Table comparing all captain's teams
// - Columns: Team, Tournament, Members, Points, Rank, Submissions, Approval Rate
// - Sortable columns
// - Highlight top performing team (green)
// - Highlight struggling teams (red) - low activity, few members
// - Click row to navigate to team page
// - Export to CSV button
```

#### `CaptainActivityFeed`

**Location:** `src/components/captain/captain-activity-feed.tsx`

```typescript
interface CaptainActivityFeedProps {
  activities: Array<{
    type: string;
    description: string;
    timestamp: number;
    teamName?: string;
  }>;
}

// Features:
// - Timeline of recent activity across all teams
// - Each item shows:
//   - Icon based on type
//   - Description with team name badge
//   - Relative timestamp
// - Filter by team
// - Real-time updates
// - "Load More" button if >50 items
```

#### `CaptainQuickActions`

**Location:** `src/components/captain/captain-quick-actions.tsx`

```typescript
// Features:
// - Grid of action buttons
// - "Create Team" (opens tournament selection then create form)
// - "Invite Member" (opens team selection then invite form)
// - "View Join Requests" (with badge count)
// - "View Invitations" (with count)
// - Each button navigates or opens dialog
```

### New Pages

#### `/captain/page.tsx` or `/my-teams/page.tsx`

**Location:** `src/app/(all)/captain/page.tsx`

```typescript
export default function CaptainDashboard() {
  const { user } = useUser();
  const stats = useQuery(api.teams.getCaptainStats);
  const teams = useQuery(api.teams.getCaptainedTeams);
  const pendingRequests = useQuery(api.teams.getAllPendingJoinRequests);
  const pendingInvitations = useQuery(api.teams.getAllPendingInvitations);
  const activity = useQuery(api.teams.getCaptainActivity, { limit: 30 });

  const approveJoinRequest = useMutation(api.joinRequests.approve);
  const rejectJoinRequest = useMutation(api.joinRequests.reject);

  // Check if user is captain of any team
  if (teams && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">No Teams Yet</h2>
        <p className="text-muted-foreground">
          You are not a captain of any team. Create a team to get started!
        </p>
        <Button asChild>
          <Link href="/tournaments">Browse Tournaments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Teams</h1>
        <p className="text-muted-foreground">
          Manage all teams you captain
        </p>
      </div>

      {/* Quick Actions */}
      <CaptainQuickActions
        pendingRequestsCount={pendingRequests?.length || 0}
        pendingInvitationsCount={pendingInvitations?.length || 0}
      />

      {/* Stats Cards */}
      {stats && <CaptainStatsCards stats={stats} />}

      {/* Tabs for different views */}
      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">
            Teams ({teams?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Join Requests ({pendingRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({pendingInvitations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity
          </TabsTrigger>
          <TabsTrigger value="comparison">
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          {teams ? (
            <CaptainedTeamsList teams={teams} />
          ) : (
            <Skeleton className="h-96" />
          )}
        </TabsContent>

        <TabsContent value="requests">
          {pendingRequests ? (
            <ConsolidatedJoinRequestsList
              requests={pendingRequests}
              onApprove={async (requestId) => {
                await approveJoinRequest({ requestId });
                toast.success("Join request approved");
              }}
              onReject={async (requestId, reason) => {
                await rejectJoinRequest({ requestId, reason });
                toast.success("Join request rejected");
              }}
            />
          ) : (
            <Skeleton className="h-96" />
          )}
        </TabsContent>

        <TabsContent value="invitations">
          {pendingInvitations ? (
            <ConsolidatedInvitationsList invitations={pendingInvitations} />
          ) : (
            <Skeleton className="h-96" />
          )}
        </TabsContent>

        <TabsContent value="activity">
          {activity ? (
            <CaptainActivityFeed activities={activity} />
          ) : (
            <Skeleton className="h-96" />
          )}
        </TabsContent>

        <TabsContent value="comparison">
          {teams ? (
            <TeamComparisonTable teams={teams} />
          ) : (
            <Skeleton className="h-96" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Modified Components

#### `Sidebar`

```typescript
// Add "My Teams" section:
// - Dashboard (/captain) - always visible if user is captain of any team
// - Badge count on "My Teams" if pending requests > 0
```

#### `Dashboard` (user dashboard)

```typescript
// Add prominent link/card to Captain Dashboard if user is captain of any team
// Show quick stats: teams count, pending requests count
```

## UI/UX Considerations

### Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│ My Teams                                             │
│ Manage all teams you captain                         │
├──────────────────────────────────────────────────────┤
│ [Create Team] [Invite Member] [Join Requests: 3]    │
├──────────────────────────────────────────────────────┤
│ [Teams: 3] [Members: 15] [Points: 120] [Requests: 3]│
├──────────────────────────────────────────────────────┤
│ [Teams] [Join Requests (3)] [Invitations] [Activity]│
│ ┌────────────────────────────────────────────────┐  │
│ │ Team Alpha - Tournament X  [Active] [Rank #2] │  │
│ │ 5 members, 42 points, 1 pending request       │  │
│ │ [View] [Manage] [Stats]                       │  │
│ └────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────┐  │
│ │ Team Beta - Tournament Y [Upcoming] [--]      │  │
│ └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Color Scheme

- **Stats Cards:** Purple (teams), Blue (members), Green (points), Orange (requests)
- **Status Badges:** Green (active), Blue (upcoming), Gray (ended)
- **Rank Badges:** Gold (#1), Silver (#2), Bronze (#3), Gray (other)
- **Action Buttons:** Primary color scheme

### Notification System

- Real-time toast notifications for new join requests
- Badge counts update automatically
- Browser notifications (optional, with permission)
- Email digest of pending actions (future)

### Empty States

- **No teams:** Friendly message with "Create Team" CTA
- **No pending requests:** "All caught up!" message
- **No activity:** "No recent activity" with helpful tip

### Comparison Highlights

- Top performing team: Green border or highlight
- Struggling teams: Yellow/red indicators
- Average line or marker for comparison
- Tooltips explaining metrics

## Testing Checklist

### Unit Tests

- [ ] Only captains see captain dashboard
- [ ] Stats calculate correctly across teams
- [ ] Join request approval works from dashboard
- [ ] Invitations list shows correct data
- [ ] Activity feed aggregates correctly

### Integration Tests

- [ ] Dashboard loads all captain's teams
- [ ] Real-time updates work
- [ ] Approve/reject works from consolidated view
- [ ] Filter and sort work correctly
- [ ] Navigation between teams works

### UI Tests

- [ ] Stats cards render correctly
- [ ] Team list displays all teams
- [ ] Join requests list renders
- [ ] Comparison table works
- [ ] Mobile responsive
- [ ] Loading states render

## Edge Cases

1. **User stops being captain of all teams**
   - Show empty state
   - Remove from sidebar

2. **Captain of single team**
   - Still show dashboard (useful for future)
   - Emphasize "Create Another Team"

3. **Captain transfers captaincy**
   - Remove team from captain dashboard immediately
   - Update counts

4. **Team deleted**
   - Remove from list automatically
   - Update stats

5. **Very large number of teams (>20)**
   - Paginate team list
   - Add search functionality

## Performance Optimization

- Cache captain stats for 10 seconds
- Lazy load team statistics on demand
- Virtual scrolling for >50 teams
- Paginate activity feed
- Debounce search and filter inputs

## Migration & Deployment

### Migration Steps

1. **No Schema Changes**
   - Uses existing tables
   - No migration needed

2. **Add Backend Queries**
   - Implement captain queries
   - Test in Convex dashboard
   - Deploy backend

3. **Build Frontend**
   - Create captain components
   - Create dashboard page
   - Update sidebar and user dashboard
   - Deploy frontend

4. **Communication**
   - Announce new captain dashboard
   - Create help docs
   - Gather feedback from active captains

## Success Metrics

- 80%+ of active captains visit dashboard weekly
- <2 clicks to manage join requests (vs current multi-step)
- 50% reduction in time to manage multiple teams
- 90%+ captain satisfaction with dashboard
- <24 hours join request response time

## Future Enhancements

- Team templates for quick creation
- Bulk invite members across teams
- Captain handoff wizard
- Team health scoring and recommendations
- Automated member engagement tracking
- Captain achievements/badges
- Team chat/communication hub
- Scheduled team events
- Member performance tracking
- Team goal setting and tracking

## Dependencies

- Existing Convex backend
- Shadcn/ui components
- TanStack Table
- Lucide icons
- date-fns for date formatting
- React hooks (useQuery, useMutation, useUser)

## Open Questions

1. **Should non-captains see a "My Teams" page?**
   - Yes - but show different view (teams they're on, not captaining)

2. **Allow captains to message all team members?**
   - Post-MVP feature - requires messaging system

3. **Show captain actions history?**
   - Optional enhancement - requires captainActions table

4. **Limit number of teams one user can captain?**
   - No hard limit initially - monitor usage

5. **Allow vice-captain role?**
   - Post-MVP feature - requires role extension
