import { createFileRoute } from "@tanstack/react-router";

import { StandingsRaceCardSpecimens } from "@/components/workbench/standings-race-card-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/standings-race-card",
)({
  component: StandingsRaceCardWorkbenchPage,
});

function StandingsRaceCardWorkbenchPage() {
  return <StandingsRaceCardSpecimens />;
}
