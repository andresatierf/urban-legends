import { useUser } from "@/hooks/useUser";

import type { Id } from "../../../../convex/_generated/dataModel";
import { TeamCard } from "../card/layout";
import { useTeamCardActions } from "../use-team-card-actions";
import type { TeamWithMembers, TournamentMap } from "./types";

type Props = {
  team: TeamWithMembers;
  tournamentMap: TournamentMap;
  userTeamIds: Set<Id<"teams">>;
  userTournamentIds: Set<Id<"tournaments">>;
  showTournamentEyebrow: boolean;
};

export function TeamCardCell({
  team,
  tournamentMap,
  userTeamIds,
  userTournamentIds,
  showTournamentEyebrow,
}: Props) {
  const { user } = useUser({ shouldThrow: false });
  const currentUserId = user?._id;
  const getCardActions = useTeamCardActions();

  const isUserMember = userTeamIds.has(team._id);
  const role =
    isUserMember && currentUserId
      ? (team.members.find((m) => m._id === currentUserId)?.memberRole ?? null)
      : null;
  const actions = getCardActions(team._id);

  return (
    <TeamCard
      data={{
        team,
        tournament: showTournamentEyebrow
          ? tournamentMap[team.tournamentId]
          : undefined,
        members: team.members,
        memberCount: team.members.length,
        isUserMember,
        isUserInTeam: userTournamentIds.has(team.tournamentId),
        userRole: role,
        rank: team.rank,
        totalTeams: team.totalTeams,
      }}
      joinRequest={actions.joinRequest}
      onRequestJoin={actions.onRequestJoin}
      onCancelRequest={actions.onCancelRequest}
      onLeave={actions.onLeave}
    />
  );
}
