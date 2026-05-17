import { createFileRoute } from "@tanstack/react-router";

import { RaceChartSpecimens } from "@/components/workbench/race-chart-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/race-chart",
)({
  component: RaceChartWorkbenchPage,
});

function RaceChartWorkbenchPage() {
  return <RaceChartSpecimens />;
}
