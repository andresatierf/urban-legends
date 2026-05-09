import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { TeamStatisticsCard } from "@/components/teams/team-statistics-card";
import { Button } from "@/components/ui/button";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/teams/$teamId/statistics")({
  component: TeamStatisticsPage,
});

function TeamStatisticsPage() {
  const { teamId } = Route.useParams();

  const team = useQuery(
    api.teams.get,
    teamId ? { teamId: teamId as Id<"teams"> } : "skip",
  );

  if (!team) return null;

  return (
    <>
      <SectionHeader as="h1" title={`${team.name} - Statistics`}>
        <Button variant="outline" asChild>
          <Link to="/teams/$teamId" params={{ teamId }}>
            <ArrowLeft />
            Back to Team
          </Link>
        </Button>
      </SectionHeader>

      <TeamStatisticsCard teamId={teamId as Id<"teams">} />
    </>
  );
}
