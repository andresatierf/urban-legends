import { createFileRoute } from "@tanstack/react-router";

import { JoinTeamCardSpecimens } from "@/components/workbench/join-team-card-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/join-team-card",
)({
  component: JoinTeamCardWorkbenchPage,
});

function JoinTeamCardWorkbenchPage() {
  return <JoinTeamCardSpecimens />;
}
