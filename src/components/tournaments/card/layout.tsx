import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import {
  getTournamentStatus,
  STATUS_LABEL,
  type TournamentStatus,
} from "../utils";
import { ManageTournamentButton } from "./manage-tournament-button";
import { PendingReviews } from "./pending-reviews";
import { StatsGrid } from "./stats-grid";
import { TeamMembership } from "./team-membership";
import { Timeline } from "./timeline";
import type { TournamentCardData } from "./types";
import { ViewTournamentButton } from "./view-tournament-button";

const STATUS_VARIANT: Record<TournamentStatus, "success" | "info" | "neutral"> =
  {
    active: "success",
    upcoming: "info",
    ended: "neutral",
  };

export function TournamentOverviewCard({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);

  return (
    <EdgeOverlay
      bottomLeft={<ManageTournamentButton data={data} />}
      bottomRight={<ViewTournamentButton data={data} />}
    >
      <ComposedCard
        title={data.name}
        eyebrow={`${format(data.startDate, "long")} – ${format(data.endDate, "long")}`}
        badge={{
          variant: STATUS_VARIANT[status],
          children: STATUS_LABEL[status],
        }}
      >
        {data.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {data.description}
          </p>
        )}
        <Timeline data={data} />
        <StatsGrid data={data} />
        <TeamMembership data={data} />
        <PendingReviews data={data} />
      </ComposedCard>
    </EdgeOverlay>
  );
}
