import { createFileRoute } from "@tanstack/react-router";

import { SectionHeader } from "@/components/section-header";
import {
  MySubmissionsListing,
  MySubmissionsListingSkeleton,
} from "@/components/submissions/listing/layout";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_protected/submissions/")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { user } = useUser();

  if (!user) {
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
