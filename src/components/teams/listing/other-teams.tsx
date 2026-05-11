import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { SectionLabel } from "./section-label";
import { TournamentGroup } from "./tournament-group";
import type { TeamWithMembers } from "./types";

type Props = {
  teams: TeamWithMembers[];
  tournaments: Doc<"tournaments">[];
  effectiveFilter: string;
  userTournamentIds: Set<Id<"tournaments">>;
};

export function OtherTeams({
  teams,
  tournaments,
  effectiveFilter,
  userTournamentIds,
}: Props) {
  return (
    <section className="space-y-4">
      <SectionLabel tone="rest">
        {effectiveFilter === "all" ? "All other teams" : "Other teams"} (
        {teams.length})
      </SectionLabel>
      {teams.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
          No other teams to show.
        </p>
      ) : (
        <div className="space-y-5">
          {tournaments.map((tournament) => (
            <TournamentGroup
              key={tournament._id}
              tournament={tournament}
              teams={teams.filter((t) => t.tournamentId === tournament._id)}
              isUserInTournament={userTournamentIds.has(tournament._id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
