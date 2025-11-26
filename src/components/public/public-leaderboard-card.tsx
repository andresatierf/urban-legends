"use client";

import { Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LeaderboardEntry {
  rank: number;
  team: {
    _id: string;
    name: string;
    points: number;
  };
  memberCount: number;
}

interface PublicLeaderboardCardProps {
  tournament: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  leaderboard: LeaderboardEntry[];
  totalTeams: number;
}

export function PublicLeaderboardCard({
  tournament,
  leaderboard,
  totalTeams,
}: PublicLeaderboardCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-podium-gold">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-podium-silver">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-podium-bronze">🥉 3rd</Badge>;
    return <Badge variant="outline">{rank}th</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {tournament.name}
            </CardTitle>
            <CardDescription>
              {totalTeams} team{totalTeams === 1 ? "" : "s"} competing
            </CardDescription>
          </div>
          <Badge variant="approved">Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No teams yet
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.team._id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(entry.rank)}
                  <div>
                    <div className="font-medium text-sm">{entry.team.name}</div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Users className="h-3 w-3" />
                      {entry.memberCount} member
                      {entry.memberCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-lg">{entry.team.points}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
