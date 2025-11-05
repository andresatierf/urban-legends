"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "../../../../../convex/_generated/api";

export default function TeamsPage() {
  const teams = useQuery(api.teams.list, {});

  if (!teams) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" title="Teams">
        {/* <Button variant="outline" asChild> */}
        {/*   <Link href="/admin">Add New Team</Link> */}
        {/* </Button> */}
      </SectionHeader>

      <SectionHeader title="All Teams" />

      <Card className="overflow-clip">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="bg-gray-50 text-gray-600 text-sm uppercase">
            <TableRow>
              <TableHead className="p-3">Team</TableHead>
              <TableHead className="p-3">Tournament</TableHead>
              <TableHead className="p-3 text-right">Score</TableHead>
              <TableHead className="p-3 text-center">Members</TableHead>
              <TableHead className="p-3 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length > 0 ? (
              teams.map((team) => (
                <TableRow
                  key={team._id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <TableCell className="p-3 font-medium text-gray-800">
                    {team.name}
                  </TableCell>
                  <TableCell className="p-3 text-gray-600">
                    {team.tournament?.name}
                  </TableCell>
                  <TableCell className="p-3 text-right font-semibold text-blue-600">
                    {team.score || 0}
                  </TableCell>
                  <TableCell className="p-3 text-center text-gray-600">
                    {team.members?.length || 0}
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/admin/teams/${team._id}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No teams available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
