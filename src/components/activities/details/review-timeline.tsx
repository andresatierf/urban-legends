import { Clock } from "lucide-react";

import type { Doc } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";
import { EmptyValue } from "../../ui/empty-value";
import { Eyebrow } from "../../ui/eyebrow";

function formatDate(input: string | number): string {
  return new Date(input).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function reviewedLabel(state: Doc<"activities">["state"]): string {
  if (state === "approved") return "Approved";
  if (state === "rejected") return "Rejected";
  if (state === "deleted") return "Deleted";
  if (state === "incomplete") return "Awaiting completion";
  return "Awaiting review";
}

type Props = {
  activity: Doc<"activities">;
  managedByUser: UserWithRoles | null;
};

export function ReviewTimeline({ activity, managedByUser }: Props) {
  let reviewedValue: React.ReactNode;
  if (!managedByUser) {
    reviewedValue = <EmptyValue label="Not yet reviewed" />;
  } else if (activity.reviewedAt) {
    reviewedValue = `${formatDate(activity.reviewedAt)} by ${managedByUser.name}`;
  } else {
    reviewedValue = `by ${managedByUser.name}`;
  }

  return (
    <div className="space-y-3">
      <Eyebrow as="div" className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        Review Timeline
      </Eyebrow>
      <div className="text-muted-foreground space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Submitted</span>
          <span>{formatDate(activity._creationTime)}</span>
        </div>
        <div className="flex justify-between">
          <span>{reviewedLabel(activity.state)}</span>
          <span>{reviewedValue}</span>
        </div>
        {activity.state === "rejected" && activity.rejectionReason && (
          <div className="border-destructive/20 bg-destructive/5 mt-2 rounded-md border p-2">
            <p className="text-destructive text-body-sm font-medium">Reason</p>
            <p className="text-foreground mt-0.5">{activity.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
