"use client";

import { useQuery } from "convex/react";
import { Medal, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";

type Props = {
  tournamentId: Id<"tournaments">;
};

export function LeaderboardPodium({ tournamentId }: Props) {
  const leaderboard = useQuery(api.tournaments.getLeaderboard, {
    tournamentId,
    limit: 3,
  });

  if (leaderboard === undefined) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="flex flex-col items-center p-6">
              <div className="mb-4 h-16 w-16 rounded-full bg-muted" />
              <div className="mb-2 h-6 w-32 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return null;
  }

  const topTeams = [
    leaderboard.find((t) => t.rank === 2),
    leaderboard.find((t) => t.rank === 1),
    leaderboard.find((t) => t.rank === 3),
  ].filter(Boolean);

  const getPodiumIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-12 w-12 text-yellow-500" />;
    }
    if (rank === 2) {
      return <Medal className="h-10 w-10 text-gray-400" />;
    }
    if (rank === 3) {
      return <Medal className="h-10 w-10 text-orange-600" />;
    }
    return null;
  };

  const getPodiumColor = (rank: number) => {
    if (rank === 1) {
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    }
    if (rank === 2) {
      return "border-gray-400 bg-gray-50 dark:bg-gray-950/20";
    }
    if (rank === 3) {
      return "border-orange-600 bg-orange-50 dark:bg-orange-950/20";
    }
    return "";
  };

  const getPodiumHeight = (rank: number) => {
    if (rank === 1) return "md:mt-0";
    if (rank === 2) return "md:mt-8";
    if (rank === 3) return "md:mt-12";
    return "";
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {topTeams.map((team) => {
        if (!team) return null;

        return (
          <Card
            key={team.teamId}
            className={`transition-transform hover:scale-105 ${getPodiumColor(team.rank)} ${getPodiumHeight(team.rank)}`}
          >
            <CardContent className="flex flex-col items-center p-6">
              <div className="mb-4">{getPodiumIcon(team.rank)}</div>
              <div className="mb-2 text-center">
                <Link
                  href={`/teams/${team.teamId}`}
                  className="font-bold text-lg hover:underline"
                >
                  {team.teamName}
                </Link>
              </div>
              <div className="mb-3 font-bold text-3xl">{team.points} pts</div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                {team.memberCount} members
              </div>
              {team.isWinner && (
                <div className="mt-3 rounded-full bg-yellow-500 px-3 py-1 font-semibold text-white text-xs">
                  Tournament Winner
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
