import { createFileRoute } from "@tanstack/react-router";

import { VariantA } from "@/components/tournament-details-demo/variant-a";

export const Route = createFileRoute("/_protected/dev/tournament-details-a")({
  component: TournamentDetailsVariantAPage,
});

function TournamentDetailsVariantAPage() {
  return <VariantA />;
}
