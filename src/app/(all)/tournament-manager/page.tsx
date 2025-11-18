"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { redirect } from "next/navigation";
import { ManagedTournamentsList } from "@/components/tournament-manager/managed-tournaments-list";
import { TournamentManagerActivityFeed } from "@/components/tournament-manager/tournament-manager-activity-feed";
import { TournamentManagerQuickActions } from "@/components/tournament-manager/tournament-manager-quick-actions";
import { TournamentManagerStatsCards } from "@/components/tournament-manager/tournament-manager-stats-cards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../convex/_generated/api";

export default function TournamentManagerDashboard() {
  const { user } = useUser();
  const stats = useQuery(api.tournamentManagers.getDashboardStats);
  const tournaments = useQuery(api.tournaments.list, {});
  const activity = useQuery(api.tournamentManagers.getRecentActivity, {
    limit: 30,
  });

  // Redirect if not tournament manager or admin
  const isAuthorized =
    user?.publicMetadata?.roleNames &&
    Array.isArray(user.publicMetadata.roleNames) &&
    (user.publicMetadata.roleNames.includes("tournament_manager") ||
      user.publicMetadata.roleNames.includes("admin"));

  if (user && !isAuthorized) {
    redirect("/dashboard");
  }

  const roleNames = user?.publicMetadata?.roleNames as string[] | undefined;
  const isAdmin = roleNames?.includes("admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Tournament Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tournaments, submissions, and teams
          </p>
        </div>
        {/* Role badge indicator */}
        <Badge variant={isAdmin ? "default" : "secondary"}>
          {isAdmin ? "Admin" : "Tournament Manager"}
        </Badge>
      </div>

      {/* Quick Actions */}
      <TournamentManagerQuickActions />

      {/* Stats Cards */}
      {stats ? (
        <TournamentManagerStatsCards stats={stats} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
    </div>
  );
}
