import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { SubmissionDetailsLayout } from "@/components/submissions/details/layout";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/submissions/$submissionId")({
  component: SubmissionDetailsPage,
});

function SubmissionDetailsPage() {
  const { submissionId } = Route.useParams();
  const data = useQuery(
    api.submissions.getDetails,
    submissionId ? { submissionId: submissionId as Id<"submissions"> } : "skip",
  );

  if (!data) {
    return <Skeleton className="h-screen w-full" />;
  }

  return <SubmissionDetailsLayout data={data} />;
}
