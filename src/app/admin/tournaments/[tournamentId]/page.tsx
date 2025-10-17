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

      <SectionHeader text="Teams">
        <Link href={`/admin/tournaments/${tournament._id}/teams/new`}>
          <Button variant="outline" size="sm">
            + Add Team
          </Button>
        </Link>
      </SectionHeader>

      <Card className="overflow-clip">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            <TableRow>
              <TableHead className="p-3">Team</TableHead>
              <TableHead className="p-3 text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {"teams" in tournament && tournament.teams.length > 0 ? (
              tournament.teams.map((team) => (
                <TableRow
                  key={team._id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <Link href={`/admin/teams/${team._id}`}>
                    <TableCell className="p-3 font-medium text-gray-800">
                      {team.name}
                    </TableCell>
                  </Link>
                  <TableCell className="p-3 text-right font-semibold text-blue-600">
                    {team.points || 0} pts
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No teams added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
