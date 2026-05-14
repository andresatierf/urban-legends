import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { z } from "zod";

import { SubmissionDetailsLayout } from "@/components/submissions/details/layout";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const searchSchema = z.object({
  from: z.enum(["review"]).optional(),
});

export const Route = createFileRoute("/_protected/submissions/$submissionId")({
  component: SubmissionDetailsPage,
  validateSearch: searchSchema,
});

function SubmissionDetailsPage() {
  const { submissionId } = Route.useParams();
  const { from } = Route.useSearch();
  const data = useQuery(
    api.submissions.getDetails,
    submissionId ? { submissionId: submissionId as Id<"submissions"> } : "skip",
  );

  if (!data) {
    return <Skeleton className="h-screen w-full" />;
  }

  const backTo = from === "review" ? "/submissions/review" : "/submissions";

  return <SubmissionDetailsLayout data={data} backTo={backTo} />;
}
