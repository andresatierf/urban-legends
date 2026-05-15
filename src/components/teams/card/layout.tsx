import { useMutation } from "convex/react";
import { LogOut, Settings } from "lucide-react";

import {
  ComposedCard,
  type ComposedCardAction,
} from "@/components/common/card/composed-card";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import { getTournamentStatus, STATUS_LABEL } from "../../tournaments/utils";
import { CaptainSpotlight } from "./captain-spotlight";
import { JoinTeamButton } from "./join-team-action";
import { MomentumCell } from "./momentum-cell";
import { SparklineCell } from "./sparkline-cell";
import { StatsStrip } from "./stats-strip";
import type { TeamCardData } from "./types";
import { ViewTeamButton } from "./view-team-button";
import { ViewerRoleRibbon } from "./viewer-role-ribbon";

export { TeamCardSkeleton } from "./skeleton";

type Props = {
  data: TeamCardData;
};

export function TeamCard({ data }: Props) {
  const { team, tournament, memberCount, isUserMember, userRole } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;
  const isCaptain = userRole === "captain";

  const leaveTeam = useMutation(api.teams.leaveTeam);
  const handleLeave = () => {
    void tryMutate({
      fn: () => leaveTeam({ teamId: team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  };

  const badge = [
    isFull
      ? ({ variant: "error" as const, children: "Full" } as const)
      : ({
          variant: team.joinPolicy === "open" ? "success" : "neutral",
          children: team.joinPolicy === "open" ? "Open" : "Closed",
        } as const),
  ];

  const canLeave =
    userRole === "member" || (userRole === "captain" && memberCount === 1);

  const actions: ComposedCardAction[] = [];
  if (isUserMember) {
    if (canLeave) {
      actions.push({
        label: "Leave",
        icon: <LogOut className="size-3.5" />,
        variant: "destructive",
        onClick: handleLeave,
      });
    }
    actions.push({
      label: "Manage",
      icon: <Settings className="size-3.5" />,
      variant: "default",
      align: "end",
      to: "/teams/$teamId",
      params: { teamId: team._id },
    });
  }

  const borderClass = isCaptain
    ? "border-warning"
    : isUserMember
      ? "border-sky"
      : undefined;

  return (
    <div className="relative">
      <ViewerRoleRibbon userRole={userRole} />
      <JoinTeamButton data={data} />
      <ViewTeamButton data={data} />
      <ComposedCard
        className={borderClass}
        title={team.name}
        eyebrow={
          tournament
            ? `${tournament.name} · ${STATUS_LABEL[getTournamentStatus(tournament)]}`
            : undefined
        }
        eyebrowTo={tournament ? "/tournaments/$tournamentId" : undefined}
        eyebrowParams={
          tournament ? { tournamentId: tournament._id } : undefined
        }
        badge={badge}
        actions={actions}
      >
        <StatsStrip data={data} />
        <div className="grid grid-cols-2 gap-2">
          <MomentumCell data={data} />
          <SparklineCell data={data} />
        </div>
        <CaptainSpotlight data={data} />
      </ComposedCard>
    </div>
  );
}
