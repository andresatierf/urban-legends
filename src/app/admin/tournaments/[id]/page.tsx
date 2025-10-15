"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { use } from "react";
import { PageHeader } from "@/components/page-header";

type Props = {
  params: Promise<{ id: Id<"tournaments"> }>;
};

export default function TournamentDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const tournament = useQuery(api.tournaments.getById, {
    id: resolvedParams.id,
  });

  return (
    <>
      <PageHeader title="Tournament Details">
        <Link href="/admin/tournaments">
          <Button variant="outline">← Back</Button>
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 text-xl">
          {tournament?.name}
        </h2>
        <div>
          <p className="text-gray-600 leading-relaxed">
            {tournament?.description || "No description available."}
          </p>
        </div>
        <div className="grid w-fit grid-cols-1 gap-4 sm:grid-cols-3">
          <p className="text-gray-700">
            <strong>Start Date:</strong> {tournament?.startDate}
          </p>
          <p className="text-gray-700">
            <strong>End Date:</strong> {tournament?.endDate}
          </p>
          <p className="text-gray-700">
            <strong>Participants:</strong>{" "}
            {tournament?.users?.length
              ? tournament?.users?.join(", ")
              : "No users assigned"}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button>Edit Tournament</Button>
          <Button variant="secondary">Manage Teams</Button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-lg">Teams</h2>
        <Button variant="outline" size="sm">
          + Add Team
        </Button>
      </div>

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
    </>
  );
}
