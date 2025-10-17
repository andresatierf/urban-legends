"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { TableSection } from "@/components/table-section";

type Props = {
  params: Promise<{ teamId: Id<"teams"> }>;
};

export default function TeamDetailsPage({ params }: Props) {
  const { teamId } = use(params);
  const team = useQuery(api.teams.getById, { id: teamId });

  if (!team) return null; // TODO: Add skeleton

  console.log(team);

  return (
    <>
      <SectionHeader as="h1" text="Team Details">
        <div>
          <Link href={`/admin/tournaments/${team.tournamentId}`}>
            <Button variant="secondary">🏆 Go to Tournament</Button>
          </Link>
          <Link href="/admin/teams">
            <Button variant="outline">← Back to Teams</Button>
          </Link>
        </div>
      </SectionHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-gray-700">
              <strong>Tournament:</strong> {team.tournament?.name}
            </p>
            <p className="text-gray-700">
              <strong>Score:</strong>{" "}
              <span className="font-semibold text-blue-600">{team.score}</span>
            </p>
          </div>

          <div className="flex gap-3 pt-4 justify-end">
            <Button>Edit</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>

      <TableSection
        title="Team Members New"
        actions={
          <Link href={`/admin/teams/${team._id}/members/new`}>
            <Button variant="outline" size="sm">
              + Add Member
            </Button>
          </Link>
        }
        columns={[
          { key: "user.email", name: "Name", color: "text-gray-800" },
          { key: "role", name: "Role", align: "right", color: "text-gray-600" },
        ]}
        rows={team.members}
        emptyMessage="No members yet."
      />
    </>
  );
}
