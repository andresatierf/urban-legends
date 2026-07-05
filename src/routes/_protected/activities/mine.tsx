import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { MyActivitiesList } from "@/components/activities/listing/mine-list";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/activities/mine")({
  component: MyActivitiesPage,
});

function MyActivitiesPage() {
  const authority = useQuery(api.activities.getAuthority, {});
  const navigate = useNavigate();

  useEffect(() => {
    if (
      authority &&
      !authority.isPlayer &&
      (authority.canReview || authority.canManage)
    ) {
      navigate({ to: "/activities/review", replace: true });
    }
  }, [authority, navigate]);

  if (authority === undefined) {
    return (
      <>
        <SectionHeader as="h1" title="My Activities" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </>
    );
  }

  return (
    <>
      <SectionHeader as="h1" title="My Activities" />
      <MyActivitiesList />
    </>
  );
}
