import type { Id } from "../../../../convex/_generated/dataModel";
import { TeamCardContainer } from "../card/container";
import { SectionLabel } from "./section-label";
import type { TeamWithMembers, TournamentMap } from "./types";

type Props = {
  teams: TeamWithMembers[];
  effectiveFilter: string;
  tournamentMap: TournamentMap;
  currentUserId: Id<"users"> | undefined;
};

export function YourTeams({
  teams,
  effectiveFilter,
  tournamentMap,
  currentUserId,
}: Props) {
  return (
    <section className="space-y-4">
      <SectionLabel tone="your">Your teams ({teams.length})</SectionLabel>
      {teams.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
          {effectiveFilter === "all"
            ? "You haven't joined any teams yet."
            : "You don't have a team in this tournament."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const role = currentUserId
              ? (team.members.find((m) => m._id === currentUserId)
                  ?.memberRole ?? null)
              : null;
            return (
              <TeamCardContainer
                key={team._id}
                data={{
                  team,
                  tournament:
                    effectiveFilter === "all"
                      ? tournamentMap[team.tournamentId]
                      : undefined,
                  members: team.members,
                  memberCount: team.members.length,
                  isUserMember: true,
                  isUserInTeam: true,
                  userRole: role,
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
