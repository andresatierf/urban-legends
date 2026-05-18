import { createFileRoute } from "@tanstack/react-router";

import { DashboardSpecimens } from "@/components/workbench/dashboard/specimens";

export const Route = createFileRoute("/_protected/workbench/pages/dashboard")({
  component: DashboardWorkbenchPage,
});

function DashboardWorkbenchPage() {
  return <DashboardSpecimens />;
}
