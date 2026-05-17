import { createFileRoute } from "@tanstack/react-router";

import { ChartSpecimens } from "@/components/workbench/chart-specimens";

export const Route = createFileRoute("/_protected/workbench/primitives/chart")({
  component: ChartWorkbenchPage,
});

function ChartWorkbenchPage() {
  return <ChartSpecimens />;
}
