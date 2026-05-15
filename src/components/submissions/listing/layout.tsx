import { Skeleton } from "@/components/ui/skeleton";

import type { UserWithRoles } from "../../../../convex/users";
import { PlayerSection } from "./player-section";

type Props = {
  user: UserWithRoles;
};

export function MySubmissionsListing({ user }: Props) {
  return <PlayerSection user={user} />;
}

export function MySubmissionsListingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-44 rounded-full" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
