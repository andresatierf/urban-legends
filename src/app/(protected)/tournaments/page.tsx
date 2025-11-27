"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { UpsertTournamentFormDialog } from "@/components/form/upsert-tournament-form";
import { SectionHeader } from "@/components/section-header";
import { JoinTournamentCard } from "@/components/tournaments/join-tournament-card";
import {
  TournamentCard,
  TournamentCardSkeleton,
} from "@/components/tournaments/tournament-card";
import { CardGrid } from "@/components/ui/card-grid";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function TournamentsPage() {
  const { user, isAdmin } = useUser();

  const userTournamentsRaw = useQuery(api.tournaments.list, {
    userId: user?._id,
  });
  const allTournamentsRaw = useQuery(api.tournaments.list, {});

  const userTournaments = userTournamentsRaw || [];
  const allTournaments = allTournamentsRaw || [];

  const teams = useQuery(api.teams.list, {}) || [];
  const teamCount = useMemo(() => {
    return teams.reduce<Map<Id<"tournaments">, number>>((acc, team) => {
      if (!acc.has(team.tournamentId)) acc.set(team.tournamentId, 0);
      acc.set(team.tournamentId, (acc.get(team.tournamentId) ?? 0) + 1);
      return acc;
    }, new Map());
  }, [teams]);

  if (userTournamentsRaw === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Tournaments">
          {isAdmin && <UpsertTournamentFormDialog />}
        </SectionHeader>
        <CardGrid data={Array.from({ length: 6 })}>
          {(_, i) => <TournamentCardSkeleton key={i} />}
        </CardGrid>
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Tournaments">
        {isAdmin && <UpsertTournamentFormDialog />}
      </SectionHeader>

      {allTournaments && allTournaments.length !== 0 && (
        <>
          <SectionHeader title="Your Tournaments" />
          <CardGrid data={userTournaments} empty={<JoinTournamentCard />}>
            {(tournament) => (
              <TournamentCard
                key={tournament._id}
                tournament={tournament}
                teamCount={teamCount.get(tournament?._id) ?? 0}
              />
            )}
          </CardGrid>
        </>
      )}

      <SectionHeader title="All Tournaments" />
      <CardGrid data={allTournaments} empty=<JoinTournamentCard first />>
        {(tournament) => (
          <TournamentCard
            key={tournament._id}
            tournament={tournament}
            teamCount={teamCount.get(tournament._id) ?? 0}
          />
        )}
      </CardGrid>
    </>
  );
}
