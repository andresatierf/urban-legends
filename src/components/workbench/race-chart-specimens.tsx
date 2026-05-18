import { RaceChart } from "@/components/common/race-chart";
import { SectionHeader } from "@/components/section-header";

import { Specimen } from "./shells/specimen";
import {
  DEFAULT_STANDINGS_FIXTURE,
  FLAT_STANDINGS_FIXTURE,
} from "./standings-race/fixtures";

export function RaceChartSpecimens() {
  return (
    <div className="space-y-12">
      <SectionHeader
        as="h1"
        title="Race Chart"
        description="Standings race line chart. One series per team, optional reference line for the viewer’s own team."
      />

      <Specimen label="Full field · viewer is leading">
        <RaceChart
          days={DEFAULT_STANDINGS_FIXTURE.chartData.days}
          series={DEFAULT_STANDINGS_FIXTURE.chartData.series}
          userTeamId={DEFAULT_STANDINGS_FIXTURE.userTeamId}
        />
      </Specimen>

      <Specimen label="Short window · 3 teams · no user reference line">
        <RaceChart
          days={FLAT_STANDINGS_FIXTURE.chartData.days}
          series={FLAT_STANDINGS_FIXTURE.chartData.series}
        />
      </Specimen>
    </div>
  );
}
