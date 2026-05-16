import { Users } from "lucide-react";

import { TeamCard } from "@/components/teams/card/layout";
import { useTeamCardActions } from "@/components/teams/use-team-card-actions";
import { useUser } from "@/hooks/useUser";

import { SectionHeader } from "../../section-header";
import type { TournamentDetails, TournamentTeam } from "./types";

type Props = {
  data: TournamentDetails;
  sortedTeams: TournamentTeam[];
};

export function TeamRosters({ data, sortedTeams }: Props) {
  const { user } = useUser();
  const currentUserId = user?._id;
  const getCardActions = useTeamCardActions();

  if (sortedTeams.length === 0) return null;

  return (
    <>
      <SectionHeader as="h2" title="Teams" Icon={Users} />
      <div className="grid gap-3 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {sortedTeams.map((team, idx) => {
          const isUserMember = data.userTeam?._id === team._id;
          const userRole =
            isUserMember && currentUserId
              ? (team.members.find((m) => m._id === currentUserId)
                  ?.memberRole ?? null)
              : null;

          const actions = getCardActions(team._id);
          return (
            <TeamCard
              key={team._id}
              data={{
                team,
                // Tournament context is already implicit on this page; skip the
                // eyebrow link to avoid pointing back at the page we're on.
                tournament: undefined,
                members: team.members,
                memberCount: team.memberCount,
                isUserMember,
                isUserInTeam: data.userTeam != null,
                userRole,
                rank: idx + 1,
                totalTeams: sortedTeams.length,
              }}
              joinRequest={actions.joinRequest}
              onRequestJoin={actions.onRequestJoin}
              onCancelRequest={actions.onCancelRequest}
              onLeave={actions.onLeave}
            />
          );
        })}
      </div>
    </>
  );
}
