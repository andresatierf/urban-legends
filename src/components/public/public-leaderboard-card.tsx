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
import { cn } from "@/lib/utils";

const getPosition = (n: number) => {
  const m = ["🥇", "🥈", "🥉"];
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (n > 3 ? "" : `${m[n - 1]} `) + n + (s[(v - 20) % 10] || s[v] || s[0]);
};

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
    return (
      <Badge
        variant={rank > 3 ? "outline" : "default"}
        className={cn({
          "bg-podium-gold": rank === 1,
          "bg-podium-silver": rank === 2,
          "bg-podium-bronze": rank === 3,
        })}
      >
        {getPosition(rank)}
      </Badge>
    );
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
          <div className="text-muted-foreground py-8 text-center">
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
                    <div className="text-sm font-medium">{entry.team.name}</div>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {entry.memberCount} member
                      {entry.memberCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold">{entry.team.points}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
