import { Card } from "@/components/ui/card";

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
    <Card className="gap-0 py-0">
      <StatusHeader data={data} />
      <div className="flex flex-col gap-3 px-4 py-3">
        <Header data={data} />
        <Timeline data={data} />
        <StatsGrid data={data} />
        <TeamMembership data={data} />
        <PendingReviews data={data} />
        <Footer data={data} />
      </div>
    </Card>
  );
}
