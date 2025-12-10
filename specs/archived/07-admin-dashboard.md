# Admin Dashboard

**Priority:** MEDIUM
**Status:** Placeholder Only
**Estimated Effort:** 2 days

## Problem Statement

Admin statistics are currently displayed on the user dashboard, but there is no dedicated admin dashboard. The sidebar links to `/admin` but the page doesn't exist. Admins need a centralized view for:

- System-wide statistics
- Recent activity across all users/teams
- Quick actions for common admin tasks
- Monitoring submission approvals
- User management shortcuts

## Current State

### What Exists

- Admin stats shown on user dashboard (when user is admin)
- Individual admin pages: `/tournaments`, `/teams`, `/users`, `/submissions`
- Sidebar navigation with "Admin" section
- Admin permission checks in backend

### What's Missing

- No `/admin` route/page
- No centralized admin dashboard
- No recent activity feed
- No admin action shortcuts
- No system health/status indicators

### Evidence

- Sidebar in `src/components/ui/sidebar.tsx` links to `/admin` (line 35)
- Dashboard shows admin stats but it's mixed with user content
- CLAUDE.md mentions "Dashboard links to non-existent `/admin` page" (line 170)

## Requirements

### Functional Requirements

1. **System Statistics Overview**

   - Total users (with new users this week)
   - Total tournaments (active/upcoming/ended)
   - Total teams
   - Total submissions (pending/approved/rejected)
   - Activity trends (charts showing growth)

2. **Recent Activity Feed**

   - New user registrations
   - New tournaments created
   - Teams created
   - Submissions pending approval
   - Recent approvals/rejections
   - Role changes
   - Limit to last 50 items

3. **Quick Actions Panel**

   - "Create Tournament" button
   - "View Pending Submissions" button
   - "Manage Users" button
   - "View All Teams" button
   - "System Settings" link (future)

4. **Alerts & Notifications**

   - Submissions awaiting approval (count badge)
   - Tournaments ending soon
   - Teams below minimum size
   - Inactive admins (security concern)
   - System errors/warnings

5. **Admin Navigation**
   - Quick links to all admin pages
   - Search box for users/teams/tournaments
   - Breadcrumb navigation

### Non-Functional Requirements

- Dashboard loads in <1 second
- Statistics update in real-time (Convex)
- Mobile-responsive layout
- Clean, scannable design
- Export capabilities (CSV) for statistics

## Database Schema Changes

No schema changes required. Uses existing tables.

Optional: Add for enhanced features:

```typescript
// Optional: Track system events for activity feed
systemEvents: defineTable({
  type: v.union(
    v.literal("user_registered"),
    v.literal("tournament_created"),
    v.literal("team_created"),
    v.literal("submission_approved"),
    v.literal("submission_rejected"),
    v.literal("role_changed")
  ),
  userId: v.optional(v.id("users")),
  performedBy: v.optional(v.id("users")),
  entityId: v.optional(v.string()), // ID of affected entity
  entityType: v.optional(v.string()), // "tournament", "team", etc.
  description: v.string(),
  timestamp: v.string(),
})
  .index("by_type", ["type"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user", ["userId"]),
```

## Backend Implementation

### New Queries

#### `admin.getDashboardStats`

```typescript
export const getDashboardStats = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Count users
    const users = await ctx.db.query("users").collect();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = users.filter((u) => {
      const createdAt = new Date(u._creationTime);
      return createdAt > oneWeekAgo;
    });

    // Count tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    const now = new Date().toISOString().split("T")[0];
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    // Count teams
    const teams = await ctx.db.query("teams").collect();

    // Count submissions
    const submissions = await ctx.db.query("submissions").collect();
    const pendingSubmissions = submissions.filter((s) => s.state === "pending");
    const approvedSubmissions = submissions.filter(
      (s) => s.state === "approved",
    );
    const rejectedSubmissions = submissions.filter(
      (s) => s.state === "rejected",
    );

    return {
      users: {
        total: users.length,
        newThisWeek: newUsersThisWeek.length,
      },
      tournaments: {
        total: tournaments.length,
        active: activeTournaments.length,
        upcoming: upcomingTournaments.length,
        ended: endedTournaments.length,
      },
      teams: {
        total: teams.length,
      },
      submissions: {
        total: submissions.length,
        pending: pendingSubmissions.length,
        approved: approvedSubmissions.length,
        rejected: rejectedSubmissions.length,
      },
    };
  },
});
```

#### `admin.getRecentActivity`

```typescript
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()), // Default 50
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const limit = args.limit || 50;

    // If systemEvents table exists, use it
    // Otherwise, aggregate from multiple tables:

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      userId?: Id<"users">;
      userName?: string;
    }> = [];

    // Recent users (last 50)
    const recentUsers = await ctx.db.query("users").order("desc").take(20);

    for (const u of recentUsers) {
      activities.push({
        type: "user_registered",
        description: `${u.name} joined the platform`,
        timestamp: u._creationTime,
        userId: u._id,
        userName: u.name,
      });
    }

    // Recent tournaments
    const recentTournaments = await ctx.db
      .query("tournaments")
      .order("desc")
      .take(20);

    for (const t of recentTournaments) {
      const creator = await ctx.db.get(t.createdBy);
      activities.push({
        type: "tournament_created",
        description: `${creator?.name || "Admin"} created tournament "${t.name}"`,
        timestamp: t._creationTime,
        userId: t.createdBy,
        userName: creator?.name,
      });
    }

    // Recent teams
    const recentTeams = await ctx.db.query("teams").order("desc").take(20);

    for (const team of recentTeams) {
      const creator = await ctx.db.get(team.createdBy);
      const tournament = await ctx.db.get(team.tournamentId);
      activities.push({
        type: "team_created",
        description: `${creator?.name || "User"} created team "${team.name}" for ${tournament?.name}`,
        timestamp: team._creationTime,
        userId: team.createdBy,
        userName: creator?.name,
      });
    }

    // Recent submissions (approved/rejected only)
    const recentSubmissions = await ctx.db
      .query("submissions")
      .order("desc")
      .take(30);

    for (const sub of recentSubmissions) {
      if (sub.state === "approved" || sub.state === "rejected") {
        const user = await ctx.db.get(sub.userId);
        const team = await ctx.db.get(sub.teamId);
        activities.push({
          type: `submission_${sub.state}`,
          description: `Submission by ${user?.name || "User"} for ${team?.name} was ${sub.state}`,
          timestamp: sub._creationTime,
          userId: sub.userId,
          userName: user?.name,
        });
      }
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Take limit
    return activities.slice(0, limit);
  },
});
```

#### `admin.getAlerts`

```typescript
export const getAlerts = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roles.includes("admin")) {
      throw new Error("Admin access required");
    }

    const alerts: Array<{
      type: "warning" | "info" | "error";
      message: string;
      actionLink?: string;
    }> = [];

    // Check pending submissions
    const pendingSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_state", (q) => q.eq("state", "pending"))
      .collect();

    if (pendingSubmissions.length > 0) {
      alerts.push({
        type: "info",
        message: `${pendingSubmissions.length} submission(s) awaiting approval`,
        actionLink: "/submissions?state=pending",
      });
    }

    // Check tournaments ending soon (within 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const endingSoon = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.and(
          q.lte(
            q.field("endDate"),
            threeDaysFromNow.toISOString().split("T")[0],
          ),
          q.gte(q.field("endDate"), new Date().toISOString().split("T")[0]),
        ),
      )
      .collect();

    if (endingSoon.length > 0) {
      alerts.push({
        type: "warning",
        message: `${endingSoon.length} tournament(s) ending soon`,
        actionLink: "/tournaments",
      });
    }

    // Check teams below minimum size
    const tournaments = await ctx.db.query("tournaments").collect();
    let undersizedTeams = 0;

    for (const tournament of tournaments) {
      if (tournament.teamMinSize) {
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_tournament", (q) =>
            q.eq("tournamentId", tournament._id),
          )
          .collect();

        for (const team of teams) {
          const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();

          if (members.length < tournament.teamMinSize) {
            undersizedTeams++;
          }
        }
      }
    }

    if (undersizedTeams > 0) {
      alerts.push({
        type: "warning",
        message: `${undersizedTeams} team(s) below minimum size`,
        actionLink: "/teams",
      });
    }

    return alerts;
  },
});
```

## Frontend Implementation

### New Components

#### `AdminStatsCards`

**Location:** `src/components/admin/admin-stats-cards.tsx`

```typescript
interface AdminStatsCardsProps {
  stats: {
    users: { total: number; newThisWeek: number };
    tournaments: {
      total: number;
      active: number;
      upcoming: number;
      ended: number;
    };
    teams: { total: number };
    submissions: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
}

// Features:
// - Grid of stat cards (4 columns on desktop)
// - Each card shows:
//   - Icon
//   - Label
//   - Large number
//   - Trend (new this week, etc.)
// - Click to navigate to relevant page
```

#### `RecentActivityFeed`

**Location:** `src/components/admin/recent-activity-feed.tsx`

```typescript
interface RecentActivityFeedProps {
  activities: Array<{
    type: string;
    description: string;
    timestamp: number;
    userName?: string;
  }>;
}

// Features:
// - Timeline/list of recent events
// - Each item shows:
//   - Icon based on type
//   - Description
//   - Timestamp (relative: "2 hours ago")
//   - User avatar/name if applicable
// - Real-time updates
// - Scroll to load more (optional)
```

#### `QuickActionsPanel`

**Location:** `src/components/admin/quick-actions-panel.tsx`

```typescript
// Features:
// - Grid of action buttons
// - "Create Tournament"
// - "View Pending Submissions"
// - "Manage Users"
// - "View All Teams"
// - Each button navigates to relevant page
// - Icon + label for each action
```

#### `AdminAlertsPanel`

**Location:** `src/components/admin/admin-alerts-panel.tsx`

```typescript
interface AdminAlertsPanelProps {
  alerts: Array<{
    type: "warning" | "info" | "error";
    message: string;
    actionLink?: string;
  }>;
}

// Features:
// - List of alerts/warnings
// - Color-coded by type
// - Click to navigate to action link
// - Dismissible (optional)
// - Empty state if no alerts
```

#### `AdminSearchBar`

**Location:** `src/components/admin/admin-search-bar.tsx`

```typescript
// Features:
// - Combobox/command palette
// - Search users, teams, tournaments
// - Keyboard shortcut (Cmd+K / Ctrl+K)
// - Recent searches
// - Navigate on selection
```

### New Pages

#### `/admin/page.tsx`

**Location:** `src/app/(all)/admin/page.tsx`

```typescript
export default function AdminDashboardPage() {
  const user = useUser();
  const stats = useQuery(api.admin.getDashboardStats);
  const activity = useQuery(api.admin.getRecentActivity, { limit: 50 });
  const alerts = useQuery(api.admin.getAlerts);

  // Redirect if not admin
  if (!user?.roles.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and management tools
        </p>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <AdminAlertsPanel alerts={alerts} />
      )}

      {/* Quick Actions */}
      <QuickActionsPanel />

      {/* Stats Cards */}
      {stats && <AdminStatsCards stats={stats} />}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity ? (
              <RecentActivityFeed activities={activity} />
            ) : (
              <Skeleton className="h-96" />
            )}
          </CardContent>
        </Card>

        {/* Quick Stats (1 column) */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-2xl font-bold">
                {stats && stats.submissions.total > 0
                  ? Math.round(
                      (stats.submissions.approved / stats.submissions.total) * 100
                    )
                  : 0}
                %
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Active Tournaments</p>
              <p className="text-2xl font-bold">{stats?.tournaments.active || 0}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Avg Team Size</p>
              <p className="text-2xl font-bold">
                {stats && stats.teams.total > 0
                  ? Math.round(stats.users.total / stats.teams.total)
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## UI/UX Considerations

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Admin Dashboard                                 │
│ System overview and management tools            │
├─────────────────────────────────────────────────┤
│ [Alerts Panel - if any]                         │
├─────────────────────────────────────────────────┤
│ [Quick Actions: Create | View | Manage | View]  │
├─────────────────────────────────────────────────┤
│ [Users] [Tournaments] [Teams] [Submissions]     │
│  1,234     42 active    156      487 pending    │
│  +15%      +3 upcoming            2,134 approved│
├────────────────────────────┬────────────────────┤
│ Recent Activity            │ Quick Stats        │
│ - John joined platform     │ Approval Rate: 85% │
│ - Tournament "X" created   │ Active: 42         │
│ - Team "Y" created         │ Avg Team Size: 5   │
│ - Submission approved      │                    │
│ ...                        │                    │
└────────────────────────────┴────────────────────┘
```

### Color Scheme

- **Stats Cards:** Blue (users), Green (tournaments), Purple (teams), Orange (submissions)
- **Alerts:** Red (error), Yellow (warning), Blue (info)
- **Activity Icons:** User (person), Trophy (tournament), Users (team), FileText (submission)

### Real-Time Updates

- Stats refresh every 10 seconds (Convex reactivity)
- Activity feed prepends new items
- Alerts update automatically
- Show "New activity" badge when feed updates

### Loading States

- Skeleton cards for stats
- Skeleton list for activity feed
- Shimmer effects on numbers

## Testing Checklist

### Unit Tests

- [ ] Only admins can access dashboard
- [ ] Stats calculate correctly
- [ ] Activity feed aggregates from all sources
- [ ] Alerts trigger at correct thresholds

### Integration Tests

- [ ] Dashboard loads stats from database
- [ ] Real-time updates work
- [ ] Quick actions navigate correctly
- [ ] Alert links work

### UI Tests

- [ ] Stats cards display correctly
- [ ] Activity feed renders
- [ ] Alerts show/hide appropriately
- [ ] Mobile responsive
- [ ] Loading states render

## Performance Optimization

### Query Optimization

- Cache stats query for 10 seconds
- Limit activity feed to 50 items
- Paginate if needed (infinite scroll)
- Aggregate counts efficiently

### Frontend Optimization

- Memoize heavy calculations
- Virtual scroll for long activity feeds
- Lazy load charts if added
- Debounce search input

## Edge Cases

1. **No data to display**

   - Show empty states with helpful messages
   - "No recent activity" with icon

2. **Very large numbers**

   - Format with commas (1,234)
   - Abbreviate if >999,999 (1.2M)

3. **Admin loses admin role while viewing**

   - Redirect to dashboard
   - Show toast: "Admin access removed"

4. **Multiple admins viewing simultaneously**
   - All see same real-time data
   - No conflicts (read-only view)

## Future Enhancements

- Charts/graphs for trends (using recharts or similar)
- Export data to CSV/PDF
- Custom date range filters
- Admin notifications (email/push)
- System health monitoring
- Audit log viewer
- User impersonation (for support)
- Scheduled tasks/cron jobs management
- Backup/restore functionality
- API usage statistics
- Performance metrics dashboard

## Dependencies

- Existing Convex queries
- Shadcn/ui components (Card, Badge, Button)
- Lucide icons
- date-fns for timestamp formatting
- React hooks (useQuery, useUser)

## Migration Plan

1. **Create Backend Queries**

   - Implement `getDashboardStats`
   - Implement `getRecentActivity`
   - Implement `getAlerts`
   - Test in Convex dashboard

2. **Build Components**

   - Create AdminStatsCards
   - Create RecentActivityFeed
   - Create QuickActionsPanel
   - Create AdminAlertsPanel
   - Test in isolation

3. **Create Dashboard Page**

   - Create `/admin/page.tsx`
   - Add permission check
   - Compose components
   - Test layout

4. **Update Navigation**

   - Ensure sidebar links work
   - Add breadcrumbs
   - Test navigation flow

5. **Deploy & Monitor**
   - Deploy to production
   - Monitor query performance
   - Gather admin feedback
   - Iterate based on usage

## Success Metrics

- 90%+ of admins visit dashboard weekly
- <1 second dashboard load time (p95)
- 80%+ of admin actions start from dashboard
- Zero unauthorized access to admin dashboard
- Positive feedback from admins on usability
