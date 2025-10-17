"use client";

import { CreateTournamentTeamForm } from "@/components/teams/create-tournament-team-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use } from "react";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { SectionHeader } from "@/components/section-header";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function AddTeamPage({ params }: Props) {
  const { tournamentId } = use(params);
  const tournament = useQuery(api.tournaments.getById, {
    id: tournamentId,
  });

  return (
    <>
      <SectionHeader
        as="h1"
        text={`Create Team in ${tournament?.name || "Tournament"}`}
      >
        <Link href={`/admin/tournaments/${tournamentId}`}>
          <Button variant="outline">← Back</Button>
        </Link>
      </SectionHeader>

      <CreateTournamentTeamForm tournamentId={tournamentId} />
    </>
  );
}
