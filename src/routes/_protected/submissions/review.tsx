import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (
      authority &&
      !authority.canReview &&
      !authority.canManage &&
      authority.isPlayer
    ) {
      navigate({ to: "/submissions/mine", replace: true });
    }
  }, [authority, navigate]);

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
