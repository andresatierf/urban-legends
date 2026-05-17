import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, Loader2, TrendingUp, Trophy, Users } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/captain/comparison")({
  component: TeamComparison,
});

function TeamComparison() {
  const navigate = useNavigate();

  // Permission check - redirect if not a captain
  const captainedCount = useQuery(
    api.views.captainDashboard.getCaptainedTeamsCount,
  );

  useEffect(() => {
    if (captainedCount === 0) {
      navigate({ to: "/teams", replace: true });
    }
  }, [captainedCount, navigate]);

  const teamsComparison = useQuery(api.views.captainComparison.get);

  if (!teamsComparison || captainedCount === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center gap-3">
          <Trophy className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Team Comparison</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Team Comparison</h1>
            <p className="text-muted-foreground text-sm">
              Compare metrics across your {teamsComparison.length}{" "}
              {teamsComparison.length === 1 ? "team" : "teams"}
            </p>
          </div>
        </div>

        <Link to="/captain">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {teamsComparison.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground font-medium">
              No teams to compare
            </p>
            <p className="text-muted-foreground text-sm">
              You need to captain at least one team
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Grid */}
      {teamsComparison.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamsComparison.map((teamData) => (
            <Card key={teamData.team._id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{teamData.team.name}</span>
                  {teamData.rank === 1 && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  {teamData.tournament?.name || "Unknown Tournament"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rank & Points */}
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs">Rank</p>
                      <p className="text-lg font-bold">
                        #{teamData.rank} / {teamData.totalTeamsInTournament}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Points</p>
                      <p className="text-lg font-bold">{teamData.points}</p>
                    </div>
                  </div>
                </div>

                {/* Team Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Members</span>
                    </div>
                    <span className="font-medium">{teamData.membersCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Submissions
                    </span>
                    <span className="font-medium">
                      {teamData.totalSubmissions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Approved</span>
                    <span className="font-medium">
                      {teamData.approvedSubmissions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-600">Pending</span>
                    <span className="font-medium">
                      {teamData.pendingSubmissions}
                    </span>
                  </div>
                </div>

                {/* Approval Rate */}
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground text-sm">
                        Approval Rate
                      </span>
                    </div>
                    <span className="text-lg font-bold">
                      {teamData.approvalRate}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${teamData.approvalRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Manage Button */}
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: teamData.team._id }}
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full">
                    Manage Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
