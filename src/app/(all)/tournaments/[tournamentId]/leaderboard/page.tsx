"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { LeaderboardPodium } from "@/components/tournaments/leaderboard-podium";
import { TournamentLeaderboard } from "@/components/tournaments/tournament-leaderboard";
import { WinnerAnnouncement } from "@/components/tournaments/winner-announcement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentLeaderboardPage({ params }: Props) {
  const { tournamentId } = use(params);
  const { format } = useFormattedDate();

  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId } : "skip",
  );
  const winner = useQuery(
    api.tournaments.getWinner,
    tournamentId ? { tournamentId } : "skip",
  );
  const stats = useQuery(
    api.tournaments.getStatistics,
    tournamentId ? { tournamentId } : "skip",
  );

  if (!tournament) return null;

  return (
    <>
      <SectionHeader as="h1" title={`${tournament.name} - Leaderboard`}>
        <Button variant="outline" asChild>
          <Link href={`/tournaments/${tournamentId}`}>
            <ArrowLeft />
            Back to Tournament
          </Link>
        </Button>
      </SectionHeader>

      {winner && (
        <>
          <SectionHeader title="Champion" />
          <WinnerAnnouncement tournamentId={tournamentId} />
        </>
      )}

      <SectionHeader title="Top 3 Teams" />
      <LeaderboardPodium tournamentId={tournamentId} />

      <SectionHeader title="Full Rankings" />
      <TournamentLeaderboard tournamentId={tournamentId} />

      {stats && (
        <>
          <SectionHeader title="Tournament Statistics" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Teams
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stats.totalTeams}</div>
                <p className="text-muted-foreground text-xs">
                  Competing in this tournament
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Submissions
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {stats.totalSubmissions}
                </div>
                <p className="text-muted-foreground text-xs">
                  Approved submissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Average Team Score
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {stats.averageTeamScore.toFixed(1)}
                </div>
                <p className="text-muted-foreground text-xs">Points per team</p>
              </CardContent>
            </Card>

            {stats.mostActiveTeam && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-medium text-sm">
                    Most Active Team
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">
                    <Link
                      href={`/teams/${stats.mostActiveTeam.teamId}`}
                      className="hover:underline"
                    >
                      {stats.mostActiveTeam.name}
                    </Link>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {stats.mostActiveTeam.points} points
                  </p>
                </CardContent>
              </Card>
            )}

            {stats.highestScoringDay && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-medium text-sm">
                    Highest Scoring Day
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">
                    {format(stats.highestScoringDay.date, "long")}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {stats.highestScoringDay.submissions} submissions
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Participation Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {(stats.participationRate * 100).toFixed(1)}%
                </div>
                <p className="text-muted-foreground text-xs">
                  Teams with submissions
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
