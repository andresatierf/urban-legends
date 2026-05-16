import { createFileRoute } from "@tanstack/react-router";

import { TournamentSection } from "@/components/workbench/tournament-card/section";

export const Route = createFileRoute(
  "/_protected/workbench/components/tournament-card",
)({
  component: TournamentCardWorkbenchPage,
});

function TournamentCardWorkbenchPage() {
  return (
    <div className="space-y-8">
      <TournamentSection />
    </div>
  );
}
