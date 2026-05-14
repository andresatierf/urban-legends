import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { Eyebrow } from "@/components/ui/eyebrow";

import { STATUS_LABEL, getTournamentStatus } from "../../tournaments/utils";
import { Badge } from "../../ui/badge";
import type { TeamCardData } from "./types";

export function Header({ data }: { data: TeamCardData }) {
  const { team, tournament, memberCount, isUserMember } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;

  return (
    <header className="border-ink bg-paper-deep flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-[0.15rem]">
        {tournament && (
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: tournament._id }}
            className="hover:text-ink min-w-0 transition-colors"
          >
            <Eyebrow className="block truncate">
              {tournament.name} ·{" "}
              {STATUS_LABEL[getTournamentStatus(tournament)]}
            </Eyebrow>
          </Link>
        )}
        <h3 className="font-heading m-0 flex items-center gap-1.5 truncate text-base font-extrabold">
          {team.name}
          {isUserMember && (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          )}
        </h3>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={team.joinPolicy === "open" ? "success" : "neutral"}
          size="default"
        >
          {team.joinPolicy === "open" ? "Open" : "Closed"}
        </Badge>
        {isFull && (
          <Badge variant="error" size="default">
            Full
          </Badge>
        )}
      </div>
    </header>
  );
}
