"use client";

import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { TeamDetailsCard } from "@/components/teams/team-details-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";

type Props = {
  params: Promise<{ id: Id<"teams"> }>;
};

export default function TeamDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const team = useQuery(api.teams.getById, {
    id: resolvedParams.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Team Details">
        <div className="flex gap-3">
          <Link href={`/tournaments/${team?.tournamentId}`}>
            <Button variant="secondary">🏆 View Tournament</Button>
          </Link>
          <Link href="/teams">
            <Button variant="outline">← Back to My Teams</Button>
          </Link>
        </div>
      </PageHeader>

      <TeamDetailsCard team={team} />

      <SectionHeader text="Members">
        <Button variant="outline" size="sm">
          + Add Member
        </Button>
      </SectionHeader>
      <Card className="overflow-clip">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            <TableRow>
              <TableHead className="p-3">Member</TableHead>
              <TableHead className="p-3 text-right">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team?.members?.length > 0 ? (
              team?.members?.map((member, idx) => (
                <TableRow
                  key={member}
                  className="border-t transition hover:bg-gray-50"
                >
                  <TableCell className="p-3 text-gray-800">{member}</TableCell>
                  <TableCell className="p-3 text-right text-gray-500">
                    {idx === 0 ? "Team Lead" : "Member"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No members added yet.
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end gap-3">
        <Button>Edit Team</Button>
        <Button variant="destructive">Delete Team</Button>
      </div>
    </div>
  );
}
