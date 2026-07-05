import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/activities/")({
  component: ActivitiesRedirectPage,
});

function ActivitiesRedirectPage() {
  const authority = useQuery(api.activities.getAuthority, {});
  const navigate = useNavigate();

  useEffect(() => {
    if (!authority) return;
    if (authority.canManage || authority.canReview) {
      navigate({ to: "/activities/review", replace: true });
    } else if (authority.isPlayer) {
      navigate({ to: "/activities/mine", replace: true });
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
        <SectionHeader as="h1" title="Activities" />
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Join a tournament team to start creating activities.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="Activities" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </>
  );
}
