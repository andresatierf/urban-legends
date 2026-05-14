import { ComposedCard } from "@/components/common/card/composed-card";

import { getTournamentCardActions } from "./footer";
import { Header } from "./header";
import { PendingReviews } from "./pending-reviews";
import { StatsGrid } from "./stats-grid";
import { useTournamentStatusHeader } from "./status-header";
import { TeamMembership } from "./team-membership";
import { Timeline } from "./timeline";
import type { TournamentCardData } from "./types";

export function TournamentOverviewCard({ data }: { data: TournamentCardData }) {
  const header = useTournamentStatusHeader(data);
  const actions = getTournamentCardActions(data);
  return (
    <ComposedCard
      title={header.title}
      eyebrow={header.eyebrow}
      badge={header.badge}
      actions={actions}
    >
      <Header data={data} />
      <Timeline data={data} />
      <StatsGrid data={data} />
      <TeamMembership data={data} />
      <PendingReviews data={data} />
    </ComposedCard>
  );
}
