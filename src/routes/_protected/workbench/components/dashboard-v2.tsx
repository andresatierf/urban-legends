import { createFileRoute } from "@tanstack/react-router";

import { DashboardV2Specimens } from "@/components/workbench/dashboard-v2-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/dashboard-v2",
)({
  component: DashboardV2WorkbenchPage,
});

function DashboardV2WorkbenchPage() {
  return <DashboardV2Specimens />;
}
