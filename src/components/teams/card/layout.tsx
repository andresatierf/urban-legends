import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { cn } from "@/lib/utils";

import { getTournamentStatus, STATUS_LABEL } from "../../tournaments/utils";
import { CaptainSpotlight } from "./captain-spotlight";
import {
  type JoinTeamRequestState,
  MembershipButton,
} from "./membership-button";
import { MomentumCell } from "./momentum-cell";
import { OpenTeamButton } from "./open-team-button";
import { SparklineCell } from "./sparkline-cell";
import { StatsStrip } from "./stats-strip";
import type { TeamCardData } from "./types";
import { ViewerRoleBadge } from "./viewer-role-badge";

export { TeamCardSkeleton } from "./skeleton";

type Props = {
  data: TeamCardData;
  joinRequest: JoinTeamRequestState;
  onRequestJoin: (message: string | undefined) => Promise<void> | void;
  onCancelRequest: () => void;
  onLeave: () => void;
};

export function TeamCard({
  data,
  joinRequest,
  onRequestJoin,
  onCancelRequest,
  onLeave,
}: Props) {
  const { team, tournament, isUserMember, userRole } = data;
  const isCaptain = userRole === "captain";

  return (
    <EdgeOverlay
      topRight={<ViewerRoleBadge data={data} />}
      bottomLeft={
        <MembershipButton
          data={data}
          joinRequest={joinRequest}
          onRequestJoin={onRequestJoin}
          onCancelRequest={onCancelRequest}
          onLeave={onLeave}
        />
      }
      bottomRight={<OpenTeamButton data={data} />}
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
