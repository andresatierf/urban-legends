"use client";

import { SectionHeader } from "@/components/section-header";
import { TableSection } from "@/components/table-section";
import { TeamDetailsCard } from "@/components/teams/team-details-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ teamId: Id<"teams"> }>;
};

export default function TeamDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const team = useQuery(api.teams.getById, {
    id: resolvedParams.teamId,
  });

  if (!team) return null; // TODO: Add skeleton

  return (
    <>
      <SectionHeader as="h1" text="Team Details">
        <div className="flex gap-3">
          <Link href={`/tournaments/${team?.tournamentId}`}>
            <Button variant="secondary">🏆 View Tournament</Button>
          </Link>
          <Link href="/teams">
            <Button variant="outline">← Back to My Teams</Button>
          </Link>
        </div>
      </SectionHeader>

      <TeamDetailsCard team={team} />

      <TableSection
        title="Members"
        columns={[
          {
            key: "user.email",
            title: "Member",
            rowClassName: "text-gray-800",
          },
          {
            key: "role",
            title: "Role",
            className: "text-right",
            rowClassName: "text-gray-500",
          },
        ]}
        rows={team.members}
        emptyMessage="No members yet."
      />
    </>
  );
}
