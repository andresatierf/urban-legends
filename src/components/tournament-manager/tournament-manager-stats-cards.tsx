"use client";

import { FileText, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TournamentManagerStatsCardsProps {
  stats: {
    tournaments: {
      total: number;
      active: number;
      upcoming: number;
      ended: number;
    };
    teams: { total: number };
    submissions: { total: number; pending: number };
  };
}

export function TournamentManagerStatsCards({
  stats,
}: TournamentManagerStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Tournaments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Tournaments</CardTitle>
          <Trophy className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.tournaments.total}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="default" className="bg-green-600 text-sm">
              {stats.tournaments.active} Active
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {stats.tournaments.upcoming} Upcoming
            </Badge>
            <Badge variant="outline" className="text-sm">
              {stats.tournaments.ended} Ended
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Teams Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Teams</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.teams.total}</div>
          <p className="mt-2 text-muted-foreground text-xs">
            Across all tournaments
          </p>
        </CardContent>
      </Card>

      {/* Submissions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Submissions</CardTitle>
          <FileText className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.submissions.total}</div>
          <div className="mt-2">
            {stats.submissions.pending > 0 ? (
              <Badge variant="destructive" className="text-sm">
                {stats.submissions.pending} Pending Review
              </Badge>
            ) : (
              <Badge variant="outline" className="text-sm">
                All Caught Up!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
