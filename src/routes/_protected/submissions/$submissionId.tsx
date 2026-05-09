import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { SubmissionDetailsCard } from "@/components/submissions/submission-details-card";
import { SubmitterInfo } from "@/components/submissions/submitter-info";
import { Button } from "@/components/ui/button";
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
    return <SubmissionDetailsPageSkeleton />;
  }

  return (
    <>
      <SectionHeader as="h1" title="Submission Details">
        <Button variant="outline" asChild>
          <Link to="/submissions">
            <ArrowLeft />
            Back to Submissions
          </Link>
        </Button>
      </SectionHeader>

      <SubmissionDetailsCard data={data} />

      <SectionHeader title="Participants" />
      <SubmitterInfo submitter={data.submitter} teammates={data.teammates} />
    </>
  );
}

function SubmissionDetailsPageSkeleton() {
  return (
    <>
      <SectionHeader as="h1" title="Submission Details">
        <Button variant="outline" asChild>
          <Link to="/submissions">
            <ArrowLeft />
            Back to Submissions
          </Link>
        </Button>
      </SectionHeader>
      <Skeleton className="h-96 w-full" />

      <SectionHeader title="Participants" />
      <Skeleton className="h-64 w-full" />
    </>
  );
}
