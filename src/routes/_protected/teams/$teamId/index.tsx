import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { TeamDetailsLayout } from "@/components/teams/details/layout";
import { PageSkeleton } from "@/components/ui/page-skeleton";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/teams/$teamId/")({
  component: TeamDetailsPage,
});

function TeamDetailsPage() {
  const { teamId } = Route.useParams();

  const data = useQuery(api.teams.getDetails, {
    teamId: teamId as Id<"teams">,
  });

  if (!data) {
    return <PageSkeleton headerTitle="Team Details" sections={3} />;
  }

  return <TeamDetailsLayout data={data} />;
}
