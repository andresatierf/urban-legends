# Simple Tournament Manager Permissions with Dashboard

**Priority:** HIGH
**Status:** Not Implemented
**Estimated Effort:** 1 day (6-7 hours)

## Problem Statement

The `tournament_manager` role exists in the system but has limited functionality. Users with this role should be able to manage tournaments without requiring complex assignment mechanisms. This spec provides a simplified approach where:

- Any user with the `tournament_manager` role can manage **all** tournaments (not scoped to specific tournaments)
- Tournament managers have permissions similar to admins for tournament-related operations
- Tournament managers get a dedicated dashboard for oversight and management
- No database schema changes required - leverages existing role system

## Current State

### What Exists

- `tournament_manager` role defined in roles system (hierarchy: 2)
- Role description: "Can create/manage tournaments, approve submissions, view analytics"
- Basic role checking in backend (`user.roleNames.includes("tournament_manager")`)
- Admin tournament management pages

### What's Missing

- Tournament managers cannot create tournaments (admin-only)
- Tournament managers cannot approve/reject submissions (admin-only)
- Tournament managers cannot access admin tournament pages
- No dedicated dashboard for tournament managers
- No centralized submission management interface
- No activity feed for tournament events
- No overview statistics for tournament managers
- Tournament manager features not visible in sidebar navigation

## Requirements

### Functional Requirements

1. **Tournament Management**

   - Tournament managers can create new tournaments
   - Tournament managers can edit any tournament
   - Tournament managers cannot delete tournaments (admin-only for safety)
   - Tournament managers can view all tournaments

2. **Submission Management**

   - Tournament managers can approve submissions
   - Tournament managers can reject submissions with reason
   - Tournament managers can view all submissions across all tournaments

3. **Team Oversight**

   - Tournament managers can view all teams
   - Tournament managers can view team composition
   - Tournament managers cannot create/delete teams (users do this)
   - Tournament managers can remove teams that violate rules (via admin interface)

4. **Analytics & Leaderboards**

   - Tournament managers can view tournament leaderboards
   - Tournament managers can view tournament statistics
   - Tournament managers can view team statistics
   - Tournament managers can determine tournament winners

5. **Access Control**
   - Tournament managers can access `/admin/tournaments` page
   - Tournament managers can access `/admin/submissions` page (if it exists)
   - Tournament managers cannot manage users or roles (admin-only)
   - Tournament managers cannot access other admin-only pages

### Non-Functional Requirements

- All permission checks must validate `tournament_manager` OR `admin` role
- No schema changes required
- Maintain backwards compatibility with existing admin permissions
- Dashboard loads in <1 second

## Backend Implementation

### Modified Mutations

#### `tournaments.upsert` (modify existing)

**Location:** `convex/tournaments.ts`

Update the permission check to allow tournament managers:

```typescript
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

    // Allow both admin and tournament_manager
    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

#### `tournaments.remove` (modify existing)

**Location:** `convex/tournaments.ts`

Keep admin-only for safety:

```typescript
export const remove = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Admin-only for safety
    if (!user.roleNames.includes("admin")) {
      throw new Error("Admin access required to delete tournaments");
    }

    // Rest of existing implementation...
  },
});
```

#### `tournaments.determineWinner` (modify existing)

**Location:** `convex/tournaments.ts`

Allow tournament managers:

```typescript
export const determineWinner = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    winnerId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

#### `submissions.approve` (modify existing)

**Location:** `convex/submissions.ts`

Update permission check:

```typescript
export const approve = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow both admin and tournament_manager
    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

#### `submissions.reject` (modify existing)

**Location:** `convex/submissions.ts`

Update permission check:

```typescript
export const reject = mutation({
  args: {
    submissionId: v.id("submissions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow both admin and tournament_manager
    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

#### `submissions.remove` (modify existing)

**Location:** `convex/submissions.ts`

Update permission check:

```typescript
export const remove = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow both admin and tournament_manager
    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

#### `teams.remove` (modify existing)

**Location:** `convex/teams.ts`

Update permission check:

```typescript
export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow both admin and tournament_manager
    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

#### `teams.recalculatePoints` (modify existing)

**Location:** `convex/teams.ts`

Update permission check:

```typescript
export const recalculatePoints = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Allow both admin and tournament_manager
    if (
      !user.roleNames.includes("admin") &&
      !user.roleNames.includes("tournament_manager")
    ) {
      throw new Error("Admin or Tournament Manager access required");
    }

    // Rest of existing implementation...
  },
});
```

### New Queries for Dashboard

#### `tournamentManagers.getDashboardStats`

**Location:** `convex/tournamentManagers.ts` (new file)

Provides overview statistics for the tournament manager dashboard:

```typescript
export const getDashboardStats = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roleNames.includes("tournament_manager") && !user.roleNames.includes("admin")) {
      throw new Error("Tournament Manager or Admin access required");
    }

    // Get all tournaments (tournament managers can access all)
    const tournaments = await ctx.db.query("tournaments").collect();

    const now = new Date().toISOString().split("T")[0];

    // Categorize tournaments
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    // Count teams and submissions across all tournaments
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
        pendingSubmissions += submissions.filter((s) => s.state === "pending").length;
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

**Location:** `convex/tournamentManagers.ts`

Returns recent activity across all tournaments:

```typescript
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit || 30;

    if (!user.roleNames.includes("tournament_manager") && !user.roleNames.includes("admin")) {
      throw new Error("Tournament Manager or Admin access required");
    }

    // Get all tournaments
    const tournaments = await ctx.db.query("tournaments").collect();

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      tournamentName?: string;
    }> = [];

    // Get recent teams and submissions for each tournament
    for (const tournament of tournaments) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
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

### Modified Queries

All existing tournament and submission queries should already work for tournament managers since they don't typically have role restrictions. Verify and update if needed:

- `tournaments.list`
- `tournaments.get`
- `tournaments.getLeaderboard`
- `tournaments.getStatistics`
- `submissions.list` (if it exists, add filtering by tournamentId and status)
- `teams.list`
- `teams.getStatistics`

## Frontend Implementation

### New Components

#### `TournamentManagerStatsCards`

**Location:** `src/components/tournament-manager/tournament-manager-stats-cards.tsx`

Display overview statistics for tournament manager dashboard:

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
// - Grid of stat cards (3 columns, responsive)
// - Tournaments card: shows active/upcoming/ended breakdown with status badges
// - Teams card: total teams across managed tournaments
// - Submissions card: pending count highlighted, total count
// - Click to navigate to relevant filtered views
// - Loading skeleton states
// - Color scheme: Purple (tournaments), Blue (teams), Orange (submissions)
```

#### `ManagedTournamentsList`

**Location:** `src/components/tournament-manager/managed-tournaments-list.tsx`

List/grid view of tournaments the manager has access to:

```typescript
interface ManagedTournamentsListProps {
  tournaments: Array<Tournament>;
}

// Features:
// - List/grid of all tournaments (since manager can access all)
// - Each card shows:
//   - Tournament name and dates
//   - Status badge (active/upcoming/ended)
//   - Quick stats (teams count, submissions count, pending count)
//   - Actions: View Details, Manage Submissions, View Leaderboard, Edit
// - Filter by status (all/active/upcoming/ended)
// - Sort by start date, name, status
// - Empty state for no tournaments
// - Responsive grid layout
```

#### `TournamentManagerActivityFeed`

**Location:** `src/components/tournament-manager/tournament-manager-activity-feed.tsx`

Real-time activity feed for recent tournament events:

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
// - Timeline of recent activity across all tournaments
// - Shows tournament name tag for each activity
// - Icons based on activity type (team created, submission approved/rejected)
// - Relative timestamps (e.g., "2 hours ago")
// - Real-time updates via Convex
// - Max height with scrolling
// - Empty state for no activity
```

#### `TournamentManagerQuickActions`

**Location:** `src/components/tournament-manager/tournament-manager-quick-actions.tsx`

Quick action buttons for common tasks:

```typescript
// Features:
// - Grid of action buttons (2x2 or 4 columns)
// - "Create Tournament" - navigate to tournament creation form
// - "View Pending Submissions" - navigate to submissions page filtered by pending
// - "Manage Teams" - navigate to teams overview
// - "View Analytics" - navigate to analytics/statistics page
// - Each button with icon and description
// - Responsive grid layout
// - Disabled states if no data (e.g., no pending submissions)
```

### New Pages

#### `/tournament-manager/page.tsx`

**Location:** `src/app/(all)/tournament-manager/page.tsx`

Main tournament manager dashboard:

```typescript
export default function TournamentManagerDashboard() {
  const { user } = useUser();
  const stats = useQuery(api.tournamentManagers.getDashboardStats);
  const tournaments = useQuery(api.tournaments.list); // All tournaments
  const activity = useQuery(api.tournamentManagers.getRecentActivity, { limit: 30 });

  // Redirect if not tournament manager or admin
  if (!user?.roleNames?.includes("tournament_manager") && !user?.roleNames?.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournament Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tournaments, submissions, and teams
          </p>
        </div>
        {/* Role badge indicator */}
        <Badge variant={user?.roleNames?.includes("admin") ? "default" : "secondary"}>
          {user?.roleNames?.includes("admin") ? "Admin" : "Tournament Manager"}
        </Badge>
      </div>

      {/* Quick Actions */}
      <TournamentManagerQuickActions />

      {/* Stats Cards */}
      {stats ? (
        <TournamentManagerStatsCards stats={stats} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Managed Tournaments (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tournaments</CardTitle>
            <CardDescription>All tournaments in the system</CardDescription>
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
            <CardDescription>Latest updates across all tournaments</CardDescription>
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

**Features:**
- Dashboard overview with statistics
- Quick action buttons for common tasks
- List of all tournaments (since managers can access all)
- Real-time activity feed
- Role badge indicator
- Loading states
- Responsive layout
- Auto-refresh with Convex

#### `/tournament-manager/submissions/page.tsx`

**Location:** `src/app/(all)/tournament-manager/submissions/page.tsx`

Dedicated submission management page for tournament managers:

```typescript
export default function TournamentManagerSubmissions() {
  const { user } = useUser();
  const [tournamentFilter, setTournamentFilter] = useState<Id<"tournaments"> | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Get all submissions (can filter by tournament/status)
  const submissions = useQuery(api.submissions.list, {
    tournamentId: tournamentFilter === "all" ? undefined : tournamentFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const tournaments = useQuery(api.tournaments.list);

  // Redirect if not tournament manager or admin
  if (!user?.roleNames?.includes("tournament_manager") && !user?.roleNames?.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Submission Management</h1>
        <p className="text-muted-foreground">
          Review and approve submissions from all tournaments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {/* Tournament filter */}
          <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tournaments</SelectItem>
              {tournaments?.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {submissions?.length || 0} submission(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Use existing SubmissionsDataTable or create new one with approve/reject actions */}
          <SubmissionsDataTable submissions={submissions || []} />
        </CardContent>
      </Card>
    </div>
  );
}

// Features:
// - Table of all submissions across all tournaments
// - Filter by tournament dropdown
// - Filter by status (all/pending/approved/rejected)
// - Inline approve/reject actions with reason dialog
// - Bulk approve/reject for multiple selections
// - Real-time updates
// - Export to CSV functionality
// - Pagination for large datasets
// - Show submission details (date, user, team, tournament, tier)
// - Display pointsEarned for approved submissions
```

### Modified Components

#### `Sidebar` Navigation

**Location:** `src/components/ui/sidebar.tsx` (or wherever sidebar is defined)

Add tournament manager section to sidebar:

```typescript
// Show "Tournament Management" section for admins AND tournament managers
{(user?.roleNames?.includes("admin") || user?.roleNames?.includes("tournament_manager")) && (
  <SidebarGroup>
    <SidebarGroupLabel>Tournament Management</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/tournament-manager">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/admin/tournaments">
              <Trophy className="h-4 w-4" />
              <span>Tournaments</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/tournament-manager/submissions">
              <FileText className="h-4 w-4" />
              <span>Submissions</span>
              {/* Optional: Badge with pending count */}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)}

// Keep User/Role management admin-only
{user?.roleNames?.includes("admin") && (
  <SidebarGroup>
    <SidebarGroupLabel>Administration</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/admin/users">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/admin/roles">
              <Shield className="h-4 w-4" />
              <span>Roles</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)}
```

### Modified Pages

#### `/admin/tournaments/page.tsx`

**Location:** `src/app/(all)/admin/tournaments/page.tsx`

Update permission check to allow tournament managers:

```typescript
export default function TournamentsPage() {
  const { user } = useUser();

  // Allow both admin and tournament_manager
  if (
    !user?.roleNames?.includes("admin") &&
    !user?.roleNames?.includes("tournament_manager")
  ) {
    redirect("/dashboard");
  }

  // Rest of existing implementation...
}
```

#### Other Admin Pages

Update these pages to restrict to admin-only (keep tournament managers out):

- `/admin/users/page.tsx` - admin-only
- `/admin/roles/page.tsx` - admin-only
- `/admin/teams/page.tsx` - allow tournament_manager
- Any other admin pages - evaluate case-by-case

### UI Indicators

Add visual indicators to show role-based permissions:

1. **Page Headers**

   - Show "Tournament Manager" badge for non-admin tournament managers
   - Show "Admin" badge for admins
   - Use Badge component with variant="secondary" for tournament manager

2. **Button States**

   - Hide "Delete Tournament" button for tournament managers
   - Show all other tournament actions (Edit, View, Leaderboard, etc.)
   - Add conditional rendering based on role check

3. **Tooltips**
   - Add tooltips explaining why certain actions are disabled
   - Example: "Only admins can delete tournaments"
   - Use Tooltip component from shadcn/ui

## Permission Matrix

| Action              | Admin | Tournament Manager | User           |
| ------------------- | ----- | ------------------ | -------------- |
| View tournaments    | ✅    | ✅                 | ✅             |
| Create tournament   | ✅    | ✅                 | ❌             |
| Edit tournament     | ✅    | ✅                 | ❌             |
| Delete tournament   | ✅    | ❌                 | ❌             |
| Approve submissions | ✅    | ✅                 | ❌             |
| Reject submissions  | ✅    | ✅                 | ❌             |
| Remove submissions  | ✅    | ✅                 | ❌             |
| View teams          | ✅    | ✅                 | ✅ (own teams) |
| Remove teams        | ✅    | ✅                 | ❌             |
| Determine winner    | ✅    | ✅                 | ❌             |
| Recalculate points  | ✅    | ✅                 | ❌             |
| Manage users        | ✅    | ❌                 | ❌             |
| Manage roles        | ✅    | ❌                 | ❌             |
| View leaderboard    | ✅    | ✅                 | ✅             |
| View statistics     | ✅    | ✅                 | ✅ (own teams) |

## Testing Checklist

### Backend Tests

- [ ] Tournament managers can create tournaments
- [ ] Tournament managers can edit tournaments
- [ ] Tournament managers CANNOT delete tournaments
- [ ] Tournament managers can approve submissions
- [ ] Tournament managers can reject submissions
- [ ] Tournament managers can remove teams
- [ ] Tournament managers can determine winners
- [ ] Tournament managers CANNOT manage users
- [ ] Tournament managers CANNOT manage roles
- [ ] Permission errors return correct messages
- [ ] `getDashboardStats` query returns correct data
- [ ] `getRecentActivity` query returns sorted activities
- [ ] Dashboard queries enforce tournament_manager/admin role

### Frontend Tests

#### Navigation & Access
- [ ] Tournament managers see "Tournament Management" section in sidebar
- [ ] Tournament managers can access `/tournament-manager` dashboard
- [ ] Tournament managers can access `/tournament-manager/submissions`
- [ ] Tournament managers can access `/admin/tournaments`
- [ ] Tournament managers CANNOT access `/admin/users`
- [ ] Tournament managers CANNOT access `/admin/roles`
- [ ] Redirect to dashboard if user lacks tournament_manager role

#### Dashboard Page
- [ ] Dashboard loads without errors
- [ ] Stats cards display correct numbers (tournaments, teams, submissions)
- [ ] Tournament breakdown (active/upcoming/ended) is accurate
- [ ] Pending submissions count is highlighted
- [ ] Quick action buttons navigate correctly
- [ ] Managed tournaments list shows all tournaments
- [ ] Activity feed displays recent events
- [ ] Activity feed shows tournament names
- [ ] Activity feed updates in real-time
- [ ] Role badge displays correctly (Admin vs Tournament Manager)
- [ ] Loading states render properly

#### Submissions Page
- [ ] Submissions table loads all submissions
- [ ] Filter by tournament works correctly
- [ ] Filter by status (all/pending/approved/rejected) works
- [ ] Approve submission button works
- [ ] Reject submission with reason works
- [ ] Submission count updates after filtering
- [ ] Real-time updates when submissions change

#### UI & Permissions
- [ ] Delete button hidden for tournament managers in tournament lists
- [ ] All other tournament actions visible (Edit, View, Leaderboard)
- [ ] Tooltips explain disabled actions
- [ ] Stats cards use correct color scheme (purple/blue/orange)
- [ ] Status badges display with correct colors
- [ ] Empty states show when no data

#### Responsive Design
- [ ] Dashboard layout responsive on mobile
- [ ] Stats cards stack properly on small screens
- [ ] Activity feed readable on mobile
- [ ] Submissions page filters work on mobile
- [ ] Tournament list grid adapts to screen size

## Implementation Order

1. **Backend Permission Updates** (45 min)

   - Update all tournament mutations to allow `tournament_manager`
   - Update submission mutations to allow `tournament_manager`
   - Update team mutations to allow `tournament_manager`
   - Create new `convex/tournamentManagers.ts` file
   - Implement `getDashboardStats` query
   - Implement `getRecentActivity` query
   - Test permission checks

2. **Dashboard Components** (2 hours)

   - Create `TournamentManagerStatsCards` component
   - Create `ManagedTournamentsList` component
   - Create `TournamentManagerActivityFeed` component
   - Create `TournamentManagerQuickActions` component
   - Add proper loading states and error handling
   - Style with Tailwind and match existing design patterns

3. **Dashboard Pages** (1.5 hours)

   - Create `/tournament-manager/page.tsx` dashboard page
   - Create `/tournament-manager/submissions/page.tsx` page
   - Implement filtering and sorting logic
   - Add permission checks and redirects
   - Integrate components with Convex queries

4. **Sidebar Navigation** (15 min)

   - Update sidebar to show "Tournament Management" section for tournament managers
   - Add Dashboard, Tournaments, and Submissions links
   - Keep admin-only sections restricted

5. **Page Protection & Updates** (30 min)

   - Update `/admin/tournaments/page.tsx` to allow tournament managers
   - Verify `/admin/users` and `/admin/roles` remain admin-only
   - Update `/admin/teams/page.tsx` to allow tournament managers

6. **UI Polish** (45 min)

   - Add role badges to dashboard header
   - Hide delete buttons for tournament managers in tournament tables
   - Add tooltips for disabled actions
   - Ensure responsive design across all new pages
   - Add activity feed icons and formatting

7. **Testing** (45 min)
   - Test all CRUD operations
   - Verify permission boundaries
   - Test dashboard data loading
   - Test activity feed updates
   - Test filtering and sorting
   - Test mobile responsive design
   - Verify UI flows end-to-end

**Total Estimated Time:** 6-7 hours (1 day)

## Edge Cases

1. **User loses tournament_manager role while viewing page**

   - Redirect to `/dashboard`
   - Show toast: "Your permissions have changed"
   - Remove tournament management nav items

2. **User has both admin and tournament_manager roles**

   - Show as admin (higher privilege) in badge
   - Full access to all features
   - Show both admin and tournament sections in sidebar

3. **Tournament manager attempts admin-only action**

   - Show error toast with clear message
   - Log attempt for security monitoring
   - Do not expose internal error details

4. **No tournaments exist in system**

   - Show empty state on dashboard
   - "No tournaments yet. Create your first tournament!"
   - Provide "Create Tournament" button

5. **No pending submissions**

   - Show "0 pending" in stats with neutral styling
   - "All caught up!" message on submissions page
   - Empty state in activity feed if no recent activity

6. **Dashboard stats slow to load**

   - Show skeleton loaders for each section
   - Load stats, tournaments, and activity independently
   - Don't block entire page render

7. **Activity feed has hundreds of items**

   - Limit to 30 most recent by default
   - Add pagination or "Load more" button
   - Consider virtual scrolling for performance

8. **Tournament deleted while viewing dashboard**
   - Handle gracefully with null checks
   - Filter out null tournaments from lists
   - Show toast: "Some tournaments were removed"

9. **User refreshes page during data load**
   - Convex handles this automatically with queries
   - Ensure loading states don't flicker
   - Cache data appropriately

## Success Metrics

- Tournament managers can perform 90%+ of tournament-related tasks
- Zero unauthorized access to user/role management
- <1 second page load for tournament pages
- 100% permission check coverage on mutations

## Future Enhancements

- Add audit logging for tournament manager actions
- Create analytics dashboard for tournament performance
- Add email notifications for submission approvals
- Implement tournament templates
- Add bulk operations for submissions

## Dependencies

- Existing role system (`convex/roles.ts`)
- Current user context (`getCurrentUserOrThrow`)
- Admin tournament pages
- Sidebar navigation component

## Migration Steps

Since this requires no schema changes, deployment is straightforward:

1. **Deploy Backend Changes**

   - Update mutation permission checks
   - Deploy to Convex

2. **Deploy Frontend Changes**

   - Update sidebar navigation
   - Update page protections
   - Deploy Next.js app

3. **Test in Production**

   - Verify tournament manager can create tournaments
   - Verify cannot access admin-only pages
   - Test all CRUD operations

4. **Document**
   - Update role descriptions
   - Create tournament manager user guide
   - Add to admin documentation

## Notes

This simplified approach with dashboard:

**Advantages:**
- ✅ No schema changes required (no `tournamentManagers` table)
- ✅ Clear permission model - tournament managers can access all tournaments
- ✅ Easy to understand and maintain
- ✅ Dedicated dashboard for tournament managers
- ✅ Real-time activity feed
- ✅ Comprehensive statistics and overview
- ✅ Centralized submission management
- ✅ Role-based UI indicators
- ✅ Mobile responsive design

**Trade-offs:**
- ❌ No fine-grained tournament assignment (all tournament managers see all tournaments)
- ❌ All tournament managers have equal access
- ❌ No audit trail for manager assignments
- ⚠️ Longer implementation time (1 day vs 2 hours) due to dashboard

**When to use this approach:**
- Small to medium teams where all tournament managers should have equal access
- Organizations with high trust between tournament managers
- Quick to deploy and doesn't require complex assignment workflows
- Dashboard provides good oversight without granular permissions

**When to upgrade to spec 11:**
- Large organizations with many tournament managers
- Need to limit specific managers to specific tournaments
- Require audit trails for who manages what
- Need manager assignment workflows and notifications

For most use cases, this simple model with dashboard is sufficient and provides excellent UX for tournament managers. The dashboard gives managers a centralized view of all tournament activity while keeping the permission model simple. If you later need fine-grained tournament assignment, you can extend this with spec 11's `tournamentManagers` table without breaking existing functionality.
