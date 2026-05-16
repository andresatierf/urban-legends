import { DashboardTeamCard } from "@/components/dashboard/dashboard-team-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { SectionHeader } from "@/components/section-header";

import { VariantMatrix } from "./shells/variant-matrix";

const COLORS = ["gold", "sky", "sunset", "grass"] as const;
const SHAPES = ["rising", "flat", "falling", "empty"] as const;

const COLOR_VARS: Record<(typeof COLORS)[number], string> = {
  gold: "var(--gold)",
  sky: "var(--sky)",
  sunset: "var(--sunset)",
  grass: "var(--grass)",
};

const SPARKLINES: Record<(typeof SHAPES)[number], number[]> = {
  rising: [1, 2, 2, 4, 5, 7, 9],
  flat: [4, 4, 5, 4, 5, 4, 5],
  falling: [9, 7, 6, 4, 3, 2, 1],
  empty: [0, 0, 0, 0, 0, 0, 0],
};

const METRIC_LABEL: Record<
  (typeof SHAPES)[number],
  { value: number; unit: string }
> = {
  rising: { value: 42, unit: "approved" },
  flat: { value: 18, unit: "streak" },
  falling: { value: 6, unit: "pending" },
  empty: { value: 0, unit: "today" },
};

export function DashboardSurfacesSpecimens() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <SectionHeader
          as="h1"
          title="MetricTile"
          description="Dashboard hero stat tile. Color × sparkline shape matrix."
        />

        <VariantMatrix
          variants={COLORS}
          columns={SHAPES}
          renderCell={(color, shape) => {
            const m = METRIC_LABEL[shape];
            return (
              <MetricTile
                label={shape}
                value={m.value}
                unit={m.unit}
                color={COLOR_VARS[color]}
                sparkline={SPARKLINES[shape]}
              />
            );
          }}
        />
      </section>

      <section className="space-y-6">
        <SectionHeader
          as="h1"
          title="DashboardTeamCard"
          description="Team callout on the user dashboard. Captain × member-count × progress."
        />

        <div className="bg-paper grid gap-4 rounded-lg p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardTeamCard
            name="Urban Divas ✨"
            tournamentName="Urban Legends 2026"
            points={320}
            memberCount={5}
            isCaptain={false}
            progress={45}
          />
          <DashboardTeamCard
            name="Booldozers"
            tournamentName="Captains Cup Spring"
            points={780}
            memberCount={8}
            isCaptain
            progress={85}
          />
          <DashboardTeamCard
            name="404 Shape Not Found"
            tournamentName="Summer City Challenge"
            points={185}
            memberCount={3}
            isCaptain={false}
            progress={20}
          />
          <DashboardTeamCard
            name="Legends on Tap"
            tournamentName="Urban Legends 2026"
            points={540}
            memberCount={7}
            isCaptain
            progress={65}
          />
          <DashboardTeamCard
            name="Step Monsters"
            tournamentName="Urban Legends 2026"
            points={95}
            memberCount={11}
            isCaptain={false}
            progress={10}
          />
          <DashboardTeamCard
            name="Cardio Criminals"
            tournamentName="Captains Cup Spring"
            points={0}
            memberCount={1}
            isCaptain={false}
            progress={0}
          />
        </div>
      </section>
    </div>
  );
}
