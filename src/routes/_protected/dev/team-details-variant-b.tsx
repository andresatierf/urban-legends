import { createFileRoute } from "@tanstack/react-router";

import { TeamDetailsVariantB } from "@/components/teams/variants/team-details-variant-b";

export const Route = createFileRoute("/_protected/dev/team-details-variant-b")({
  component: TeamDetailsVariantBPage,
});

function TeamDetailsVariantBPage() {
  return <TeamDetailsVariantB />;
}
