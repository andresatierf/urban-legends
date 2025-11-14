"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { UpsertTeamFormDialog } from "@/components/form/upsert-team-form";
import { UpsertTournamentFormDialog } from "@/components/form/upsert-tournament-form";
import { SectionHeader } from "@/components/section-header";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { Card, CardContent } from "@/components/ui/card";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
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
        <CardGridSkeleton
          count={6}
          className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2"
        />
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
          <div className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2">
            {userTournaments && userTournaments.length !== 0 ? (
              userTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament._id}
                  tournament={tournament}
                  teamCount={teamCount.get(tournament._id) ?? 0}
                />
              ))
            ) : (
              <Card>
                <CardContent>
                  <Empty className="gap-3 py-2!">
                    <EmptyHeader>No tournaments yet</EmptyHeader>
                    <EmptyDescription>
                      Join a team to start playing in tournaments or create your
                      own.
                    </EmptyDescription>
                    <EmptyContent>
                      <UpsertTeamFormDialog />
                    </EmptyContent>
                  </Empty>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <SectionHeader title="All Tournaments" />
      <div className="grid min-w-max grid-cols-1 gap-2 xl:grid-cols-2">
        {allTournaments && allTournaments.length !== 0 ? (
          allTournaments.map((tournament) => (
            <TournamentCard
              key={tournament._id}
              tournament={tournament}
              teamCount={teamCount.get(tournament._id) ?? 0}
            />
          ))
        ) : (
          <Card>
            <CardContent>
              <Empty className="gap-3 py-2!">
                <EmptyHeader>No tournaments yet</EmptyHeader>
                <EmptyDescription>
                  Please contact your tournament organizer to create a
                  tournament
                </EmptyDescription>
                <EmptyContent></EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
