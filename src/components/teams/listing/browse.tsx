import { Eyebrow } from "@/components/ui/eyebrow";

import type { Id } from "../../../../convex/_generated/dataModel";
import { TeamCardCell } from "./team-card-cell";
import type { TeamWithMembers, TournamentMap } from "./types";

type Props = {
  teams: TeamWithMembers[];
  tournamentMap: TournamentMap;
  userTeamIds: Set<Id<"teams">>;
  userTournamentIds: Set<Id<"tournaments">>;
  showTournamentEyebrow: boolean;
  hasUserTeams: boolean;
};

export function Browse({
  teams,
  tournamentMap,
  userTeamIds,
  userTournamentIds,
  showTournamentEyebrow,
  hasUserTeams,
}: Props) {
  return (
    <section className="space-y-4 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Browse</Eyebrow>
          <h2 className="text-h2 text-foreground mt-1">
            {hasUserTeams ? "Other teams" : "All teams"}
          </h2>
        </div>
      </div>

      {teams.length === 0 ? (
        <p className="border-ink-soft text-muted-foreground text-body-sm rounded-xl border-2 border-dashed py-8 text-center">
          No other teams to show.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <TeamCardCell
              key={team._id}
              team={team}
              tournamentMap={tournamentMap}
              userTeamIds={userTeamIds}
              userTournamentIds={userTournamentIds}
              showTournamentEyebrow={showTournamentEyebrow}
            />
          ))}
        </div>
      )}
    </section>
  );
}
