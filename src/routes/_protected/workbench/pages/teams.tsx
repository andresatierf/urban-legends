import { createFileRoute } from "@tanstack/react-router";

import { TeamsListingSpecimens } from "@/components/workbench/teams-listing/specimens";

export const Route = createFileRoute("/_protected/workbench/pages/teams")({
  component: TeamsListingWorkbenchPage,
});

function TeamsListingWorkbenchPage() {
  return <TeamsListingSpecimens />;
}
