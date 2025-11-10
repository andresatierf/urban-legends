"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { UpsertTeamFormDialog } from "@/components/form/upsert-team-form";
import { UpsertTournamentFormButton } from "@/components/form/upsert-tournament-form-button";
import { SectionHeader } from "@/components/section-header";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { Card, CardContent } from "@/components/ui/card";
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

  const userTournaments =
    useQuery(api.tournaments.list, { userId: user?._id }) || [];
  const allTournaments = useQuery(api.tournaments.list, {}) || [];

  const teams = useQuery(api.teams.list, {}) || [];
  const teamCount = useMemo(() => {
    return teams.reduce<Map<Id<"tournaments">, number>>((acc, team) => {
      if (!acc.has(team.tournamentId)) acc.set(team.tournamentId, 0);
      acc.set(team.tournamentId, (acc.get(team.tournamentId) ?? 0) + 1);
      return acc;
    }, new Map());
  }, [teams]);

  if (!userTournaments) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Tournaments">
        {isAdmin && <UpsertTournamentFormButton />}
      </SectionHeader>

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
              <Empty>
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
            <CardContent className="py-12">
              <Empty>
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
