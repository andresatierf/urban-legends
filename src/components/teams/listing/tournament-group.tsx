import { Trophy } from "lucide-react";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { getStatusBadge } from "../../tournaments/utils";
import { TeamCard } from "../card/layout";
import type { TeamWithMembers } from "./types";

type Props = {
  tournament: Doc<"tournaments">;
  teams: TeamWithMembers[];
  isUserInTournament: boolean;
};

export function TournamentGroup({
  tournament,
  teams,
  isUserInTournament,
}: Props) {
  if (teams.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Trophy className="text-muted-foreground size-3.5 shrink-0" />
        <span className="text-sm font-medium">{tournament.name}</span>
        {getStatusBadge(tournament)}
        <span className="text-muted-foreground text-xs">
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <TeamCard
            key={team._id}
            data={{
              team,
              tournament: undefined,
              members: team.members,
              memberCount: team.members.length,
              isUserMember: false,
              isUserInTeam: isUserInTournament,
              userRole: null,
            }}
          />
        ))}
      </div>
    </div>
  );
}
