import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import { UserDetailsLayout } from "@/components/users/details";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_protected/users/$userId/")({
  component: UserDetailsPage,
});

function UserDetailsPage() {
  const { userId } = Route.useParams();

  const data = useQuery(api.users.getDetails, {
    userId: userId as Id<"users">,
  });

  if (!data) {
    return <PageSkeleton headerTitle="Player Details" sections={2} />;
  }

  return <UserDetailsLayout data={data} />;
}
