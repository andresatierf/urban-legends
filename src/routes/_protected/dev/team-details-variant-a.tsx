import { createFileRoute } from "@tanstack/react-router";

import { TeamDetailsVariantA } from "@/components/teams/variants/team-details-variant-a";

export const Route = createFileRoute("/_protected/dev/team-details-variant-a")({
  component: TeamDetailsVariantAPage,
});

function TeamDetailsVariantAPage() {
  return <TeamDetailsVariantA />;
}
