import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { SectionHeader } from "@/components/section-header";
import {
  SubmissionReviewListing,
  SubmissionReviewListingSkeleton,
} from "@/components/submissions/listing/review-layout";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/submissions/review")({
  component: SubmissionReviewPage,
});

function SubmissionReviewPage() {
  const authority = useQuery(api.submissions.getAuthority, {});

  if (authority === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Submission Review" />
        <SubmissionReviewListingSkeleton />
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Submission Review" />
      <SubmissionReviewListing authority={authority} />
    </>
  );
}
