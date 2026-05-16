import { createFileRoute } from "@tanstack/react-router";

import { DashboardSurfacesSpecimens } from "@/components/workbench/dashboard-surfaces";

export const Route = createFileRoute(
  "/_protected/workbench/components/dashboard-surfaces",
)({
  component: DashboardSurfacesWorkbenchPage,
});

function DashboardSurfacesWorkbenchPage() {
  return <DashboardSurfacesSpecimens />;
}
