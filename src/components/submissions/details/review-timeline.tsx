import { Clock } from "lucide-react";

import type { Doc } from "../../../../convex/_generated/dataModel";
import type { UserWithRoles } from "../../../../convex/users";
import { Eyebrow } from "../../ui/eyebrow";

function formatDate(input: string | number): string {
  return new Date(input).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function reviewedLabel(state: Doc<"submissions">["state"]): string {
  if (state === "approved") return "Approved";
  if (state === "rejected") return "Rejected";
  if (state === "deleted") return "Deleted";
  return "Awaiting review";
}

type Props = {
  submission: Doc<"submissions">;
  managedByUser: UserWithRoles | null;
};

export function ReviewTimeline({ submission, managedByUser }: Props) {
  const reviewedValue = managedByUser
    ? submission.reviewedAt
      ? `${formatDate(submission.reviewedAt)} by ${managedByUser.name}`
      : `by ${managedByUser.name}`
    : "—";

  return (
    <div className="space-y-3">
      <Eyebrow as="div" className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        Review Timeline
      </Eyebrow>
      <div className="text-muted-foreground space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Submitted</span>
          <span>{formatDate(submission._creationTime)}</span>
        </div>
        <div className="flex justify-between">
          <span>{reviewedLabel(submission.state)}</span>
          <span>{reviewedValue}</span>
        </div>
        {submission.state === "rejected" && submission.rejectionReason && (
          <div className="border-destructive/20 bg-destructive/5 mt-2 rounded-md border p-2">
            <p className="text-destructive text-body-sm font-medium">Reason</p>
            <p className="text-foreground mt-0.5">
              {submission.rejectionReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
