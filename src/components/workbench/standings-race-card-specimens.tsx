import { StandingsRaceCard } from "@/components/dashboard/standings-race-card";
import { SectionHeader } from "@/components/section-header";

import {
  DEFAULT_STANDINGS_FIXTURE,
  FLAT_STANDINGS_FIXTURE,
  SINGLE_TEAM_FIXTURE,
} from "./standings-race/fixtures";

export function StandingsRaceCardSpecimens() {
  return (
    <div className="space-y-12">
      <SectionHeader
        as="h1"
        title="Standings Race Card"
        description="Full Race + leaderboard dashboard card driven by hand-rolled fixtures shaped like the Convex StandingsGroup / StandingsChartData."
      />

      <Specimen label="Active tournament · 6 teams · viewer in 1st">
        <StandingsRaceCard
          group={DEFAULT_STANDINGS_FIXTURE.group}
          isActive
          chartData={DEFAULT_STANDINGS_FIXTURE.chartData}
          userTeamId={DEFAULT_STANDINGS_FIXTURE.userTeamId}
        />
      </Specimen>

      <Specimen label="Tight race · 3 teams">
        <StandingsRaceCard
          group={FLAT_STANDINGS_FIXTURE.group}
          isActive
          chartData={FLAT_STANDINGS_FIXTURE.chartData}
          userTeamId={FLAT_STANDINGS_FIXTURE.userTeamId}
        />
      </Specimen>

      <Specimen label="Single team">
        <StandingsRaceCard
          group={SINGLE_TEAM_FIXTURE.group}
          isActive
          chartData={SINGLE_TEAM_FIXTURE.chartData}
          userTeamId={SINGLE_TEAM_FIXTURE.userTeamId}
        />
      </Specimen>

      <Specimen label="No chart data · leaderboard only">
        <StandingsRaceCard
          group={DEFAULT_STANDINGS_FIXTURE.group}
          isActive={false}
          chartData={null}
          userTeamId={DEFAULT_STANDINGS_FIXTURE.userTeamId}
        />
      </Specimen>
    </div>
  );
}

function Specimen({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-label-caps">{label}</h3>
      <div className="bg-paper rounded-lg p-6">{children}</div>
    </div>
  );
}
