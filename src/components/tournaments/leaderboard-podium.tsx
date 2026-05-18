"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Medal, Trophy, Users } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";
import { Eyebrow } from "../ui/eyebrow";
import { PodiumSkeleton } from "../ui/podium-skeleton";

const PODIUM_CONFIG: Record<
  number,
  {
    icon: React.ReactNode;
    border: string;
    bg: string;
    shadow: string;
    height: string;
    label: string;
    eyebrowColor: "gold" | "mute";
  }
> = {
  1: {
    icon: <Trophy className="text-podium-gold h-12 w-12" />,
    border: "border-podium-gold",
    bg: "bg-podium-gold-bg",
    shadow: "shadow-lg",
    height: "md:mt-0",
    label: "1st",
    eyebrowColor: "gold",
  },
  2: {
    icon: <Medal className="text-podium-silver h-10 w-10" />,
    border: "border-podium-silver",
    bg: "bg-podium-silver-bg",
    shadow: "shadow-md",
    height: "md:mt-8",
    label: "2nd",
    eyebrowColor: "mute",
  },
  3: {
    icon: <Medal className="text-podium-bronze h-10 w-10" />,
    border: "border-podium-bronze",
    bg: "bg-podium-bronze-bg",
    shadow: "shadow-md",
    height: "md:mt-12",
    label: "3rd",
    eyebrowColor: "mute",
  },
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
        const config = PODIUM_CONFIG[team.rank];
        if (!config) return null;

        return (
          <Card
            key={team.teamId}
            className={`border-2 transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-xl ${config.border} ${config.bg} ${config.shadow} ${config.height}`}
          >
            <CardContent className="flex flex-col items-center p-6">
              <div className="mb-2">{config.icon}</div>
              <Eyebrow color={config.eyebrowColor} className="mb-2">
                {config.label}
              </Eyebrow>
              <div className="mb-2 text-center">
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: team.teamId }}
                  className="text-ink font-heading text-lg font-bold hover:underline"
                  aria-label={`View ${team.teamName} team profile - Rank ${team.rank}`}
                >
                  {team.teamName}
                </Link>
              </div>
              <div className="text-ink text-metric mb-3">
                {team.points}{" "}
                <span className="text-muted-foreground text-sm">pts</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                {team.memberCount} members
              </div>
              {team.isWinner && (
                <div className="border-podium-gold bg-podium-gold-bg text-label-caps text-podium-gold mt-3 rounded-full border-2 px-3 py-1">
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
