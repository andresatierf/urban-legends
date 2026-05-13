import { DashboardVariantA } from "./dashboard-variant-a";
import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { RivalsScoutingReport } from "./rivals-scouting-report";

/**
 * Variant A3 — Field Day with the Rivals "Scouting Report" section in slot 3.
 */
export function DashboardVariantA3({ data }: { data: DashboardFixtureData }) {
  return (
    <DashboardVariantA
      data={data}
      renderSquadsSection={(ctx) => <RivalsScoutingReport {...ctx} />}
    />
  );
}
