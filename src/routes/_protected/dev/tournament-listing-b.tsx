import { createFileRoute } from "@tanstack/react-router";

import { TournamentListingVariantB } from "@/components/tournaments/tournament-listing-variant-b";
import { TournamentListingVariantNav } from "@/components/tournaments/tournament-listing-variant-nav";

export const Route = createFileRoute("/_protected/dev/tournament-listing-b")({
  component: TournamentListingBPage,
});

function TournamentListingBPage() {
  return (
    <>
      <TournamentListingVariantNav />
      <TournamentListingVariantB />
    </>
  );
}
