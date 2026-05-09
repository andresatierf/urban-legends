import { createFileRoute } from "@tanstack/react-router";

import { TournamentListingVariantC } from "@/components/tournaments/tournament-listing-variant-c";
import { TournamentListingVariantNav } from "@/components/tournaments/tournament-listing-variant-nav";

export const Route = createFileRoute("/_protected/dev/tournament-listing-c")({
  component: TournamentListingCPage,
});

function TournamentListingCPage() {
  return (
    <>
      <TournamentListingVariantNav />
      <TournamentListingVariantC />
    </>
  );
}
