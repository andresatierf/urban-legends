"use client";

import type { Doc } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { SubmissionCardActions } from "./submission-card-actions";
import { SubmissionCardDetails } from "./submission-card-details";
import { SubmissionCardImage } from "./submission-card-image";

interface SubmissionCardProps {
  submission: Doc<"submissions"> & {
    team: Doc<"teams">;
    user: Doc<"users">;
  };
  images: Array<{
    _id: string;
    url: string;
    filename: string;
  }>;
  currentUser: UserWithRoles;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubmissionCard({
  submission,
  images,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardProps) {
  const isAdmin =
    currentUser.roleNames.includes("admin") ||
    currentUser.roleNames.includes("dev");
  const isOwner = submission.userId === currentUser._id;

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md md:flex-row">
      <div className="w-full shrink-0 md:w-64">
        <SubmissionCardImage images={images} />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <SubmissionCardDetails
          submission={submission}
          team={submission.team}
          user={submission.user}
        />

        <SubmissionCardActions
          submission={submission}
          isAdmin={isAdmin}
          isOwner={isOwner}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
