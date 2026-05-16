import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { TournamentDetailsLayout } from "@/components/tournaments/details";
import { PageSkeleton } from "@/components/ui/page-skeleton";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/tournaments/$tournamentId/")({
  component: TournamentDetailsPage,
});

function TournamentDetailsPage() {
  const { tournamentId } = Route.useParams();

  const data = useQuery(api.tournaments.getDetails, {
    tournamentId: tournamentId as Id<"tournaments">,
  });

  if (!data) {
    return <PageSkeleton headerTitle="Tournament Details" sections={3} />;
  }

  return (
    <TournamentDetailsLayout
      data={data}
      tournamentId={tournamentId as Id<"tournaments">}
    />
  );
}
