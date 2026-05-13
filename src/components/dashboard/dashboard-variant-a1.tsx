import { DashboardVariantA } from "./dashboard-variant-a";
import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { RivalsThreatBoard } from "./rivals-threat-board";

/**
 * Variant A1 — Field Day with the Rivals "Threat Board" section in slot 3.
 */
export function DashboardVariantA1({ data }: { data: DashboardFixtureData }) {
  return (
    <DashboardVariantA
      data={data}
      renderSquadsSection={(ctx) => <RivalsThreatBoard {...ctx} />}
    />
  );
}
