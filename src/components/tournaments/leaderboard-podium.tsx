"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Medal, Trophy, Users } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";
import { PodiumSkeleton } from "../ui/podium-skeleton";

const getPodiumIcon = (rank: number) => {
  if (rank === 1) {
    return <Trophy className="text-podium-gold h-12 w-12" />;
  }
  if (rank === 2) {
    return <Medal className="text-podium-silver h-10 w-10" />;
  }
  if (rank === 3) {
    return <Medal className="text-podium-bronze h-10 w-10" />;
  }
  return null;
};

const getPodiumColor = (rank: number) => {
  if (rank === 1) {
    return "border-podium-gold bg-podium-gold-bg";
  }
  if (rank === 2) {
    return "border-podium-silver bg-podium-silver-bg";
  }
  if (rank === 3) {
    return "border-podium-bronze bg-podium-bronze-bg";
  }
  return "";
};

const getPodiumHeight = (rank: number) => {
  if (rank === 1) return "md:mt-0";
  if (rank === 2) return "md:mt-8";
  if (rank === 3) return "md:mt-12";
  return "";
};

type Props = {
  tournamentId: Id<"tournaments">;
};

export function LeaderboardPodium({ tournamentId }: Props) {
  const leaderboard = useQuery(api.tournaments.getLeaderboard, {
    tournamentId,
    limit: 3,
  });

  if (leaderboard === undefined) {
    return <PodiumSkeleton className="grid grid-cols-1 gap-4 md:grid-cols-3" />;
  }

  if (leaderboard.length === 0) {
    return null;
  }

  const topTeams = [
    leaderboard.find((t) => t.rank === 2),
    leaderboard.find((t) => t.rank === 1),
    leaderboard.find((t) => t.rank === 3),
  ].filter((team): team is NonNullable<typeof team> => Boolean(team));

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
                  to="/teams/$teamId"
                  params={{ teamId: team.teamId }}
                  className="text-lg font-bold hover:underline"
                  aria-label={`View ${team.teamName} team profile - Rank ${team.rank}`}
                >
                  {team.teamName}
                </Link>
              </div>
              <div className="mb-3 text-3xl font-bold">{team.points} pts</div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                {team.memberCount} members
              </div>
              {team.isWinner && (
                <div className="bg-podium-gold text-primary-foreground mt-3 rounded-full px-3 py-1 text-xs font-semibold">
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
