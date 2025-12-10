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
    <>
      <DashboardHeader
        userName={user.name ?? "Player"}
        activeTournamentsCount={userDashboardData?.activeTournamentsCount ?? 0}
      />

      {isAdmin && adminDashboardData && (
        <AdminOverviewCard stats={adminDashboardData} />
      )}

      {userDashboardData && <UserStatsGrid data={userDashboardData} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MyActiveTournamentsWidget teams={userDashboardData?.teams ?? []} />

          <MyTeamsWidget teams={userDashboardData?.teams ?? []} />

          <QuickActionsPanel
            hasActiveTeams={
              (userDashboardData?.activeTournamentsCount ?? 0) > 0
            }
          />
        </div>

        <div className="space-y-6">
          <TeamInvitationsWidget />

          <RecentActivityFeed activities={recentActivity ?? []} />

          <UpcomingDeadlinesWidget deadlines={upcomingDeadlines ?? []} />
        </div>
      </div>
    </>
  );
}
