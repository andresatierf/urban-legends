import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";

import type { Id } from "../../../../convex/_generated/dataModel";
import { TeamCardCell } from "./team-card-cell";
import type { TeamWithMembers, TournamentMap } from "./types";

type Props = {
  teams: TeamWithMembers[];
  tournamentMap: TournamentMap;
  userTeamIds: Set<Id<"teams">>;
  userTournamentIds: Set<Id<"tournaments">>;
};

export function YourRoster({
  teams,
  tournamentMap,
  userTeamIds,
  userTournamentIds,
}: Props) {
  return (
    <section className="border-ink bg-paper-deep rounded-2xl border-2 p-5 shadow sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow color="sunset">Your roster</Eyebrow>
          <h2 className="text-h2 text-foreground mt-1">
            {teams.length === 1 ? "Your team" : "Your teams"}
          </h2>
        </div>
        <Badge variant="info" className="gap-1">
          <Crown className="size-3" />
          {teams.length} {teams.length === 1 ? "team" : "teams"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <TeamCardCell
            key={team._id}
            team={team}
            tournamentMap={tournamentMap}
            userTeamIds={userTeamIds}
            userTournamentIds={userTournamentIds}
            showTournamentEyebrow
          />
        ))}
      </div>
    </section>
  );
}
