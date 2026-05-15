import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { cn } from "@/lib/utils";

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
  demo?: boolean;
};

export function TeamCard({ data, demo = false }: Props) {
  const { team, tournament, isUserMember, userRole } = data;
  const isCaptain = userRole === "captain";

  return (
    <EdgeOverlay
      topRight={<ViewerRoleRibbon userRole={userRole} />}
      bottomLeft={
        <>
          <JoinTeamButton data={data} demo={demo} />
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
        className={cn("pb-2", {
          "border-sky": isUserMember,
          "border-warning": isCaptain,
        })}
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
