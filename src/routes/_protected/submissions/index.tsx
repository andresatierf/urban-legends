import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { SectionHeader } from "@/components/section-header";
import {
  SubmissionListing,
  SubmissionListingSkeleton,
} from "@/components/submissions/listing/layout";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/submissions/")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { user } = useUser();
  const authority = useQuery(api.submissions.getAuthority, {});

  if (!user || authority === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Submissions" />
        <SubmissionListingSkeleton />
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Submissions" />
      <SubmissionListing user={user} authority={authority} />
    </>
  );
}
