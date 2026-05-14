import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import type { BadgeProps } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";

import { getTournamentStatus, STATUS_LABEL } from "../../tournaments/utils";
import type { TeamCardData } from "./types";

export function getTeamCardHeader(data: TeamCardData): {
  title: React.ReactNode;
  eyebrow: React.ReactNode;
  badge: BadgeProps[];
} {
  const { team, tournament, memberCount, isUserMember } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;

  const badge: BadgeProps[] = [
    {
      variant: team.joinPolicy === "open" ? "success" : "neutral",
      children: team.joinPolicy === "open" ? "Open" : "Closed",
    },
  ];
  if (isFull) badge.push({ variant: "error", children: "Full" });

  return {
    badge,
    eyebrow: tournament && (
      <Link
        to="/tournaments/$tournamentId"
        params={{ tournamentId: tournament._id }}
        className="hover:text-ink min-w-0 transition-colors"
      >
        <Eyebrow className="block truncate">
          {tournament.name} · {STATUS_LABEL[getTournamentStatus(tournament)]}
        </Eyebrow>
      </Link>
    ),
    title: (
      <h3 className="font-heading m-0 flex items-center gap-1.5 truncate text-base font-extrabold">
        {team.name}
        {isUserMember && (
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
        )}
      </h3>
    ),
  };
}
