import { createFileRoute } from "@tanstack/react-router";

import { VariantC } from "@/components/tournament-details-demo/variant-c";

export const Route = createFileRoute("/_protected/dev/tournament-details-c")({
  component: TournamentDetailsVariantCPage,
});

function TournamentDetailsVariantCPage() {
  return <VariantC />;
}
