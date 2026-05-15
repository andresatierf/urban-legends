import type { ComposedCardAction } from "@/components/common/card/composed-card";

import { JoinTeamFormButton } from "../../form/join-team-form-button";
import type { TeamCardData } from "./types";

export function joinTeamAction(data: TeamCardData): ComposedCardAction | null {
  if (data.isUserInTeam) return null;
  if (data.team.joinPolicy === "closed") return null;
  if (data.team.maxMembers != null && data.memberCount >= data.team.maxMembers)
    return null;

  return {
    slot: (
      <JoinTeamFormButton
        teamId={data.team._id}
        team={data.team}
        currentMemberCount={data.memberCount}
        isUserMember={data.isUserMember}
        isUserInTeam={data.isUserInTeam}
        size="sm"
        variant="grass"
      />
    ),
  };
}
