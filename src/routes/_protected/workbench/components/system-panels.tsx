import { createFileRoute } from "@tanstack/react-router";

import { SystemPanelsSpecimens } from "@/components/workbench/system-panels-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/system-panels",
)({
  component: SystemPanelsWorkbenchPage,
});

function SystemPanelsWorkbenchPage() {
  return <SystemPanelsSpecimens />;
}
