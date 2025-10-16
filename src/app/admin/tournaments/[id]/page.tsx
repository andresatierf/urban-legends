"use client";

import { PageHeader } from "@/components/page-header";
import { TournamentDetailsCard } from "@/components/tournaments/tournament-details";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { SectionHeader } from "@/components/section-header";

type Props = {
  params: Promise<{ id: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const tournament = useQuery(api.tournaments.getById, {
    id: resolvedParams.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tournament Details">
        <Link href="/admin/tournaments">
          <Button variant="outline">← Back</Button>
        </Link>
      </PageHeader>

      <TournamentDetailsCard tournament={tournament} />

      <SectionHeader text="Teams">
        <Button variant="outline" size="sm">
          + Add Team
        </Button>
      </SectionHeader>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="p-3">Team</th>
              <th className="p-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {tournament?.teams?.length > 0 ? (
              tournament?.teams?.map((team) => (
                <tr
                  key={team.id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <td className="p-3 font-medium text-gray-800">{team.name}</td>
                  <td className="p-3 text-right font-semibold text-blue-600">
                    {team.points}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="p-4 text-center text-gray-500 italic"
                >
                  No teams added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
