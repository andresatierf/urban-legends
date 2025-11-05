"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useMemo } from "react";
import { DataTableSection } from "@/components/data-table-section";
import { SectionHeader } from "@/components/section-header";
import { TournamentDetailsCard } from "@/components/tournaments/tournament-details-card";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const user = useQuery(api.users.current);
  const roles = useQuery(
    api.roles.getByUserId,
    user ? { userId: user?._id } : "skip",
  );

  const isAdmin = roles?.includes("admin");

  const { tournamentId } = use(params);

  const tournament = useQuery(
    api.tournaments.get,
    tournamentId ? { tournamentId } : "skip",
  );
  const teams = useQuery(
    api.teams.list,
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
        <Button variant="outline" asChild>
          <Link href="/tournaments">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <TournamentDetailsCard
        tournament={tournament}
        enableActions={isAdmin}
        users={[]}
      />

      <DataTableSection
        title="Teams"
        columns={columns}
        data={teams || []}
        emptyMessage="No teams added yet."
      />
    </>
  );
}
