import { createFileRoute } from "@tanstack/react-router";

import { TeamListingVariantA } from "@/components/teams/team-listing-variant-a";

export const Route = createFileRoute("/_protected/dev/teams-variant-a")({
  component: TeamsVariantAPage,
});

function TeamsVariantAPage() {
  return <TeamListingVariantA />;
}
