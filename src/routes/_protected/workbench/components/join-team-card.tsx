import { createFileRoute } from "@tanstack/react-router";

import { JoinTeamCardSection } from "@/components/workbench/join-team-card/section";

export const Route = createFileRoute(
  "/_protected/workbench/components/join-team-card",
)({
  component: JoinTeamCardWorkbenchPage,
});

function JoinTeamCardWorkbenchPage() {
  return <JoinTeamCardSection />;
}
