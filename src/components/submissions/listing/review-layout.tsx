import { Link } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";

import { ManagementSection } from "./management-section";
import { ReviewSection } from "./review-section";

type Authority = {
  canReview: boolean;
  canManage: boolean;
};

type Props = {
  authority: Authority;
};

export function SubmissionReviewListing({ authority }: Props) {
  const { canReview, canManage } = authority;

  if (!canManage && !canReview) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          You don't have reviewer permissions. Looking for{" "}
          <Link to="/submissions" className="text-foreground underline">
            your submissions
          </Link>
          ?
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {canManage && <ManagementSection />}
      {canReview && !canManage && <ReviewSection />}
    </div>
  );
}

export function SubmissionReviewListingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-44 rounded-full" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
