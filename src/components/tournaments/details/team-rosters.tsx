import { Users } from "lucide-react";

import { useUser } from "@/hooks/useUser";

import { SectionHeader } from "../../section-header";
import { TeamCardContainer } from "../../teams/card/container";
import type { TournamentDetails, TournamentTeam } from "./types";

type Props = {
  data: TournamentDetails;
  sortedTeams: TournamentTeam[];
};

export function TeamRosters({ data, sortedTeams }: Props) {
  const { user } = useUser();
  const currentUserId = user?._id;

  if (sortedTeams.length === 0) return null;

  return (
    <>
      <SectionHeader as="h2" title="Teams" Icon={Users} />
      <div className="grid gap-3 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        {sortedTeams.map((team, idx) => {
          const isUserMember = data.userTeam?._id === team._id;
          const userRole =
            isUserMember && currentUserId
              ? (team.members.find((m) => m._id === currentUserId)
                  ?.memberRole ?? null)
              : null;

          return (
            <TeamCardContainer
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
            />
          );
        })}
      </div>
    </>
  );
}
