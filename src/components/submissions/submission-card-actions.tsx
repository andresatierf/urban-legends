"use client";

import { Check, Edit, Trash2, X } from "lucide-react";

import type { Doc } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface SubmissionCardActionsProps {
  submission: Doc<"submissions">;
  isAdmin: boolean;
  isOwner: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubmissionCardActions({
  submission,
  isAdmin,
  isOwner,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardActionsProps) {
  const isPending = submission.state === "pending";
  const canApprove = isAdmin && isPending && onApprove;
  const canReject = isAdmin && isPending && onReject;
  const canEdit = isOwner && submission.state !== "approved" && onEdit;
  const canDelete =
    (isAdmin || isOwner) && submission.state !== "deleted" && onDelete;

  // Don't render if no actions available
  if (!canApprove && !canReject && !canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-t pt-3">
      {canApprove && (
        <Button
          size="sm"
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          onClick={onApprove}
        >
          <Check className="mr-1 h-4 w-4" />
          Approve
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="default"
          className="bg-red-600 hover:bg-red-700"
          onClick={onReject}
        >
          <X className="mr-1 h-4 w-4" />
          Reject
        </Button>
      )}

      {canEdit && (
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
      )}
      {canDelete && (
        <Button size="sm" variant="outline" onClick={onDelete}>
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );
}
