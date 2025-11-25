"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { api } from "../../convex/_generated/api";
import { TeamInvitationsList } from "./invitations/team-invitations-list";
import { SectionHeader } from "./section-header";
import { StatCard } from "./stat-card";
import { SvgIcon } from "./svg-icon";
import { Button } from "./ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface UserDashboardProps {
  currentPage?: string;
  setCurrentPage?: (page: string) => void;
}

export function UserDashboard(_props: UserDashboardProps) {
  // Fetch current user
  const { user, isAdmin } = useUser();

  // Fetch user's teams
  const userTeams = useQuery(
    api.teams.list,
    user ? { userId: user._id } : "skip",
  );

  // Fetch all tournaments
  const tournaments = useQuery(api.tournaments.list, {});

  // Fetch user's submissions
  const userSubmissions = useQuery(api.submissions.listUserSubmissions, {});

  // Admin-only: Fetch all users
  const allUsers = useQuery(api.users.list, isAdmin ? {} : "skip");

  // Admin-only: Fetch all teams
  const allTeams = useQuery(api.teams.list, isAdmin ? {} : "skip");

  // Admin-only: Fetch all submissions for review
  const allSubmissions = useQuery(api.submissions.list, isAdmin ? {} : "skip");

  // Calculate stats
  const stats = useMemo(() => {
    const teamsCount = userTeams?.length || 0;
    const pendingSubmissions =
      userSubmissions?.filter((s) => s.state === "pending").length || 0;

    // Get unique tournament IDs from user's teams
    const userTournamentIds = new Set(userTeams?.map((t) => t.tournamentId));

    // Filter active tournaments where user has a team
    const activeTournaments =
      tournaments?.filter((t) => {
        if (!userTournamentIds.has(t._id)) return false;
        const today = new Date().toISOString().split("T")[0];
        return t.startDate <= today && t.endDate >= today;
      }).length || 0;

    return {
      teamsCount,
      pendingSubmissions,
      activeTournaments,
    };
  }, [userTeams, userSubmissions, tournaments]);

  // Calculate admin stats
  const adminStats = useMemo(() => {
    if (!isAdmin) return null;

    const totalTournaments = tournaments?.length || 0;
    const totalTeams = allTeams?.length || 0;
    const totalUsers = allUsers?.length || 0;
    const pendingReviews =
      allSubmissions?.filter((s) => s.state === "pending").length || 0;

    return {
      totalTournaments,
      totalTeams,
      totalUsers,
      pendingReviews,
    };
  }, [isAdmin, tournaments, allTeams, allUsers, allSubmissions]);

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        as="h1"
        title={`Welcome back, ${user.name ?? "Player"}`}
        description="Here's an overview of your tournament activity"
      />

      {isAdmin && adminStats && (
        <Card variant="admin">
          <CardHeader className="flex flex-row gap-2 p-6 pb-0">
            <SvgIcon variant="purple" className="p-0">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </SvgIcon>
            <CardTitle className="font-semibold text-foreground text-xl">
              Admin Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 py-3">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                title="Total Tournaments"
                value={adminStats.totalTournaments}
                size="xs"
                className="p-4"
              />
              <StatCard
                title="Total Teams"
                value={adminStats.totalTeams}
                size="xs"
                className="p-4"
              />
              <StatCard
                title="Total Users"
                value={adminStats.totalUsers}
                size="xs"
                className="p-4"
              />
              <StatCard
                title="Pending Reviews"
                value={adminStats.pendingReviews}
                size="xs"
                color="purple"
                className="p-4"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start p-6 pt-0">
            <p className="pb-2 font-medium text-gray-700 text-sm">
              Admin Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <CardAction>
                <Button variant="solid" color="purple" asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
              </CardAction>
              <Button variant="outline" color="purple" asChild>
                <Link href="/tournaments">Manage Tournaments</Link>
              </Button>
              <Button variant="outline" color="purple" asChild>
                <Link href="/teams">Manage Teams</Link>
              </Button>
              <Button variant="outline" color="purple" asChild>
                <Link href="/users">Manage Users</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="My Teams" value={stats.teamsCount}>
          <SvgIcon variant="blue">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </SvgIcon>
        </StatCard>
        <StatCard title="Active Tournaments" value={stats.activeTournaments}>
          <SvgIcon variant="green">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </SvgIcon>
        </StatCard>
        <StatCard title="Pending Submissions" value={stats.pendingSubmissions}>
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

      <TeamInvitationsList />
    </div>
  );
}
