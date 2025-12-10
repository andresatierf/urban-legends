"use client";

import { useQuery } from "convex/react";
import { redirect } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { ManagedTournamentsList } from "@/components/tournament-manager/managed-tournaments-list";
import { TournamentManagerActivityFeed } from "@/components/tournament-manager/tournament-manager-activity-feed";
import { TournamentManagerQuickActions } from "@/components/tournament-manager/tournament-manager-quick-actions";
import { TournamentManagerStatsCards } from "@/components/tournament-manager/tournament-manager-stats-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { hasMinimumRole } from "../../../../common/roles";
import { api } from "../../../../convex/_generated/api";

export default function TournamentManagerDashboard() {
  const { user } = useUser();
  const stats = useQuery(api.role.tournamentManager.getDashboardStats);
  const tournaments = useQuery(api.tournaments.list, {});
  const activity = useQuery(api.role.tournamentManager.getRecentActivity, {
    limit: 30,
  });

  if (user && !hasMinimumRole(user, "tournament_manager")) {
    redirect("/dashboard");
  }

  return (
    <>
      <SectionHeader
        as="h1"
        title="Tournament Manager Dashboard"
        description="Manage tournaments, submissions, and teams"
      />
      <TournamentManagerQuickActions />

      {stats ? (
        <TournamentManagerStatsCards stats={stats} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across all tournaments
            </CardDescription>
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
    </>
  );
}
