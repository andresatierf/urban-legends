import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, BarChart3 } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { LeaderboardPodium } from "@/components/tournaments/leaderboard-podium";
import { TournamentLeaderboard } from "@/components/tournaments/tournament-leaderboard";
import { WinnerAnnouncement } from "@/components/tournaments/winner-announcement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute(
  "/_protected/tournaments/$tournamentId/leaderboard",
)({
  component: TournamentLeaderboardPage,
});

function TournamentLeaderboardPage() {
  const { tournamentId } = Route.useParams();
  const { format } = useFormattedDate();

  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId: tournamentId as Id<"tournaments"> } : "skip",
  );
  const winner = useQuery(
    api.tournaments.getWinner,
    tournamentId ? { tournamentId: tournamentId as Id<"tournaments"> } : "skip",
  );
  const stats = useQuery(
    api.tournaments.getStatistics,
    tournamentId ? { tournamentId: tournamentId as Id<"tournaments"> } : "skip",
  );

  if (!tournament) return null;

  return (
    <>
      <SectionHeader as="h1" title={`${tournament.name} - Leaderboard`}>
        <Button variant="outline" asChild>
          <Link to="/tournaments/$tournamentId" params={{ tournamentId }}>
            <ArrowLeft />
            Back to Tournament
          </Link>
        </Button>
      </SectionHeader>

      {winner && (
        <>
          <SectionHeader title="Champion" />
          <WinnerAnnouncement
            tournamentId={tournamentId as Id<"tournaments">}
          />
        </>
      )}

      <SectionHeader title="Top 3 Teams" />
      <LeaderboardPodium tournamentId={tournamentId as Id<"tournaments">} />

      <SectionHeader title="Full Rankings" />
      <TournamentLeaderboard tournamentId={tournamentId as Id<"tournaments">} />

      {stats && (
        <>
          <SectionHeader title="Tournament Statistics" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Teams
                </CardTitle>
                <BarChart3 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeams}</div>
                <p className="text-muted-foreground text-xs">
                  Competing in this tournament
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Submissions
                </CardTitle>
                <BarChart3 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalSubmissions}
                </div>
                <p className="text-muted-foreground text-xs">
                  Approved submissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Team Score
                </CardTitle>
                <BarChart3 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageTeamScore.toFixed(1)}
                </div>
                <p className="text-muted-foreground text-xs">Points per team</p>
              </CardContent>
            </Card>

            {stats.mostActiveTeam && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Most Active Team
                  </CardTitle>
                  <BarChart3 className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Link
                      to="/teams/$teamId"
                      params={{ teamId: stats.mostActiveTeam.teamId }}
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
                  <CardTitle className="text-sm font-medium">
                    Highest Scoring Day
                  </CardTitle>
                  <BarChart3 className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
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
                <CardTitle className="text-sm font-medium">
                  Participation Rate
                </CardTitle>
                <BarChart3 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
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
