import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { z } from "zod";

import { ActivityDetailsLayout } from "@/components/activities/details/layout";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const searchSchema = z.object({
  from: z.enum(["review"]).optional(),
});

export const Route = createFileRoute("/_protected/activities/$activityId")({
  component: ActivityDetailsPage,
  validateSearch: searchSchema,
});

function ActivityDetailsPage() {
  const { activityId } = Route.useParams();
  const { from } = Route.useSearch();
  const data = useQuery(
    api.activities.getDetails,
    activityId ? { activityId: activityId as Id<"activities"> } : "skip",
  );

  if (!data) {
    return <Skeleton className="h-screen w-full" />;
  }

  const backTo = from === "review" ? "/activities/review" : "/activities";

  return <ActivityDetailsLayout data={data} backTo={backTo} />;
}
