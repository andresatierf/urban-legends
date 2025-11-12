"use client";

import { useQuery } from "convex/react";
import { Trophy, Users } from "lucide-react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type Props = {
  tournamentId: Id<"tournaments">;
};

export function WinnerAnnouncement({ tournamentId }: Props) {
  const winner = useQuery(api.tournaments.getWinner, { tournamentId });

  if (winner === undefined) {
    return (
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!winner) {
    return null;
  }

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trophy className="h-8 w-8 text-yellow-600" />
          Tournament Champion!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Link
            href={`/teams/${winner.team._id}`}
            className="font-bold text-3xl hover:underline"
          >
            {winner.team.name}
          </Link>
          <p className="mt-2 text-lg text-muted-foreground">
            Final Score:{" "}
            <span className="font-semibold">{winner.team.points} points</span>
          </p>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4" />
            Team Members
          </h4>
          <div className="flex flex-wrap gap-2">
            {winner.members.map((member) => (
              <div
                key={member._id}
                className="rounded-full bg-white px-3 py-1 text-sm dark:bg-gray-950"
              >
                {member.name}
              </div>
            ))}
          </div>
        </div>

        {winner.completedAt && (
          <p className="text-muted-foreground text-sm">
            Tournament completed on{" "}
            {new Date(winner.completedAt).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/tournaments/${tournamentId}/leaderboard`}>
              View Full Leaderboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/teams/${winner.team._id}`}>View Team Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
