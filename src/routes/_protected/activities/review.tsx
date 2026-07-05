import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { ActivityReviewerQueue } from "@/components/activities/review/queue";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/activities/review")({
  component: ActivityReviewPage,
});

function ActivityReviewPage() {
  const authority = useQuery(api.activities.getAuthority, {});
  const navigate = useNavigate();

  useEffect(() => {
    if (
      authority &&
      !authority.canReview &&
      !authority.canManage &&
      authority.isPlayer
    ) {
      navigate({ to: "/activities/mine", replace: true });
    }
  }, [authority, navigate]);

  if (authority === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="Activity Review" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </>
    );
  }

  if (!authority.canReview && !authority.canManage) {
    return (
      <>
        <SectionHeader as="h1" title="Activity Review" />
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            You don't have reviewer permissions.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Activity Review" />
      <ActivityReviewerQueue />
    </>
  );
}
