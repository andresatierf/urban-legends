"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function UserTeamsPage() {
  const teams = useQuery(api.teams.listByUser);

  return (
    <>
      <PageHeader title="My Teams">
        <Link href="/tournaments">
          <Button variant="outline">🏆 View Tournaments</Button>
        </Link>
      </PageHeader>

      {teams?.length && teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams?.map((team) => (
            <div
              key={team._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-xl">
                  {team.name}
                </h2>
                <span className="font-medium text-blue-600 text-sm">
                  {team?.score || 0} pts
                </span>
              </div>

              <p className="mb-2 text-gray-600 text-sm">
                {team.tournament.name}
              </p>

              <div className="mb-3 text-gray-700 text-sm">
                <strong>Members:</strong>{" "}
                {team.members
                  .map((m) => m.email)
                  .slice(0, 3)
                  .join(", ")}
                {team.members.length > 3 && "…"}
              </div>

              <Link href={`/teams/${team._id}`}>
                <Button variant="secondary" size="sm" className="w-full">
                  View Team
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center text-gray-500 italic">
          You’re not part of any team yet.
        </div>
      )}
    </>
  );
}
