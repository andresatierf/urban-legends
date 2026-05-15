import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { SectionHeader } from "@/components/section-header";
import { MySubmissionsListingSkeleton } from "@/components/submissions/listing/layout";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/submissions/")({
  component: SubmissionsRedirectPage,
});

function SubmissionsRedirectPage() {
  const authority = useQuery(api.submissions.getAuthority, {});
  const navigate = useNavigate();

  useEffect(() => {
    if (!authority) return;
    if (authority.canManage || authority.canReview) {
      navigate({ to: "/submissions/review", replace: true });
    } else if (authority.isPlayer) {
      navigate({ to: "/submissions/mine", replace: true });
    }
  }, [authority, navigate]);

  if (
    authority &&
    !authority.canManage &&
    !authority.canReview &&
    !authority.isPlayer
  ) {
    return (
      <>
        <SectionHeader as="h1" title="Submissions" />
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Join a tournament team to start submitting activities.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Submissions" />
      <MySubmissionsListingSkeleton />
    </>
  );
}
