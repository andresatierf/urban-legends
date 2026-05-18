import { createFileRoute } from "@tanstack/react-router";

import { TournamentsListingSpecimens } from "@/components/workbench/tournaments-listing/specimens";

export const Route = createFileRoute("/_protected/workbench/pages/tournaments")(
  {
    component: TournamentsListingWorkbenchPage,
  },
);

function TournamentsListingWorkbenchPage() {
  return <TournamentsListingSpecimens />;
}
