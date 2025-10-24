"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { CreateTournamentTeamForm } from "@/components/teams/create-tournament-team-form";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function AddTeamPage({ params }: Props) {
  const { tournamentId } = use(params);
  const tournament = useQuery(
    api.tournaments.getById,
    tournamentId ? { tournamentId } : "skip",
  );

  if (!tournament) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader
        as="h1"
        title={`Create Team in ${tournament?.name || "Tournament"}`}
      >
        <Button href={`/admin/tournaments/${tournamentId}`} variant="outline">
          ← Back
        </Button>
      </SectionHeader>

      <CreateTournamentTeamForm tournamentId={tournamentId} />
    </>
  );
}
