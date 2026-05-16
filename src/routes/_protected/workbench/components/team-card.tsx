import { createFileRoute } from "@tanstack/react-router";

import { TeamSection } from "@/components/workbench/team-card/section";

export const Route = createFileRoute(
  "/_protected/workbench/components/team-card",
)({
  component: TeamCardWorkbenchPage,
});

function TeamCardWorkbenchPage() {
  return (
    <div className="space-y-8">
      <TeamSection />
    </div>
  );
}
