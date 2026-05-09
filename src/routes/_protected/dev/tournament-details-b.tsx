import { createFileRoute } from "@tanstack/react-router";

import { VariantB } from "@/components/tournament-details-demo/variant-b";

export const Route = createFileRoute("/_protected/dev/tournament-details-b")({
  component: TournamentDetailsVariantBPage,
});

function TournamentDetailsVariantBPage() {
  return <VariantB />;
}
