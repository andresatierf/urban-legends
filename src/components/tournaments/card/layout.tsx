import { Clock, Trophy, Users } from "lucide-react";

import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { EmptyValue } from "@/components/ui/empty-value";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import {
  daysUntil,
  getTournamentStatus,
  STATUS_LABEL,
  type TournamentStatus,
} from "../utils";
import { ManageTournamentButton } from "./manage-tournament-button";
import { PendingReviews } from "./pending-reviews";
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

const DAYS_LABEL: Record<TournamentStatus, string> = {
  active: "Left",
  upcoming: "Until start",
  ended: "Ended",
};

export function TournamentOverviewCard({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);
  const { authority, teamCount } = data;

  let daysValue: React.ReactNode = <EmptyValue label="Tournament has ended" />;
  if (status === "active") daysValue = `${daysUntil(data.endDate)}d`;
  else if (status === "upcoming") daysValue = `${daysUntil(data.startDate)}d`;

  return (
    <EdgeOverlay
      bottomLeft={<ManageTournamentButton data={data} />}
      bottomRight={<ViewTournamentButton data={data} />}
    >
      <ComposedCard
        className="pb-2"
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
        <StatsGrid
          variant="tiles"
          items={[
            {
              icon: Users,
              value: teamCount,
              label: teamCount === 1 ? "Team" : "Teams",
            },
            { icon: Clock, value: daysValue, label: DAYS_LABEL[status] },
            {
              icon: Trophy,
              value: authority.team ? (
                authority.team.points
              ) : (
                <EmptyValue label="No points yet" />
              ),
              label: "Points",
            },
          ]}
        />
        <TeamMembership data={data} />
        <PendingReviews data={data} />
      </ComposedCard>
    </EdgeOverlay>
  );
}
