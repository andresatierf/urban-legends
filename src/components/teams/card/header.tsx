import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { ComposedCardHeader } from "@/components/common/card/composed-card";
import type { BadgeProps } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";

import { STATUS_LABEL, getTournamentStatus } from "../../tournaments/utils";
import type { TeamCardData } from "./types";

export function Header({ data }: { data: TeamCardData }) {
  const { team, tournament, memberCount, isUserMember } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;

  const badges: BadgeProps[] = [
    {
      variant: team.joinPolicy === "open" ? "success" : "neutral",
      children: team.joinPolicy === "open" ? "Open" : "Closed",
    },
  ];
  if (isFull) badges.push({ variant: "error", children: "Full" });

  return (
    <ComposedCardHeader badge={badges}>
      {tournament && (
        <Link
          to="/tournaments/$tournamentId"
          params={{ tournamentId: tournament._id }}
          className="hover:text-ink min-w-0 transition-colors"
        >
          <Eyebrow className="block truncate">
            {tournament.name} · {STATUS_LABEL[getTournamentStatus(tournament)]}
          </Eyebrow>
        </Link>
      )}
      <h3 className="font-heading m-0 flex items-center gap-1.5 truncate text-base font-extrabold">
        {team.name}
        {isUserMember && (
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
        )}
      </h3>
    </ComposedCardHeader>
  );
}
