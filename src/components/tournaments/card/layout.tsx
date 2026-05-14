import {
  ComposedCard,
  ComposedCardBody,
} from "@/components/common/card/composed-card";

import { Footer } from "./footer";
import { Header } from "./header";
import { PendingReviews } from "./pending-reviews";
import { StatsGrid } from "./stats-grid";
import { StatusHeader } from "./status-header";
import { TeamMembership } from "./team-membership";
import { Timeline } from "./timeline";
import type { TournamentCardData } from "./types";

export function TournamentOverviewCard({ data }: { data: TournamentCardData }) {
  return (
    <ComposedCard>
      <StatusHeader data={data} />
      <ComposedCardBody>
        <Header data={data} />
        <Timeline data={data} />
        <StatsGrid data={data} />
        <TeamMembership data={data} />
        <PendingReviews data={data} />
        <Footer data={data} />
      </ComposedCardBody>
    </ComposedCard>
  );
}
