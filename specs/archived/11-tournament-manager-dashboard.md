# Tournament Manager Dashboard

**Priority:** HIGH
**Status:** Not Implemented
**Estimated Effort:** 3-4 days

## Problem Statement

The `tournament_manager` role exists in the system but has no dedicated interface. Tournament managers need their own dashboard to:

- View and manage tournaments they are assigned to
- Monitor submission activity for their tournaments
- Access tournament analytics and performance metrics
- Approve/reject submissions for their tournaments
- Manage teams within their tournaments
- Configure tournament settings

Currently, tournament managers have no way to execute their role-specific functions without full admin access, limiting the ability to delegate tournament management responsibilities.

## Current State

### What Exists

- `tournament_manager` role defined in roles system (hierarchy: 2)
- Role description: "Can create/manage tournaments, approve submissions, view analytics"
- Permission checks in backend (`user.roles.includes("tournament_manager")`)
- General tournament listing page (`/tournaments`)
- Admin tournament management pages

### What's Missing

- No `/tournament-manager` dashboard
- No scoped tournament view (only tournaments they manage)
- No tournament-specific submission approval interface
- No delegation mechanism (assigning tournament managers to specific tournaments)
- No tournament analytics for their assigned tournaments
- No way to create tournaments as tournament_manager (only admins can)

### Evidence

- `convex/roles.ts` defines tournament_manager role (line 13-17)
- No route exists for tournament manager dashboard
- All tournament creation requires admin role
- Submission approval requires admin role (should allow tournament_manager)

## Requirements

### Functional Requirements

1. **Tournament Manager Dashboard**
   - View all tournaments assigned to this manager
   - Tournament status overview (active/upcoming/ended)
   - Quick stats for each tournament: teams count, submissions count, pending approvals
   - Recent activity feed for their tournaments
   - Quick actions: create tournament, view submissions, manage teams

2. **Tournament Assignment System**
   - Admins can assign tournament managers to specific tournaments
   - Tournament managers can only see/manage their assigned tournaments
   - Multiple managers can be assigned to one tournament
   - Assignment audit trail (who assigned, when)

3. **Tournament Management**
   - Create new tournaments (with approval workflow if needed)
   - Edit tournaments they manage
   - Cannot delete tournaments (admin-only)
   - Configure tournament settings (dates, team size, scoring)
   - View tournament leaderboard and statistics

4. **Submission Management**
   - View all submissions for their tournaments
   - Filter by tournament, team, status, date
   - Approve/reject submissions with reason
   - Bulk approval actions
   - Submission history and audit trail

5. **Team Oversight**
   - View all teams in their tournaments
   - Monitor team sizes (flag undersized teams)
   - View team composition and member lists
   - Cannot create/delete teams (users do this)
   - Can remove teams that violate rules

6. **Analytics & Reporting**
   - Tournament performance metrics
   - Submission approval rates
   - Team engagement statistics
   - Participation trends
   - Export reports (CSV)

### Non-Functional Requirements

- Dashboard loads in <1 second
- Real-time updates via Convex
- Supports managing up to 50 tournaments simultaneously
- Permission checks on all operations
- Audit logging for all management actions
- Mobile-responsive interface

## Database Schema Changes

### New Tables

```typescript
// Track which tournament managers are assigned to which tournaments
tournamentManagers: defineTable({
  tournamentId: v.id("tournaments"),
  managerId: v.id("users"), // User with tournament_manager role
  assignedBy: v.id("users"), // Admin who assigned
  assignedAt: v.string(), // ISO timestamp
})
  .index("by_tournament", ["tournamentId"])
  .index("by_manager", ["managerId"])
  .index("by_tournament_and_manager", ["tournamentId", "managerId"]),
```

### Modified Tables

```typescript
// Optional: Add audit logging
submissionActions: defineTable({
  submissionId: v.id("submissions"),
  performedBy: v.id("users"),
  action: v.union(v.literal("approved"), v.literal("rejected"), v.literal("pending")),
  reason: v.optional(v.string()),
  timestamp: v.string(),
})
  .index("by_submission", ["submissionId"])
  .index("by_user", ["performedBy"])
  .index("by_timestamp", ["timestamp"]),
```

## Backend Implementation

### New Mutations

#### `tournamentManagers.assign`

```typescript
export const assign = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    managerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Only admins can assign managers
    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required to assign tournament managers");
    }

    // Verify tournament exists
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Verify manager has tournament_manager role
    const manager = await ctx.db.get(args.managerId);
    if (!manager) {
      throw new Error("User not found");
    }

    const managerRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.managerId))
      .collect();

    const roles = await Promise.all(
      managerRoles.map(async (ur) => {
        const role = await ctx.db.get(ur.roleId);
        return role?.name;
      }),
    );

    if (!roles.includes("tournament_manager") && !roles.includes("admin")) {
      throw new Error("User must have tournament_manager or admin role");
    }

    // Check if already assigned
    const existing = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_tournament_and_manager", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("managerId", args.managerId),
      )
      .first();

    if (existing) {
      throw new Error("Manager already assigned to this tournament");
    }

    // Create assignment
    await ctx.db.insert("tournamentManagers", {
      tournamentId: args.tournamentId,
      managerId: args.managerId,
      assignedBy: user._id,
      assignedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
```

#### `tournamentManagers.unassign`

```typescript
export const unassign = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    managerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const assignment = await ctx.db
      .query("tournamentManagers")
      .withIndex("by_tournament_and_manager", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("managerId", args.managerId),
      )
      .first();

    if (!assignment) {
      throw new Error("Manager not assigned to this tournament");
    }

    await ctx.db.delete(assignment._id);
    return { success: true };
  },
});
```

#### `tournaments.upsert` (modify existing)

```typescript
// Update to allow tournament_manager role
export const upsert = mutation({
  args: {
    id: v.optional(v.id("tournaments")),
    name: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    teamMinSize: v.optional(v.number()),
    teamMaxSize: v.optional(v.number()),
    scoringConfig: v.optional(
      v.object({
        individualPoints: v.object({ base: v.number(), advanced: v.number() }),
        teamExercisePoints: v.object({
          base: v.number(),
          advanced: v.number(),
        }),
        teamExerciseThreshold: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow both admin and tournament_manager to create/edit
    const isAdmin = user.roles.includes("admin");
    const isTournamentManager = user.roles.includes("tournament_manager");

    if (!isAdmin && !isTournamentManager) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // If editing, verify permission
    if (args.id) {
      const tournament = await ctx.db.get(args.id);
      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Admins can edit any tournament
      // Tournament managers can only edit tournaments they manage
      if (!isAdmin) {
        const assignment = await ctx.db
          .query("tournamentManagers")
          .withIndex("by_tournament_and_manager", (q) =>
            q.eq("tournamentId", args.id).eq("managerId", user._id),
          )
          .first();

        if (!assignment) {
          throw new Error("You are not assigned to manage this tournament");
        }
      }

      // Update tournament
      await ctx.db.patch(args.id, {
        name: args.name,
        description: args.description,
        startDate: args.startDate,
        endDate: args.endDate,
        teamMinSize: args.teamMinSize,
        teamMaxSize: args.teamMaxSize,
        scoringConfig: args.scoringConfig,
      });

      return args.id;
    }

    // Create new tournament
    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      teamMinSize: args.teamMinSize,
      teamMaxSize: args.teamMaxSize,
      scoringConfig: args.scoringConfig || {
        individualPoints: { base: 2, advanced: 3 },
        teamExercisePoints: { base: 20, advanced: 30 },
        teamExerciseThreshold: 0.5,
      },
      createdBy: user._id,
    });

    // If tournament manager creates it, auto-assign them
    if (isTournamentManager) {
      await ctx.db.insert("tournamentManagers", {
        tournamentId,
        managerId: user._id,
        assignedBy: user._id,
        assignedAt: new Date().toISOString(),
      });
    }

    return tournamentId;
  },
});
```

#### `submissions.approve` & `submissions.reject` (modify existing)

```typescript
// Update to allow tournament_manager role
// In the permission check, add:

const isTournamentManager = user.roles.includes("tournament_manager");

if (!isAdmin && !isTournamentManager) {
  throw new Error("Admin or Tournament Manager access required");
}

// If tournament manager, verify they manage this tournament
if (!isAdmin && isTournamentManager) {
  const submission = await ctx.db.get(args.submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  const team = await ctx.db.get(submission.teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const assignment = await ctx.db
    .query("tournamentManagers")
    .withIndex("by_tournament_and_manager", (q) =>
      q.eq("tournamentId", team.tournamentId).eq("managerId", user._id),
    )
    .first();

  if (!assignment) {
    throw new Error("You are not assigned to manage this tournament");
  }
}

// Optionally: Log the action
await ctx.db.insert("submissionActions", {
  submissionId: args.submissionId,
  performedBy: user._id,
  action: "approved", // or "rejected"
  reason: args.reason,
  timestamp: new Date().toISOString(),
});
```

### New Queries

#### `tournamentManagers.getManagedTournaments`

```typescript
export const getManagedTournaments = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Admins can see all tournaments
    if (user.roles.includes("admin")) {
      return await ctx.db.query("tournaments").collect();
    }

    // Tournament managers see only their assigned tournaments
    if (user.roles.includes("tournament_manager")) {
      const assignments = await ctx.db
        .query("tournamentManagers")
        .withIndex("by_manager", (q) => q.eq("managerId", user._id))
        .collect();

      const tournaments = await Promise.all(
        assignments.map(async (assignment) => {
          return await ctx.db.get(assignment.tournamentId);
        }),
      );

      return tournaments.filter((t) => t !== null);
    }

    throw new Error("Insufficient permissions");
  },
});
```

#### `tournamentManagers.getDashboardStats`

```typescript
export const getDashboardStats = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (
      !user.roles.includes("tournament_manager") &&
      !user.roles.includes("admin")
    ) {
      throw new Error("Tournament Manager or Admin access required");
    }

    // Get managed tournaments
    const tournaments = await (user.roles.includes("admin")
      ? ctx.db.query("tournaments").collect()
      : (async () => {
          const assignments = await ctx.db
            .query("tournamentManagers")
            .withIndex("by_manager", (q) => q.eq("managerId", user._id))
            .collect();

          return await Promise.all(
            assignments.map((a) => ctx.db.get(a.tournamentId)),
          ).then((results) => results.filter((t) => t !== null));
        })());

    const now = new Date().toISOString().split("T")[0];

    // Categorize tournaments
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    // Count teams and submissions for managed tournaments
    let totalTeams = 0;
    let totalSubmissions = 0;
    let pendingSubmissions = 0;

    for (const tournament of tournaments) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
        .collect();

      totalTeams += teams.length;

      for (const team of teams) {
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        totalSubmissions += submissions.length;
        pendingSubmissions += submissions.filter(
          (s) => s.state === "pending",
        ).length;
      }
    }

    return {
      tournaments: {
        total: tournaments.length,
        active: activeTournaments.length,
        upcoming: upcomingTournaments.length,
        ended: endedTournaments.length,
      },
      teams: {
        total: totalTeams,
      },
      submissions: {
        total: totalSubmissions,
        pending: pendingSubmissions,
      },
    };
  },
});
```

#### `tournamentManagers.getRecentActivity`

```typescript
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit || 30;

    if (
      !user.roles.includes("tournament_manager") &&
      !user.roles.includes("admin")
    ) {
      throw new Error("Tournament Manager or Admin access required");
    }

    // Get managed tournament IDs
    const tournamentIds = user.roles.includes("admin")
      ? (await ctx.db.query("tournaments").collect()).map((t) => t._id)
      : await ctx.db
          .query("tournamentManagers")
          .withIndex("by_manager", (q) => q.eq("managerId", user._id))
          .collect()
          .then((assignments) => assignments.map((a) => a.tournamentId));

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      tournamentName?: string;
    }> = [];

    // Get teams created in managed tournaments
    for (const tournamentId of tournamentIds) {
      const tournament = await ctx.db.get(tournamentId);
      if (!tournament) continue;

      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
        .order("desc")
        .take(10);

      for (const team of teams) {
        const creator = await ctx.db.get(team.createdBy);
        activities.push({
          type: "team_created",
          description: `${creator?.name || "User"} created team "${team.name}"`,
          timestamp: team._creationTime,
          tournamentName: tournament.name,
        });
      }

      // Get recent submissions
      for (const team of teams) {
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .order("desc")
          .take(5);

        for (const sub of submissions) {
          if (sub.state === "approved" || sub.state === "rejected") {
            const submitter = await ctx.db.get(sub.userId);
            activities.push({
              type: `submission_${sub.state}`,
              description: `Submission by ${submitter?.name || "User"} for ${team.name} was ${sub.state}`,
              timestamp: sub._creationTime,
              tournamentName: tournament.name,
            });
          }
        }
      }
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});
```

#### `tournamentManagers.getAssignments`

```typescript
// For admin to view who manages which tournaments
export const getAssignments = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const query = args.tournamentId
      ? ctx.db
          .query("tournamentManagers")
          .withIndex("by_tournament", (q) =>
            q.eq("tournamentId", args.tournamentId),
          )
      : ctx.db.query("tournamentManagers");

    const assignments = await query.collect();

    const result = await Promise.all(
      assignments.map(async (assignment) => {
        const manager = await ctx.db.get(assignment.managerId);
        const tournament = await ctx.db.get(assignment.tournamentId);
        const assignedBy = await ctx.db.get(assignment.assignedBy);

        return {
          assignmentId: assignment._id,
          manager: {
            id: manager?._id,
            name: manager?.name,
            email: manager?.email,
          },
          tournament: {
            id: tournament?._id,
            name: tournament?.name,
          },
          assignedBy: {
            name: assignedBy?.name,
          },
          assignedAt: assignment.assignedAt,
        };
      }),
    );

    return result;
  },
});
```

## Frontend Implementation

### New Components

#### `TournamentManagerStatsCards`

**Location:** `src/components/tournament-manager/tournament-manager-stats-cards.tsx`

```typescript
interface TournamentManagerStatsCardsProps {
  stats: {
    tournaments: {
      total: number;
      active: number;
      upcoming: number;
      ended: number;
    };
    teams: { total: number };
    submissions: { total: number; pending: number };
  };
}

// Features:
// - Grid of stat cards (3 columns)
// - Tournaments card: shows active/upcoming/ended breakdown
// - Teams card: total teams across managed tournaments
// - Submissions card: pending count highlighted, total count
// - Click to navigate to relevant filtered views
```

#### `ManagedTournamentsList`

**Location:** `src/components/tournament-manager/managed-tournaments-list.tsx`

```typescript
interface ManagedTournamentsListProps {
  tournaments: Array<Tournament>;
}

// Features:
// - List/grid of tournaments user manages
// - Each card shows:
//   - Tournament name and dates
//   - Status badge (active/upcoming/ended)
//   - Quick stats (teams, submissions, pending)
//   - Actions: View Details, Manage Submissions, View Leaderboard
// - Filter by status
// - Sort by start date, name
```

#### `TournamentManagerActivityFeed`

**Location:** `src/components/tournament-manager/tournament-manager-activity-feed.tsx`

```typescript
interface TournamentManagerActivityFeedProps {
  activities: Array<{
    type: string;
    description: string;
    timestamp: number;
    tournamentName?: string;
  }>;
}

// Features:
// - Timeline of recent activity in managed tournaments
// - Shows tournament name tag for each activity
// - Icons based on activity type
// - Relative timestamps
// - Real-time updates
```

#### `TournamentManagerQuickActions`

**Location:** `src/components/tournament-manager/tournament-manager-quick-actions.tsx`

```typescript
// Features:
// - Grid of action buttons
// - "Create Tournament"
// - "View Pending Submissions"
// - "Manage Teams"
// - "View Analytics"
// - Each navigates to relevant page with filters applied
```

#### `AssignManagerDialog`

**Location:** `src/components/admin/assign-manager-dialog.tsx`

```typescript
interface AssignManagerDialogProps {
  tournamentId: Id<"tournaments">;
}

// Features:
// - Admin-only component
// - Combobox to search and select users with tournament_manager role
// - Shows currently assigned managers
// - Add/remove managers
// - Displays assignment history
```

### New Pages

#### `/tournament-manager/page.tsx`

**Location:** `src/app/(all)/tournament-manager/page.tsx`

```typescript
export default function TournamentManagerDashboard() {
  const { user } = useUser();
  const stats = useQuery(api.tournamentManagers.getDashboardStats);
  const tournaments = useQuery(api.tournamentManagers.getManagedTournaments);
  const activity = useQuery(api.tournamentManagers.getRecentActivity, { limit: 30 });

  // Redirect if not tournament manager or admin
  if (!user?.roles?.includes("tournament_manager") && !user?.roles?.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tournament Manager Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your assigned tournaments
        </p>
      </div>

      {/* Quick Actions */}
      <TournamentManagerQuickActions />

      {/* Stats */}
      {stats && <TournamentManagerStatsCards stats={stats} />}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Managed Tournaments (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments ? (
              <ManagedTournamentsList tournaments={tournaments} />
            ) : (
              <Skeleton className="h-96" />
            )}
          </CardContent>
        </Card>

        {/* Activity Feed (1 column) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity ? (
              <TournamentManagerActivityFeed activities={activity} />
            ) : (
              <Skeleton className="h-96" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### `/tournament-manager/submissions/page.tsx`

**Location:** `src/app/(all)/tournament-manager/submissions/page.tsx`

```typescript
// Filtered view of submissions for managed tournaments only
// Features:
// - Table of all submissions from managed tournaments
// - Filter by tournament, team, status
// - Bulk approve/reject actions
// - Inline approve/reject with reason
// - Export to CSV
```

### Modified Components

#### `Sidebar`

**Location:** `src/components/ui/sidebar.tsx`

```typescript
// Add "Tournament Manager" section (show only if user has role):
// - Dashboard (/tournament-manager)
// - My Tournaments (/tournament-manager/tournaments)
// - Submissions (/tournament-manager/submissions)
// - Analytics (/tournament-manager/analytics)
```

#### `TournamentDetailsCard` (for admins)

**Location:** `src/components/tournaments/tournament-details-card.tsx`

```typescript
// Add "Manage Assignments" button for admins
// Opens AssignManagerDialog
// Shows list of assigned managers
```

## UI/UX Considerations

### Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│ Tournament Manager Dashboard                         │
│ Manage your assigned tournaments                     │
├──────────────────────────────────────────────────────┤
│ [Create Tournament] [Pending Submissions] [Teams]    │
├──────────────────────────────────────────────────────┤
│ [Tournaments: 5]  [Teams: 23]  [Pending: 12]        │
│  3 active           across all    submissions        │
├─────────────────────────────────────┬────────────────┤
│ Your Tournaments                    │ Recent Activity│
│ ┌─────────────────────────────────┐ │ - Team created │
│ │ Tournament A  [Active] [View]   │ │ - Submission   │
│ │ 5 teams, 3 pending submissions  │ │ - Approved     │
│ └─────────────────────────────────┘ │ ...            │
│ ┌─────────────────────────────────┐ │                │
│ │ Tournament B  [Upcoming] [View] │ │                │
│ └─────────────────────────────────┘ │                │
└─────────────────────────────────────┴────────────────┘
```

### Color Scheme

- **Stats Cards:** Purple (tournaments), Blue (teams), Orange (submissions)
- **Status Badges:** Green (active), Blue (upcoming), Gray (ended)
- **Action Buttons:** Primary color with icons

### Permission Indicators

- Show "Manager" badge on tournaments user manages
- Show "Assigned to you" label in tournament lists
- Gray out actions user cannot perform

### Real-Time Updates

- Stats refresh automatically
- Activity feed updates in real-time
- Toast notifications for new pending submissions
- Badge count on "Pending Submissions" button

## Testing Checklist

### Unit Tests

- [ ] Only tournament managers can access dashboard
- [ ] Tournament managers see only assigned tournaments
- [ ] Admins can assign/unassign managers
- [ ] Tournament managers can approve submissions
- [ ] Permission checks work correctly
- [ ] Cannot assign non-tournament-manager users

### Integration Tests

- [ ] Dashboard loads correct data
- [ ] Assignment system works end-to-end
- [ ] Submission approval updates points
- [ ] Activity feed shows relevant activities
- [ ] Real-time updates work

### UI Tests

- [ ] Stats cards display correctly
- [ ] Tournament list filters work
- [ ] Assignment dialog works (admin)
- [ ] Mobile responsive
- [ ] Loading states render

## Edge Cases

1. **User loses tournament_manager role**
   - Redirect to dashboard
   - Show toast notification

2. **Manager unassigned from tournament while viewing**
   - Show error message
   - Redirect to dashboard
   - Remove from managed tournaments list

3. **Tournament deleted while manager viewing**
   - Handle gracefully
   - Show "Tournament no longer exists" message

4. **No tournaments assigned**
   - Show empty state
   - "No tournaments assigned yet"
   - Link to contact admin

5. **Manager assigned to ended tournament**
   - Still show in list (historical access)
   - Mark as "Ended" clearly
   - Read-only access to data

## Performance Optimization

- Cache managed tournaments list for 5 seconds
- Paginate activity feed if >100 items
- Lazy load tournament details
- Debounce filter inputs
- Virtual scrolling for long lists

## Migration & Deployment

### Migration Steps

1. **Create Schema**
   - Add `tournamentManagers` table
   - Add `submissionActions` table (optional)
   - Deploy schema

2. **Migrate Existing Data**
   - Identify users with tournament_manager role
   - Ask admins to assign managers to tournaments
   - Or auto-assign based on some logic

3. **Update Backend**
   - Add tournament manager queries
   - Update permission checks in mutations
   - Deploy backend

4. **Build Frontend**
   - Create tournament manager components
   - Create dashboard page
   - Update sidebar
   - Deploy frontend

5. **Admin Training**
   - Document how to assign managers
   - Show assignment interface
   - Explain delegation workflow

## Success Metrics

- 80%+ of tournament managers visit dashboard weekly
- <1 second dashboard load time
- 50%+ reduction in admin workload for tournament management
- Zero unauthorized access to tournaments
- 90%+ of submissions reviewed within 24 hours

## Future Enhancements

- Tournament manager notifications (email/push)
- Delegation of specific permissions (fine-grained)
- Tournament templates
- Automated submission approval rules
- Manager performance dashboard (for admins)
- Manager activity reports
- Multi-tournament analytics
- Tournament cloning
- Scheduled tournament start/end actions
- Integration with external systems

## Dependencies

- Existing Convex backend
- Shadcn/ui components
- Lucide icons
- date-fns for date formatting
- React hooks (useQuery, useMutation, useUser)
- TanStack Table for submission lists

## Open Questions

1. **Should tournament managers be able to delete tournaments?**
   - No - keep as admin-only for safety

2. **Can a tournament have no assigned managers?**
   - Yes - defaults to admin-only management

3. **Should managers see submissions from tournaments they don't manage?**
   - No - strict scoping for security

4. **Allow tournament managers to assign other managers?**
   - Post-MVP feature - requires delegation permissions

5. **Should managers be notified when assigned to a tournament?**
   - Yes - send email/notification (future enhancement)
