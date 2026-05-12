import { Clock } from "lucide-react";

import type { Doc } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";
import { managedByLabel } from "../review/submission-review-card-shared";

function formatDate(input: string | number): string {
  return new Date(input).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  submission: Doc<"submissions">;
  managedByUser: UserWithRoles | null;
};

export function ReviewTimeline({ submission, managedByUser }: Props) {
  const reviewedLabel = managedByUser
    ? managedByLabel(submission.state)
    : "Awaiting review";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        Review timeline
      </div>
      <div className="text-muted-foreground space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Submitted</span>
          <span>{formatDate(submission._creationTime)}</span>
        </div>
        <div className="flex justify-between">
          <span>{reviewedLabel}</span>
          <span>{managedByUser?.name ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}
