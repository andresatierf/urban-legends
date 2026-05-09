import { createFileRoute } from "@tanstack/react-router";

import { TeamListingVariantC } from "@/components/teams/team-listing-variant-c";

export const Route = createFileRoute("/_protected/dev/teams-variant-c")({
  component: TeamsVariantCPage,
});

function TeamsVariantCPage() {
  return <TeamListingVariantC />;
}
