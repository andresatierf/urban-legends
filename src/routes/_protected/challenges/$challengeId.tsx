import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { ChallengeDetailsLayout } from "@/components/challenges";
import { PageSkeleton } from "@/components/ui/page-skeleton";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/challenges/$challengeId")({
  component: ChallengeDetailsPage,
});

function ChallengeDetailsPage() {
  const { challengeId } = Route.useParams();
  const data = useQuery(api.views.challenges.getDetails, {
    challengeId: challengeId as Id<"challenges">,
  });

  if (!data) {
    return <PageSkeleton headerTitle="Challenge Details" sections={3} />;
  }

  return <ChallengeDetailsLayout data={data} />;
}
