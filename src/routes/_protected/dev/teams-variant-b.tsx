import { createFileRoute } from "@tanstack/react-router";

import { TeamListingVariantB } from "@/components/teams/team-listing-variant-b";

export const Route = createFileRoute("/_protected/dev/teams-variant-b")({
  component: TeamsVariantBPage,
});

function TeamsVariantBPage() {
  return <TeamListingVariantB />;
}
