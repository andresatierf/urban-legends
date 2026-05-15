import type { ComposedCardAction } from "@/components/common/card/composed-card";

import { JoinTeamFormButton } from "../../form/join-team-form-button";
import type { TeamCardData } from "./types";

export function joinTeamAction(
  data: TeamCardData,
  isFull: boolean,
): ComposedCardAction | null {
  if (data.isUserInTeam) return null;
  if (data.team.joinPolicy === "closed") return null;
  if (isFull) return null;

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
