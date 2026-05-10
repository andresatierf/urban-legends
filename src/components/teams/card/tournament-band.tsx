import { Link } from "@tanstack/react-router";

import { StatusBand } from "../../common/card/status-band";
import { STATUS_LABEL, getTournamentStatus } from "../../tournaments/utils";
import type { TeamCardData } from "./types";

export function TournamentBand({ data }: { data: TeamCardData }) {
  const { tournament } = data;
  if (!tournament) return null;

  const status = getTournamentStatus(tournament);

  return (
    <StatusBand
      status={status}
      palette="vivid"
      asChild
      className="hover:opacity-90"
    >
      <Link
        to="/tournaments/$tournamentId"
        params={{ tournamentId: tournament._id }}
      >
        <span className="truncate text-xs font-medium">{tournament.name}</span>
        <span className="ml-2 shrink-0 text-[0.625rem] opacity-80">
          {STATUS_LABEL[status]}
        </span>
      </Link>
    </StatusBand>
  );
}
