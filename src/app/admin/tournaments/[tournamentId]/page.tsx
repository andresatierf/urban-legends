"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use, useMemo } from "react";
import { TournamentDetailsCard } from "@/app/tournaments/tournament-details-card";
import { SectionHeader } from "@/components/section-header";
import { DataTableSection } from "@/components/table-section";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const { tournamentId } = use(params);

  const tournament = useQuery(
    api.tournaments.getById,
    tournamentId ? { tournamentId } : "skip",
  );
  const teams = useQuery(
    api.teams.listByTournament,
    tournamentId ? { tournamentId } : "skip",
  );

  const columns: ColumnDef<NonNullable<typeof teams>[number]>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Team",
        cell: (props) => (
          <div className="font-medium text-gray-800">
            {props.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "points",
        header: () => <div className="text-right">Points</div>,
        cell: (props) => (
          <div className="text-right font-semibold text-blue-600">
            {(props.getValue() as string) || 0} pts
          </div>
        ),
      },
    ],
    [],
  );

  if (!tournament) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Tournament Details">
        <Button href="/admin/tournaments" variant="outline">
          ← Back
        </Button>
      </SectionHeader>

      <TournamentDetailsCard tournament={tournament} enableActions />

      <DataTableSection
        title="Teams"
        actions={
          <Button
            href={`/admin/tournaments/${tournament._id}/teams/new`}
            variant="outline"
            size="sm"
          >
            + Add Team
          </Button>
        }
        columns={columns}
        data={teams ?? []}
        emptyMessage="No teams added yet."
        enableSearch
      />
    </>
  );
}
