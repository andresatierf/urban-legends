"use client";

import { CreateTournamentTeamForm } from "@/components/teams/create-tournament-team-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use } from "react";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { SectionHeader } from "@/components/section-header";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function AddTeamPage({ params }: Props) {
  const { tournamentId } = use(params);

  return (
    <>
      <SectionHeader as="h1" text="Create Tournament Team">
        <Link href={`/admin/tournaments/${tournamentId}`}>
          <Button variant="outline">← Back</Button>
        </Link>
      </SectionHeader>

      <CreateTournamentTeamForm tournamentId={tournamentId} />
    </>
  );
}
