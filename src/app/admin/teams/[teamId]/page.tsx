"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use, useMemo } from "react";
import { SectionHeader } from "@/components/section-header";
import { DataTableSection } from "@/components/table-section";
import { TeamDetailsCard } from "@/components/teams/team-details-card";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ teamId: Id<"teams"> }>;
};

export default function TeamDetailsPage({ params }: Props) {
  const { teamId } = use(params);
  const team = useQuery(api.teams.getById, teamId ? { teamId } : "skip");
  const tournament = useQuery(
    api.tournaments.getById,
    team ? { tournamentId: team.tournamentId } : "skip",
  );
  const members = useQuery(
    api.teams.listTeamMembers,
    teamId ? { teamId } : "skip",
  );

  const columns: ColumnDef<NonNullable<typeof members>[number]>[] = useMemo(
    () => [
      { id: "name", accessorKey: "email", header: "Name" },
      {
        accessorKey: "role",
        header: () => <div className="text-right">Role</div>,
        // header: "Role",
        cell: (props) => (
          <div className="text-right text-gray-600">
            {props.getValue() as string}
          </div>
        ),
      },
    ],
    [],
  );

  if (!team || !tournament || !members) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Team Details">
        <Button
          href={`/admin/tournaments/${team.tournamentId}`}
          variant="secondary"
        >
          🏆 Go to Tournament
        </Button>
        <Button href="/admin/teams" variant="outline">
          ← Back to Teams
        </Button>
      </SectionHeader>

      <TeamDetailsCard team={team} tournament={tournament} enableActions />

      <DataTableSection
        title="Members"
        actions={
          <Button
            href={`/admin/teams/${team._id}/members/new`}
            variant="outline"
            size="sm"
          >
            + Add Member
          </Button>
        }
        columns={columns}
        data={members}
        emptyMessage="No members yet."
      />
    </>
  );
}
