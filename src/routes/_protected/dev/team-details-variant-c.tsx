import { createFileRoute } from "@tanstack/react-router";

import { TeamDetailsVariantC } from "@/components/teams/variants/team-details-variant-c";

export const Route = createFileRoute("/_protected/dev/team-details-variant-c")({
  component: TeamDetailsVariantCPage,
});

function TeamDetailsVariantCPage() {
  return <TeamDetailsVariantC />;
}
