"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SectionHeader } from "@/components/section-header";
import { TeamStatisticsCard } from "@/components/teams/team-statistics-card";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type Props = {
  params: Promise<{ teamId: Id<"teams"> }>;
};

export default function TeamStatisticsPage({ params }: Props) {
  const { teamId } = use(params);

  const team = useQuery(api.teams.get, teamId ? { teamId } : "skip");

  if (!team) return null;

  return (
    <>
      <SectionHeader as="h1" title={`${team.name} - Statistics`}>
        <Button variant="outline" asChild>
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft />
            Back to Team
          </Link>
        </Button>
      </SectionHeader>

      <TeamStatisticsCard teamId={teamId} />
    </>
  );
}
