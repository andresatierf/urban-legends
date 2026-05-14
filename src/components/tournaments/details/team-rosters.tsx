import { Crown, Users } from "lucide-react";

import {
  ComposedCard,
  type ComposedCardAction,
} from "../../common/card/composed-card";
import { JoinTeamFormButton } from "../../form/join-team-form-button";
import { SectionHeader } from "../../section-header";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Eyebrow } from "../../ui/eyebrow";
import { getInitials } from "../../users/utils";
import type { TournamentDetails, TournamentTeam } from "./types";

type Props = {
  data: TournamentDetails;
  sortedTeams: TournamentTeam[];
};

export function TeamRosters({ data, sortedTeams }: Props) {
  if (sortedTeams.length === 0) return null;

  return (
    <>
      <SectionHeader as="h2" title="Team Rosters" Icon={Users} />
      <div className="grid gap-3 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        {sortedTeams.map((team) => {
          const isUserTeam = data.userTeam?._id === team._id;
          const isFull =
            team.maxMembers != null && team.memberCount >= team.maxMembers;

          const actions: ComposedCardAction[] = [];
          if (!data.userTeam && data.status !== "ended") {
            actions.push({
              slot: (
                <JoinTeamFormButton
                  teamId={team._id}
                  team={team}
                  currentMemberCount={team.memberCount}
                  isUserMember={isUserTeam}
                  isUserInTeam={false}
                  size="sm"
                  variant="grass"
                />
              ),
            });
          }
          actions.push({
            label: "View",
            variant: "default",
            align: "end",
            to: "/teams/$teamId",
            params: { teamId: team._id },
          });

          return (
            <ComposedCard
              key={team._id}
              className={isUserTeam ? "border-sky" : undefined}
              title={team.name}
              badge={
                isFull
                  ? { variant: "error", children: "Full" }
                  : {
                      variant:
                        team.joinPolicy === "open" ? "success" : "neutral",
                      children: team.joinPolicy === "open" ? "Open" : "Closed",
                    }
              }
              actions={actions}
            >
              <div className="space-y-1">
                {team.members.map((m) => (
                  <div key={m._id} className="flex items-center gap-2 text-xs">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{m.name}</span>
                    {m.memberRole === "captain" && (
                      <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
              <Eyebrow>
                {team.memberCount}
                {team.maxMembers && `/${team.maxMembers}`} members
              </Eyebrow>
            </ComposedCard>
          );
        })}
      </div>
    </>
  );
}
