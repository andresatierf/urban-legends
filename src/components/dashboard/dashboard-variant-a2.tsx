import { DashboardVariantA } from "./dashboard-variant-a";
import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { RivalsVersusLedger } from "./rivals-versus-ledger";

/**
 * Variant A2 — Field Day with the Rivals "Versus Ledger" section in slot 3.
 */
export function DashboardVariantA2({ data }: { data: DashboardFixtureData }) {
  return (
    <DashboardVariantA
      data={data}
      renderSquadsSection={(ctx) => <RivalsVersusLedger {...ctx} />}
    />
  );
}
