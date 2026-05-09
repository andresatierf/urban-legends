import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { TournamentDetailsLayout } from "@/components/tournaments/tournament-details-layout";
import { Button } from "@/components/ui/button";
import { DetailsCardSkeleton } from "@/components/ui/details-card-skeleton";

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

  return (
    <>
      <SectionHeader as="h1" title="Tournament Details">
        <Button variant="outline" asChild>
          <Link to="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      {data ? (
        <TournamentDetailsLayout
          data={data}
          tournamentId={tournamentId as Id<"tournaments">}
        />
      ) : (
        <DetailsCardSkeleton detailsCount={6} />
      )}
    </>
  );
}
