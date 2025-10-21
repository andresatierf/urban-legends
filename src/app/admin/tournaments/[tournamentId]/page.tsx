"use client";

import { SectionHeader } from "@/components/section-header";
import { TournamentDetailsCard } from "@/components/tournaments/tournament-details-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { TableSection } from "@/components/table-section";

type Props = {
  params: Promise<{ tournamentId: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const tournament = useQuery(api.tournaments.getById, {
    id: resolvedParams.tournamentId,
    withTeams: true,
  });

  if (!tournament) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" text="Tournament Details">
        <Link href="/admin/tournaments">
          <Button variant="outline">← Back</Button>
        </Link>
      </SectionHeader>

      <TournamentDetailsCard tournament={tournament} />

      <TableSection
        title="Teams"
        actions={
          <Link href={`/admin/tournaments/${tournament._id}/teams/new`}>
            <Button variant="outline" size="sm">
              + Add Team
            </Button>
          </Link>
        }
        columns={[
          {
            key: "name",
            title: "Team",
            rowClassName: "font-medium text-gray-800",
          },
          {
            key: "points",
            title: "Points",
            defaultValue: 0,
            format: (v) => `${v} pts`,
            className: "text-right",
            rowClassName: "font-semibold text-blue-600",
          },
        ]}
        rows={"teams" in tournament ? tournament.teams : []}
        emptyMessage="No teams added yet."
      />
    </>
  );
}
