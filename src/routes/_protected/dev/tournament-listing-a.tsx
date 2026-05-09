import { createFileRoute } from "@tanstack/react-router";

import { TournamentListingVariantA } from "@/components/tournaments/tournament-listing-variant-a";
import { TournamentListingVariantNav } from "@/components/tournaments/tournament-listing-variant-nav";

export const Route = createFileRoute("/_protected/dev/tournament-listing-a")({
  component: TournamentListingAPage,
});

function TournamentListingAPage() {
  return (
    <>
      <TournamentListingVariantNav />
      <TournamentListingVariantA />
    </>
  );
}
