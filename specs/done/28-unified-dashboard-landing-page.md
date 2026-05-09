# Unified Dashboard Landing Page

**Priority:** HIGH
**Status:** Specification
**Estimated Effort:** 3-4 days

## Executive Summary

Replace the current basic `UserDashboard` component with a comprehensive, role-aware unified dashboard that serves as the main landing page for all authenticated users. This dashboard will provide personalized, at-a-glance information for both regular users and administrators, with real-time data updates via Convex and quick access to common actions.

**Primary User Benefit:** Users get a centralized hub that shows their tournament activity, teams, pending tasks, and relevant actions without navigating through multiple pages.

**Business Value:** Increases user engagement by surfacing actionable information immediately upon login, reduces friction in common workflows (joining tournaments, creating submissions), and provides admins with system oversight capabilities.

**Timeline/Complexity:** LARGE - Involves multiple new queries, several widget components, real-time data aggregation, and role-based rendering logic.

## Feature Requirements

### Functional Requirements

#### For All Users

1. **Personalized Welcome Section**
   - Display user's name with greeting
   - Show current date and time
   - Quick status indicator (e.g., "You're in 3 active tournaments")

2. **At-a-Glance Statistics**
   - My Teams (count)
   - Active Tournaments (tournaments user is participating in that are currently active)
   - Pending Submissions (submissions awaiting approval)
   - Current Streak (consecutive days with approved submissions - optional for MVP)

3. **My Active Tournaments Widget**
   - List of tournaments user is participating in (via team membership)
   - Show status badges (active/upcoming/ended)
   - Display tournament dates
   - Show user's team name for each tournament
   - Quick link to tournament page and team page
   - Empty state if no tournaments

4. **My Teams Widget**
   - List of all teams user is a member of
   - Show team name, tournament name, points, member count
   - Indicate if user is captain (badge)
   - Quick actions: View Team, Create Submission (if tournament active)
   - Empty state with "Join a Tournament" CTA

5. **Recent Activity Feed**
   - Last 10-15 activities relevant to the user:
     - Submissions approved/rejected
     - Team invitations received
     - Join requests responded to (if captain)
     - New team members joined (if captain)
   - Relative timestamps ("2 hours ago")
   - Icon-based activity types
   - Empty state if no recent activity

6. **Team Invitations Widget**
   - Reuse existing `TeamInvitationsList` component
   - Show pending invitations with Accept/Reject buttons
   - Collapsible if no pending invitations

7. **Quick Actions Panel**
   - "Browse Tournaments" button
   - "View My Submissions" button
   - "Create New Submission" (if user has active teams)
   - Context-aware: disable/hide actions that aren't available

8. **Upcoming Deadlines Widget**
   - Tournaments ending soon (within 7 days) that user is participating in
   - Show countdown ("Ends in 3 days")
   - Link to tournament leaderboard
   - Empty state if no upcoming deadlines

#### For Admins Only

9. **Admin Overview Card** (similar to current implementation but enhanced)
   - System-wide statistics:
     - Total Users (+new this week)
     - Total Tournaments (active/upcoming/ended breakdown)
     - Total Teams
     - Pending Submissions (highlighted)
   - Quick admin actions:
     - Admin Dashboard (link to `/admin`)
     - Manage Tournaments
     - Manage Users
     - View Pending Submissions
   - Distinct visual treatment (purple gradient card)

10. **System Alerts Widget** (admin only)
    - Pending submissions count (clickable)
    - Tournaments ending in next 3 days
    - Teams below minimum size
    - Other warnings
    - Empty state if no alerts

#### For Tournament Managers (if role exists)

11. **Tournament Manager Overview Card**
    - Show statistics for tournaments they manage
    - Pending submissions in their tournaments
    - Quick link to Tournament Manager Dashboard

### Non-Functional Requirements

1. **Performance**
   - Initial page load: <1 second (p95)
   - Real-time data updates via Convex subscriptions
   - Efficient queries (use existing queries where possible, optimize new ones)
   - Lazy loading for widgets below the fold

2. **Real-time Updates**
   - Stats update automatically as data changes
   - Activity feed prepends new items
   - Invitation list updates when invitations are accepted/rejected
   - No manual refresh required

3. **Responsive Design**
   - Mobile: Single column, cards stack vertically
   - Tablet: 2-column grid for main content
   - Desktop: 3-column grid with flexible widget placement

4. **Loading States**
   - Skeleton loaders for each widget while data loads
   - Graceful degradation if queries fail
   - Show partial data rather than blocking entire page

5. **Empty States**
   - Each widget has meaningful empty state messaging
   - Include CTAs to guide users to take action (e.g., "Join a tournament to get started")

6. **Accessibility**
   - Proper heading hierarchy (h1 for page title, h2 for widget titles)
   - ARIA labels for icon buttons
   - Keyboard navigation support
   - Screen reader friendly

## Technical Design

### Database Schema Changes

**No schema changes required.** This feature uses existing tables:

- `users` - Current user data
- `tournaments` - Tournament information
- `teams` - Team data
- `teamMembers` - User team memberships
- `submissions` - Submission data
- `teamInvitations` - Team invitation data
- `roles` + `userRoles` - Role-based access control

### Backend API Design

#### New Convex Queries

##### `dashboard.getUserDashboardData`

**Purpose:** Fetch all dashboard data for a user in a single optimized query.

**Location:** `convex/dashboard.ts` (new file)

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const getUserDashboardData = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Fetch user's teams with tournament info
    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const teams = await Promise.all(
      teamMemberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;

        const tournament = await ctx.db.get(team.tournamentId);
        const memberCount = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect()
          .then((members) => members.length);

        return {
          team,
          tournament,
          memberCount,
          userRole: membership.role,
        };
      }),
    );

    const validTeams = teams.filter((t) => t !== null && t.tournament !== null);

    // Calculate active tournaments
    const now = new Date().toISOString();
    const activeTournaments = validTeams.filter(
      (t) => t!.tournament!.startDate <= now && t!.tournament!.endDate >= now,
    );

    // Fetch user's submissions
    const userSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pendingSubmissions = userSubmissions.filter(
      (s) => s.state === "pending",
    );

    // Fetch team invitations
    const invitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_user_and_status", (q) =>
        q.eq("invitedUserId", user._id).eq("status", "pending"),
      )
      .collect();

    return {
      teams: validTeams,
      activeTournamentsCount: activeTournaments.length,
      pendingSubmissionsCount: pendingSubmissions.length,
      invitationsCount: invitations.length,
    };
  },
});
```

##### `dashboard.getAdminDashboardData`

**Purpose:** Fetch admin-specific dashboard data.

**Location:** `convex/dashboard.ts`

```typescript
export const getAdminDashboardData = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.roleNames.includes("admin")) {
      return null; // Not an admin, return null
    }

    // Fetch all data in parallel
    const [users, tournaments, teams, submissions] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("tournaments").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("submissions").collect(),
    ]);

    // Calculate new users this week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsersThisWeek = users.filter(
      (u) => u._creationTime > oneWeekAgo,
    ).length;

    // Categorize tournaments
    const now = new Date().toISOString();
    const activeTournaments = tournaments.filter(
      (t) => t.startDate <= now && t.endDate >= now,
    );
    const upcomingTournaments = tournaments.filter((t) => t.startDate > now);
    const endedTournaments = tournaments.filter((t) => t.endDate < now);

    // Categorize submissions
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
        newThisWeek: newUsersThisWeek,
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

##### `dashboard.getRecentActivity`

**Purpose:** Fetch recent activity relevant to the current user.

**Location:** `convex/dashboard.ts`

```typescript
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = args.limit || 15;

    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      icon: string; // Icon identifier
      link?: string; // Optional navigation link
    }> = [];

    // Get user's recent submissions (last 20)
    const userSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    for (const sub of userSubmissions) {
      if (sub.state === "approved" || sub.state === "rejected") {
        const team = await ctx.db.get(sub.teamId);
        activities.push({
          type: `submission_${sub.state}`,
          description: `Your submission for ${team?.name || "team"} was ${sub.state}`,
          timestamp: sub._creationTime,
          icon: sub.state === "approved" ? "check-circle" : "x-circle",
          link: `/submissions/${sub._id}`,
        });
      }
    }

    // Get teams user is captain of
    const captainTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    // For each captain team, get recent join requests and new members
    for (const membership of captainTeams) {
      const team = await ctx.db.get(membership.teamId);
      if (!team) continue;

      // Recent join requests
      const joinRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "rejected"),
          ),
        )
        .order("desc")
        .take(5);

      for (const req of joinRequests) {
        if (req.respondedAt) {
          const requestUser = await ctx.db.get(req.userId);
          activities.push({
            type: `join_request_${req.status}`,
            description: `${requestUser?.name || "A user"}'s join request for ${team.name} was ${req.status}`,
            timestamp: new Date(req.respondedAt).getTime(),
            icon: "users",
            link: `/teams/${team._id}`,
          });
        }
      }

      // Recent team members
      const recentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .order("desc")
        .take(5);

      for (const member of recentMembers) {
        if (member.userId !== user._id) {
          const memberUser = await ctx.db.get(member.userId);
          activities.push({
            type: "team_member_joined",
            description: `${memberUser?.name || "A user"} joined ${team.name}`,
            timestamp: member._creationTime,
            icon: "user-plus",
            link: `/teams/${team._id}`,
          });
        }
      }
    }

    // Sort by timestamp descending and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});
```

##### `dashboard.getUpcomingDeadlines`

**Purpose:** Get tournaments ending soon that the user is participating in.

**Location:** `convex/dashboard.ts`

```typescript
export const getUpcomingDeadlines = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get user's teams
    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const tournamentIds = new Set<string>();
    for (const membership of teamMemberships) {
      const team = await ctx.db.get(membership.teamId);
      if (team) {
        tournamentIds.add(team.tournamentId);
      }
    }

    // Get tournaments ending within 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const tournaments = await Promise.all(
      Array.from(tournamentIds).map((id) => ctx.db.get(id as any)),
    );

    const upcomingDeadlines = tournaments
      .filter((t) => {
        if (!t) return false;
        const endDate = new Date(t.endDate);
        return endDate >= now && endDate <= sevenDaysFromNow;
      })
      .map((t) => {
        const endDate = new Date(t!.endDate);
        const daysUntilEnd = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          tournament: t,
          daysUntilEnd,
        };
      })
      .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

    return upcomingDeadlines;
  },
});
```

#### Modified Queries (if needed)

- Existing queries remain unchanged
- Use `api.teams.list`, `api.tournaments.list`, `api.submissions.listUserSubmissions`, etc.

### Frontend Architecture

#### Component Hierarchy

```
UnifiedDashboard
├── DashboardHeader (welcome, date, quick status)
├── AdminOverviewCard (if admin)
├── TournamentManagerOverviewCard (if tournament_manager)
├── UserStatsGrid
│   ├── StatCard (My Teams)
│   ├── StatCard (Active Tournaments)
│   ├── StatCard (Pending Submissions)
│   └── StatCard (Current Streak - optional)
├── DashboardMainContent
│   ├── LeftColumn (2/3 width on desktop)
│   │   ├── MyActiveTournamentsWidget
│   │   ├── MyTeamsWidget
│   │   └── QuickActionsPanel
│   └── RightColumn (1/3 width on desktop)
│       ├── TeamInvitationsWidget
│       ├── RecentActivityFeed
│       └── UpcomingDeadlinesWidget
```

#### New Components

##### `UnifiedDashboard.tsx`

**Location:** `src/components/dashboard/unified-dashboard.tsx`

**Purpose:** Main dashboard container that orchestrates all widgets.

```typescript
"use client";

import { useQuery } from "convex/react";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import { DashboardHeader } from "./dashboard-header";
import { AdminOverviewCard } from "./admin-overview-card";
import { UserStatsGrid } from "./user-stats-grid";
import { MyActiveTournamentsWidget } from "./my-active-tournaments-widget";
import { MyTeamsWidget } from "./my-teams-widget";
import { RecentActivityFeed } from "./recent-activity-feed";
import { TeamInvitationsWidget } from "./team-invitations-widget";
import { UpcomingDeadlinesWidget } from "./upcoming-deadlines-widget";
import { QuickActionsPanel } from "./quick-actions-panel";
import { Skeleton } from "@/components/ui/skeleton";

export function UnifiedDashboard() {
  const { user, isAdmin } = useUser();

  // Fetch dashboard data
  const userDashboardData = useQuery(api.dashboard.getUserDashboardData);
  const adminDashboardData = useQuery(
    api.dashboard.getAdminDashboardData,
    isAdmin ? {} : "skip"
  );
  const recentActivity = useQuery(api.dashboard.getRecentActivity, {
    limit: 15,
  });
  const upcomingDeadlines = useQuery(api.dashboard.getUpcomingDeadlines);

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        userName={user.name ?? "Player"}
        activeTournamentsCount={
          userDashboardData?.activeTournamentsCount ?? 0
        }
      />

      {/* Admin Overview Card */}
      {isAdmin && adminDashboardData && (
        <AdminOverviewCard stats={adminDashboardData} />
      )}

      {/* User Stats Grid */}
      {userDashboardData && <UserStatsGrid data={userDashboardData} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* My Active Tournaments */}
          <MyActiveTournamentsWidget
            teams={userDashboardData?.teams ?? []}
          />

          {/* My Teams */}
          <MyTeamsWidget teams={userDashboardData?.teams ?? []} />

          {/* Quick Actions */}
          <QuickActionsPanel hasActiveTeams={(userDashboardData?.activeTournamentsCount ?? 0) > 0} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Team Invitations */}
          <TeamInvitationsWidget />

          {/* Recent Activity */}
          <RecentActivityFeed activities={recentActivity ?? []} />

          {/* Upcoming Deadlines */}
          <UpcomingDeadlinesWidget deadlines={upcomingDeadlines ?? []} />
        </div>
      </div>
    </div>
  );
}
```

##### `DashboardHeader.tsx`

**Location:** `src/components/dashboard/dashboard-header.tsx`

```typescript
"use client";

import { SectionHeader } from "@/components/section-header";

interface DashboardHeaderProps {
  userName: string;
  activeTournamentsCount: number;
}

export function DashboardHeader({
  userName,
  activeTournamentsCount,
}: DashboardHeaderProps) {
  const greeting = `Welcome back, ${userName}`;
  const status =
    activeTournamentsCount > 0
      ? `You're participating in ${activeTournamentsCount} active tournament${activeTournamentsCount !== 1 ? "s" : ""}`
      : "Ready to join a tournament?";

  return (
    <SectionHeader as="h1" title={greeting} description={status} />
  );
}
```

##### `AdminOverviewCard.tsx`

**Location:** `src/components/dashboard/admin-overview-card.tsx`

**Purpose:** Reuse existing admin card from UserDashboard, potentially with minor enhancements.

```typescript
// Similar to existing implementation in UserDashboard.tsx lines 110-176
// Extract into separate component for reusability
```

##### `UserStatsGrid.tsx`

**Location:** `src/components/dashboard/user-stats-grid.tsx`

```typescript
import { StatCard } from "@/components/stat-card";
import { SvgIcon } from "@/components/svg-icon";

interface UserStatsGridProps {
  data: {
    teams: any[];
    activeTournamentsCount: number;
    pendingSubmissionsCount: number;
  };
}

export function UserStatsGrid({ data }: UserStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard title="My Teams" value={data.teams.length}>
        <SvgIcon variant="blue">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </SvgIcon>
      </StatCard>
      <StatCard title="Active Tournaments" value={data.activeTournamentsCount}>
        <SvgIcon variant="green">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </SvgIcon>
      </StatCard>
      <StatCard title="Pending Submissions" value={data.pendingSubmissionsCount}>
        <SvgIcon variant="yellow">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </SvgIcon>
      </StatCard>
    </div>
  );
}
```

##### `MyActiveTournamentsWidget.tsx`

**Location:** `src/components/dashboard/my-active-tournaments-widget.tsx`

```typescript
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";

interface MyActiveTournamentsWidgetProps {
  teams: Array<{
    team: any;
    tournament: any;
    userRole: "captain" | "member";
  }>;
}

export function MyActiveTournamentsWidget({
  teams,
}: MyActiveTournamentsWidgetProps) {
  const now = new Date().toISOString();

  // Filter for active tournaments only
  const activeTournaments = teams.filter(
    (t) =>
      t.tournament &&
      t.tournament.startDate <= now &&
      t.tournament.endDate >= now
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Active Tournaments</CardTitle>
        <CardDescription>
          Tournaments you're currently participating in
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeTournaments.length === 0 ? (
          <Empty>
            <EmptyTitle>No active tournaments</EmptyTitle>
            <EmptyDescription>
              Join a tournament to start competing with your team.
            </EmptyDescription>
            <Button asChild className="mt-4">
              <Link href="/tournaments">Browse Tournaments</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-4">
            {activeTournaments.map(({ team, tournament, userRole }) => (
              <div
                key={tournament._id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tournament.name}</h4>
                    <Badge variant="success">Active</Badge>
                    {userRole === "captain" && (
                      <Badge variant="outline">Captain</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Team: {team.name} · {tournament.startDate} to{" "}
                    {tournament.endDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tournaments/${tournament._id}`}>
                      View Tournament
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teams/${team._id}`}>View Team</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

##### `MyTeamsWidget.tsx`

**Location:** `src/components/dashboard/my-teams-widget.tsx`

```typescript
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";

interface MyTeamsWidgetProps {
  teams: Array<{
    team: any;
    tournament: any;
    memberCount: number;
    userRole: "captain" | "member";
  }>;
}

export function MyTeamsWidget({ teams }: MyTeamsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Teams</CardTitle>
        <CardDescription>All teams you're a member of</CardDescription>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <Empty>
            <EmptyTitle>No teams yet</EmptyTitle>
            <EmptyDescription>
              Join or create a team to participate in tournaments.
            </EmptyDescription>
            <Button asChild className="mt-4">
              <Link href="/tournaments">Find a Tournament</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {teams.map(({ team, tournament, memberCount, userRole }) => (
              <Link
                key={team._id}
                href={`/teams/${team._id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{team.name}</h4>
                      {userRole === "captain" && (
                        <Badge variant="outline">Captain</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {tournament?.name || "Unknown Tournament"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {memberCount} member{memberCount !== 1 ? "s" : ""} ·{" "}
                      {team.points ?? 0} points
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

##### `RecentActivityFeed.tsx`

**Location:** `src/components/dashboard/recent-activity-feed.tsx`

```typescript
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { CheckCircle, XCircle, Users, UserPlus } from "lucide-react";

interface Activity {
  type: string;
  description: string;
  timestamp: number;
  icon: string;
  link?: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const iconMap = {
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  users: Users,
  "user-plus": UserPlus,
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest updates</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty>
            <EmptyTitle>No recent activity</EmptyTitle>
            <EmptyDescription>
              Activity will appear here as you participate in tournaments.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = iconMap[activity.icon as keyof typeof iconMap];
              const content = (
                <div className="flex gap-3">
                  {Icon && (
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );

              return activity.link ? (
                <Link
                  key={`${activity.type}-${index}`}
                  href={activity.link}
                  className="block rounded-md p-2 transition-colors hover:bg-muted"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={`${activity.type}-${index}`}
                  className="rounded-md p-2"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

##### `TeamInvitationsWidget.tsx`

**Location:** `src/components/dashboard/team-invitations-widget.tsx`

**Purpose:** Wrapper around existing `TeamInvitationsList` component.

```typescript
// Reuse existing TeamInvitationsList component
// Or create a simplified version for dashboard
```

##### `UpcomingDeadlinesWidget.tsx`

**Location:** `src/components/dashboard/upcoming-deadlines-widget.tsx`

```typescript
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Clock } from "lucide-react";

interface UpcomingDeadlinesWidgetProps {
  deadlines: Array<{
    tournament: any;
    daysUntilEnd: number;
  }>;
}

export function UpcomingDeadlinesWidget({
  deadlines,
}: UpcomingDeadlinesWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>Tournaments ending soon</CardDescription>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <Empty>
            <EmptyTitle>No upcoming deadlines</EmptyTitle>
            <EmptyDescription>
              You'll see tournaments ending soon here.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-3">
            {deadlines.map(({ tournament, daysUntilEnd }) => (
              <Link
                key={tournament._id}
                href={`/tournaments/${tournament._id}/leaderboard`}
                className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{tournament.name}</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-muted-foreground text-xs">
                        Ends in {daysUntilEnd} day{daysUntilEnd !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={daysUntilEnd <= 3 ? "destructive" : "secondary"}>
                    {daysUntilEnd <= 3 ? "Urgent" : "Soon"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

##### `QuickActionsPanel.tsx`

**Location:** `src/components/dashboard/quick-actions-panel.tsx`

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, FileText, Users, Plus } from "lucide-react";

interface QuickActionsPanelProps {
  hasActiveTeams: boolean;
}

export function QuickActionsPanel({ hasActiveTeams }: QuickActionsPanelProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/tournaments">
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Browse Tournaments</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/submissions">
              <FileText className="h-5 w-5" />
              <span className="text-xs">My Submissions</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/teams">
              <Users className="h-5 w-5" />
              <span className="text-xs">My Teams</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            disabled={!hasActiveTeams}
            asChild={hasActiveTeams}
          >
            {hasActiveTeams ? (
              <Link href="/submissions/new">
                <Plus className="h-5 w-5" />
                <span className="text-xs">New Submission</span>
              </Link>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-xs">New Submission</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Integration Points

1. **Route Integration**
   - Update `src/app/(all)/dashboard/page.tsx` to use `<UnifiedDashboard />` instead of `<UserDashboard />`

2. **Authentication**
   - Dashboard requires authentication (already handled by `(all)` route group)
   - Uses `useUser()` hook for current user data

3. **Navigation**
   - Sidebar already links to `/dashboard`
   - No changes to navigation structure needed

4. **Real-time Data**
   - All widgets use Convex `useQuery` hooks
   - Automatic real-time updates via Convex subscriptions

5. **Existing Components**
   - Reuse `TeamInvitationsList` component
   - Reuse `StatCard` component
   - Reuse `SectionHeader` component
   - Reuse `Card`, `Badge`, `Button` UI components

## Implementation Plan

### Phase 1: Backend Foundation (Day 1)

1. Create `convex/dashboard.ts` file
2. Implement `getUserDashboardData` query
3. Implement `getAdminDashboardData` query
4. Implement `getRecentActivity` query
5. Implement `getUpcomingDeadlines` query
6. Test queries in Convex dashboard

### Phase 2: Core Components (Day 2)

1. Create component directory structure: `src/components/dashboard/`
2. Implement `DashboardHeader` component
3. Implement `UserStatsGrid` component
4. Extract `AdminOverviewCard` from existing `UserDashboard`
5. Create `Empty` state components if not exist
6. Test components in isolation

### Phase 3: Widgets (Day 3)

1. Implement `MyActiveTournamentsWidget`
2. Implement `MyTeamsWidget`
3. Implement `RecentActivityFeed`
4. Implement `UpcomingDeadlinesWidget`
5. Implement `TeamInvitationsWidget` (wrapper)
6. Implement `QuickActionsPanel`
7. Test each widget with mock data

### Phase 4: Integration & Polish (Day 4)

1. Create main `UnifiedDashboard` component
2. Wire up all queries and widgets
3. Update `src/app/(all)/dashboard/page.tsx`
4. Implement loading states (skeletons)
5. Implement empty states
6. Add error boundaries
7. Test responsive layout (mobile, tablet, desktop)
8. Performance testing and optimization
9. Accessibility audit
10. Final QA and bug fixes

## Code Examples

See component code examples in the Frontend Architecture section above.

### Example Usage in Dashboard Page

```typescript
// src/app/(all)/dashboard/page.tsx
"use client";

import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard";

export default function DashboardPage() {
  return <UnifiedDashboard />;
}
```

## Open Questions & Considerations

1. **Current Streak Calculation**
   - Do we want to show "Current Streak" (consecutive days with approved submissions)?
   - If yes, should it be per-tournament or across all tournaments?
   - **Recommendation:** Defer to post-MVP to reduce scope.

2. **Activity Feed Scope**
   - Should activity feed include team-wide activities (submissions by teammates)?
   - Or only activities directly relevant to the user?
   - **Recommendation:** Start with user-centric activities only.

3. **Caching Strategy**
   - Should we cache dashboard data client-side?
   - Convex handles real-time updates, so probably not needed.
   - **Recommendation:** Rely on Convex's built-in caching and real-time updates.

4. **Widget Customization**
   - Should users be able to hide/reorder widgets?
   - **Recommendation:** Post-MVP feature. Start with fixed layout.

5. **Admin vs Tournament Manager**
   - Should tournament managers see a separate overview card?
   - **Recommendation:** Yes, similar to admin card but scoped to their tournaments. Can be added in Phase 4 if time permits.

6. **Performance with Many Teams**
   - What if a user is in 50+ teams?
   - **Recommendation:** Show top 5 active teams, "View All" link for rest.

## Success Metrics

1. **User Engagement**
   - 90%+ of users visit dashboard within first session after login
   - Average time on dashboard: 30+ seconds
   - 70%+ of navigation to other pages originates from dashboard

2. **Performance**
   - Dashboard load time: <1 second (p95)
   - Real-time update latency: <500ms
   - No layout shift (CLS score <0.1)

3. **User Satisfaction**
   - Positive feedback from user testing
   - Low bounce rate from dashboard (<10%)
   - High click-through rate on quick actions (>40%)

## Testing Strategy

### Unit Tests

- [ ] Backend queries return correct data structure
- [ ] Queries handle missing/null data gracefully
- [ ] User stats calculations are accurate
- [ ] Activity feed sorts by timestamp correctly
- [ ] Deadline calculations work for edge cases (today, tomorrow, 7 days)

### Integration Tests

- [ ] Dashboard loads with real Convex data
- [ ] Real-time updates propagate to UI
- [ ] Admin-only widgets only render for admins
- [ ] Empty states render when no data available
- [ ] Navigation links work correctly

### UI/UX Tests

- [ ] Mobile responsive (320px to 768px)
- [ ] Tablet layout (768px to 1024px)
- [ ] Desktop layout (1024px+)
- [ ] Loading skeletons display correctly
- [ ] Empty states have clear CTAs
- [ ] All interactive elements accessible via keyboard
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG AA standards

### Performance Tests

- [ ] Dashboard loads in <1 second with 10 teams
- [ ] Dashboard loads in <2 seconds with 50 teams
- [ ] No memory leaks with long sessions
- [ ] Real-time updates don't cause re-renders of entire dashboard

## Technical Considerations

### Loading States

Each widget should have a skeleton loader:

```typescript
// Example skeleton for MyTeamsWidget
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-32" />
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  </CardContent>
</Card>
```

### Error Handling

Use error boundaries for each major section:

```typescript
<ErrorBoundary fallback={<ErrorCard />}>
  <MyTeamsWidget teams={teams} />
</ErrorBoundary>
```

### Accessibility

- Use semantic HTML (`<main>`, `<section>`, `<article>`)
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for icon buttons
- Focus management for modals/dialogs
- Keyboard navigation support

### Performance Optimization

1. **Query Optimization**
   - Use parallel queries where possible
   - Limit activity feed to 15 items
   - Filter data on backend, not frontend
   - Use indexed queries

2. **Frontend Optimization**
   - Lazy load widgets below fold
   - Memoize expensive calculations
   - Virtual scrolling for long lists (if needed)
   - Debounce real-time updates if they cause performance issues

3. **Bundle Optimization**
   - Code-split dashboard components
   - Dynamic imports for large widgets
   - Tree-shake unused dependencies

## Migration Plan

### Step 1: Prepare (Pre-deployment)

1. Create all backend queries in `convex/dashboard.ts`
2. Test queries in Convex dashboard
3. Build all dashboard components
4. Test components in Storybook or dev environment

### Step 2: Deploy Backend (Low Risk)

1. Deploy new Convex queries
2. Existing dashboard continues to work
3. Monitor for any performance impact

### Step 3: Deploy Frontend (Staged Rollout)

1. Update dashboard page to use new `UnifiedDashboard`
2. Keep old `UserDashboard` component as backup
3. Monitor for errors and performance issues
4. Collect user feedback

### Step 4: Cleanup (Post-deployment)

1. Remove old `UserDashboard` component
2. Archive unused code
3. Update documentation

### Rollback Plan

If issues occur:

1. Revert dashboard page to use old `UserDashboard`
2. Investigate and fix issues
3. Re-deploy when ready

No database changes means zero migration risk.

## Future Enhancements

1. **Personalization**
   - User-customizable widget layout
   - Hide/show widgets
   - Dark mode support

2. **Advanced Analytics**
   - Charts and graphs for user progress
   - Tournament participation history
   - Personal leaderboard ranking

3. **Notifications**
   - In-app notification center
   - Toast notifications for important events
   - Email digest of dashboard highlights

4. **Social Features**
   - Recent activity from friends/teammates
   - Social sharing of achievements
   - Team activity feed

5. **Performance Dashboard**
   - Personal stats across all tournaments
   - Submission success rate
   - Team contribution metrics

6. **Mobile App Integration**
   - Push notifications
   - Offline support
   - Native widgets

## Dependencies

- **Convex**: Queries, real-time subscriptions
- **Next.js 15**: App Router, Server Components
- **React 19**: Hooks, Suspense
- **Shadcn/ui**: Card, Badge, Button, Skeleton
- **Lucide React**: Icons
- **date-fns**: Date formatting (for relative timestamps)
- **TailwindCSS**: Styling
- **TypeScript**: Type safety

All dependencies already exist in the project.

## Validation Checklist

Before finalizing the specification, verify:

- [x] All database relationships are properly typed and validated
- [x] Authentication/authorization is specified for each endpoint
- [x] UI matches existing component patterns (shadcn/ui style)
- [x] Real-time requirements are identified and addressed
- [x] Error states and loading states are planned
- [x] The feature integrates cleanly with existing code
- [x] Code examples compile and follow project standards
- [x] The spec is readable by both technical and non-technical stakeholders

## Conclusion

This unified dashboard specification provides a comprehensive blueprint for implementing a modern, role-aware landing page that serves both regular users and administrators. The design leverages existing patterns and components while introducing new widgets that surface actionable information at a glance. The implementation plan is structured to minimize risk and ensure a smooth rollout with clear success metrics.

By consolidating user-relevant information into a single, well-organized interface, we reduce cognitive load, improve engagement, and provide a superior user experience compared to the current basic dashboard.
