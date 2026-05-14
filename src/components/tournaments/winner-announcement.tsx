"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Users } from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Eyebrow } from "../ui/eyebrow";
import { RibbonBanner } from "../ui/ribbon-banner";
import { WinnerAnnouncementSkeleton } from "../ui/winner-announcement-skeleton";

type Props = {
  tournamentId: Id<"tournaments">;
};

export function WinnerAnnouncement({ tournamentId }: Props) {
  const { format } = useFormattedDate();
  const winner = useQuery(api.tournaments.getWinner, { tournamentId });

  if (winner === undefined) {
    return <WinnerAnnouncementSkeleton />;
  }

  if (!winner) {
    return null;
  }

  return (
    <Card className="border-podium-gold bg-podium-gold-bg shadow-fd-md">
      <CardContent className="space-y-4 pt-5">
        <RibbonBanner label="Tournament Champion" color="gold" />
        <div className="text-center">
          <Eyebrow color="gold" as="div" className="mb-1">
            Champion
          </Eyebrow>
          <Link
            to="/teams/$teamId"
            params={{ teamId: winner.team._id }}
            className="text-ink font-heading text-3xl font-extrabold hover:underline"
          >
            {winner.team.name}
          </Link>
          <p className="text-muted-foreground mt-2">
            <span className="text-metric">{winner.team.points}</span>{" "}
            <Eyebrow>points</Eyebrow>
          </p>
        </div>

        <div>
          <h4 className="mb-2 flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <Eyebrow>Team Members</Eyebrow>
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            {winner.members.map((member) => (
              <span
                key={member._id}
                className="border-ink bg-card text-label-caps rounded-full border-2 px-3 py-1"
              >
                {member.name}
              </span>
            ))}
          </div>
        </div>

        {winner.completedAt && (
          <p className="text-muted-foreground text-center text-sm">
            Tournament completed on {format(winner.completedAt, "long")}
          </p>
        )}

        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link
              to="/tournaments/$tournamentId/leaderboard"
              params={{ tournamentId: tournamentId }}
            >
              View Full Leaderboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/teams/$teamId" params={{ teamId: winner.team._id }}>
              View Team Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
