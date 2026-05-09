import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { AdminPendingActionsPanel } from "@/components/admin/admin-pending-actions-panel";
import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { AdminRecentActivityFeed } from "@/components/admin/admin-recent-activity-feed";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";
import { SectionHeader } from "@/components/section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, isAdmin } = useUser();
  const navigate = useNavigate();
  const dashboardData = useQuery(api.role.admin.getDashboardData);

  useEffect(() => {
    if (user && !isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, isAdmin, navigate]);

  return (
    <>
      <SectionHeader
        as="h1"
        title="Admin Dashboard"
        description="System-wide overview and management"
      />

      {dashboardData ? (
        <>
          <AdminStatsCards stats={dashboardData.stats} />
          <AdminQuickActions />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AdminPendingActionsPanel
              pendingActions={dashboardData.pendingActions}
            />

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest submissions across all tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRecentActivityFeed
                  activities={dashboardData.recentActivity}
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </>
      )}
    </>
  );
}
