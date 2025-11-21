"use client";

import type { Doc, Id } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { CardGrid } from "../ui/card-grid";
import { SubmissionCard } from "./submission-card";

interface SubmissionCardListProps {
  submissions: Array<
    Doc<"submissions"> & {
      team: Doc<"teams">;
      user: Doc<"users">;
    }
  >;
  currentUser: UserWithRoles;
  onApprove?: (submissionId: Id<"submissions">) => void;
  onReject?: (submissionId: Id<"submissions">) => void;
  onEdit?: (submissionId: Id<"submissions">) => void;
  onDelete?: (submissionId: Id<"submissions">) => void;
}

export function SubmissionCardList({
  submissions,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardListProps) {
  return (
    <CardGrid
      data={submissions}
      empty={
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No submissions found</p>
        </div>
      }
      className="grid-cols-1!"
    >
      {(submission) => (
        <SubmissionCard
          key={submission._id}
          submission={submission}
          images={[]}
          currentUser={currentUser}
          onApprove={() => onApprove?.(submission._id)}
          onReject={() => onReject?.(submission._id)}
          onEdit={() => onEdit?.(submission._id)}
          onDelete={() => onDelete?.(submission._id)}
        />
      )}
    </CardGrid>
  );
}
