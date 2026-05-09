"use client";

import type { Doc } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { Image } from "@/components/ui/image";
import { useUser } from "@/hooks/useUser";

import { SubmissionCardActions } from "./submission-card-actions";
import { SubmissionCardDetails } from "./submission-card-details";

interface SubmissionCardProps {
  submission: Doc<"submissions"> & {
    team: Doc<"teams">;
    user: Doc<"users">;
  };
  thumbnailUrl?: string | null;
  evidenceCount?: number;
  currentUser: UserWithRoles;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubmissionCard({
  submission,
  thumbnailUrl,
  evidenceCount = 0,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardProps) {
  const { isAdmin } = useUser();
  const isOwner = submission.userId === currentUser._id;

  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md md:flex-row">
      {thumbnailUrl && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
          <Image
            src={thumbnailUrl}
            alt="Evidence thumbnail"
            fill
            className="object-cover"
            sizes="64px"
          />
          {evidenceCount > 1 && (
            <span className="absolute right-0 bottom-0 rounded-tl bg-black/70 px-1 text-[10px] font-bold text-white">
              +{evidenceCount - 1}
            </span>
          )}
        </div>
      )}

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
