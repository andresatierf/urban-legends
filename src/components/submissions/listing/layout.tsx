import { Skeleton } from "@/components/ui/skeleton";

import type { UserWithRoles } from "../../../../convex/users";
import { ManagementSection } from "./management-section";
import { PlayerSection } from "./player-section";
import { ReviewSection } from "./review-section";

type Authority = {
  canReview: boolean;
  canManage: boolean;
  isPlayer: boolean;
};

type Props = {
  user: UserWithRoles;
  authority: Authority;
};

export function SubmissionListing({ user, authority }: Props) {
  const { canReview, canManage, isPlayer } = authority;
  const hasAnyRole = canManage || canReview || isPlayer;

  return (
    <div className="space-y-8">
      {canManage && <ManagementSection />}

      {canReview && !canManage && <ReviewSection />}

      {isPlayer && (
        <PlayerSection user={user} showSectionHeader={canManage || canReview} />
      )}

      {!hasAnyRole && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Join a tournament team to start submitting activities.
          </p>
        </div>
      )}
    </div>
  );
}

export function SubmissionListingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-44 rounded-full" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
