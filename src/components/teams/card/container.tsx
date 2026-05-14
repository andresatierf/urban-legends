import { useMutation } from "convex/react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import { JoinTeamFormButton } from "../../form/join-team-form-button";
import { TeamCard } from "./layout";
import type { TeamCardData } from "./types";

export function TeamCardContainer({ data }: { data: TeamCardData }) {
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const handleLeave = () => {
    void tryMutate({
      fn: () => leaveTeam({ teamId: data.team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  };

  const isFull =
    data.team.maxMembers != null && data.memberCount >= data.team.maxMembers;
  const canShowJoin =
    !data.isUserInTeam && data.team.joinPolicy !== "closed" && !isFull;
  const joinSlot = canShowJoin ? (
    <JoinTeamFormButton
      teamId={data.team._id}
      team={data.team}
      currentMemberCount={data.memberCount}
      isUserMember={data.isUserMember}
      isUserInTeam={data.isUserInTeam}
      size="sm"
      variant="grass"
    />
  ) : undefined;

  return <TeamCard data={data} onLeave={handleLeave} joinSlot={joinSlot} />;
}
