import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { UpsertTournamentFormDialog } from "@/components/form/upsert-tournament-form";
import { SectionHeader } from "@/components/section-header";
import {
  TournamentWithAuthorityCard,
  TournamentWithAuthorityCardSkeleton,
} from "@/components/tournaments/tournament-with-authority-card";
import { Button } from "@/components/ui/button";
import { CardGrid } from "@/components/ui/card-grid";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/tournaments/")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const { canCreateTournament: canCreate } = useUser();
  const [includeEnded, setIncludeEnded] = useState(false);

  const data = useQuery(api.tournaments.listWithAuthority, { includeEnded });

  if (data === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Tournaments">
          {canCreate && <UpsertTournamentFormDialog />}
        </SectionHeader>
        <CardGrid data={Array.from({ length: 6 })}>
          {(_, i) => <TournamentWithAuthorityCardSkeleton key={i} />}
        </CardGrid>
      </>
    );
  }

  const { yours, discover } = data;
  const hasYours = yours.length > 0;
  const hasDiscover = discover.length > 0;
  const isEmpty = !hasYours && !hasDiscover;

  return (
    <>
      <SectionHeader as="h1" title="Tournaments">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeEnded((v) => !v)}
          >
            {includeEnded ? "Hide past tournaments" : "Show past tournaments"}
          </Button>
          {canCreate && <UpsertTournamentFormDialog />}
        </div>
      </SectionHeader>

      {isEmpty && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No tournaments yet</p>
          {canCreate && (
            <div className="mt-4">
              <UpsertTournamentFormDialog />
            </div>
          )}
        </div>
      )}

      {hasYours && (
        <>
          {hasDiscover && <SectionHeader title="Your Tournaments" />}
          <CardGrid data={yours}>
            {(tournament) => (
              <TournamentWithAuthorityCard
                key={tournament._id}
                tournament={tournament}
              />
            )}
          </CardGrid>
        </>
      )}

      {hasDiscover && (
        <>
          {hasYours && <SectionHeader title="Discover Tournaments" />}
          <CardGrid data={discover}>
            {(tournament) => (
              <TournamentWithAuthorityCard
                key={tournament._id}
                tournament={tournament}
              />
            )}
          </CardGrid>
        </>
      )}
    </>
  );
}
