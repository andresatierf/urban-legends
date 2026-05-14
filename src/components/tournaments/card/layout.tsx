import { ArrowRight, Edit } from "lucide-react";

import {
  ComposedCard,
  type ComposedCardAction,
} from "@/components/common/card/composed-card";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import {
  getTournamentStatus,
  STATUS_LABEL,
  type TournamentStatus,
} from "../utils";
import { PendingReviews } from "./pending-reviews";
import { StatsGrid } from "./stats-grid";
import { TeamMembership } from "./team-membership";
import { Timeline } from "./timeline";
import type { TournamentCardData } from "./types";

const STATUS_VARIANT: Record<TournamentStatus, "success" | "info" | "neutral"> =
  {
    active: "success",
    upcoming: "info",
    ended: "neutral",
  };

export function TournamentOverviewCard({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);

  const actions: ComposedCardAction[] = [];
  if (data.authority.canManage) {
    actions.push({
      label: "Manage",
      icon: <Edit className="h-3.5 w-3.5" />,
      variant: "secondary",
      to: `/admin/tournaments?edit=${data._id}` as never,
    });
  }
  actions.push({
    label: data.authority.team ? "View" : "Browse Teams",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    iconPosition: "end",
    align: "end",
    to: "/tournaments/$tournamentId",
    params: { tournamentId: data._id },
  });

  return (
    <ComposedCard
      title={data.name}
      eyebrow={`${format(data.startDate, "long")} – ${format(data.endDate, "long")}`}
      badge={{
        variant: STATUS_VARIANT[status],
        children: STATUS_LABEL[status],
      }}
      actions={actions}
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
  );
}
