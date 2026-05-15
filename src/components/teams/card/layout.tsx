import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";

import { getTournamentStatus, STATUS_LABEL } from "../../tournaments/utils";
import { CaptainSpotlight } from "./captain-spotlight";
import { JoinTeamButton } from "./join-team-action";
import { LeaveTeamButton } from "./leave-team-button";
import { ManageTeamButton } from "./manage-team-button";
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

  const badge = [
    isFull
      ? ({ variant: "error" as const, children: "Full" } as const)
      : ({
          variant: team.joinPolicy === "open" ? "success" : "neutral",
          children: team.joinPolicy === "open" ? "Open" : "Closed",
        } as const),
  ];

  const borderClass = isCaptain
    ? "border-warning"
    : isUserMember
      ? "border-sky"
      : undefined;

  return (
    <EdgeOverlay
      topRight={<ViewerRoleRibbon userRole={userRole} />}
      bottomLeft={
        <>
          <JoinTeamButton data={data} />
          <LeaveTeamButton data={data} />
        </>
      }
      bottomRight={
        <>
          <ViewTeamButton data={data} />
          <ManageTeamButton data={data} />
        </>
      }
    >
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
      >
        <StatsStrip data={data} />
        <div className="grid grid-cols-2 gap-2">
          <MomentumCell data={data} />
          <SparklineCell data={data} />
        </div>
        <CaptainSpotlight data={data} />
      </ComposedCard>
    </EdgeOverlay>
  );
}
