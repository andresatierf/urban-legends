import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { SectionHeader } from "@/components/section-header";
import {
  MySubmissionsListing,
  MySubmissionsListingSkeleton,
} from "@/components/submissions/listing/layout";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/submissions/mine")({
  component: MySubmissionsPage,
});

function MySubmissionsPage() {
  const { user } = useUser();
  const authority = useQuery(api.submissions.getAuthority, {});
  const navigate = useNavigate();

  useEffect(() => {
    if (
      authority &&
      !authority.isPlayer &&
      (authority.canReview || authority.canManage)
    ) {
      navigate({ to: "/submissions/review", replace: true });
    }
  }, [authority, navigate]);

  if (!user || authority === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="My Submissions" />
        <MySubmissionsListingSkeleton />
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="My Submissions" />
      <MySubmissionsListing user={user} />
    </>
  );
}
