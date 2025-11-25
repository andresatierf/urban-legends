"use client";

import { useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import { AdminOverviewCard } from "./admin-overview-card";
import { DashboardHeader } from "./dashboard-header";
import { MyActiveTournamentsWidget } from "./my-active-tournaments-widget";
import { MyTeamsWidget } from "./my-teams-widget";
import { QuickActionsPanel } from "./quick-actions-panel";
import { RecentActivityFeed } from "./recent-activity-feed";
import { TeamInvitationsWidget } from "./team-invitations-widget";
import { UpcomingDeadlinesWidget } from "./upcoming-deadlines-widget";
import { UserStatsGrid } from "./user-stats-grid";

export function UnifiedDashboard() {
  const { user, isAdmin } = useUser();

  // Fetch dashboard data
  const userDashboardData = useQuery(api.dashboard.getUserDashboardData);
  const adminDashboardData = useQuery(
    api.dashboard.getAdminDashboardData,
    isAdmin ? {} : "skip",
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
        activeTournamentsCount={userDashboardData?.activeTournamentsCount ?? 0}
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
          <MyActiveTournamentsWidget teams={userDashboardData?.teams ?? []} />

          {/* My Teams */}
          <MyTeamsWidget teams={userDashboardData?.teams ?? []} />

          {/* Quick Actions */}
          <QuickActionsPanel
            hasActiveTeams={
              (userDashboardData?.activeTournamentsCount ?? 0) > 0
            }
          />
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
