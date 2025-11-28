"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserWithRoles } from "@/../convex/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { SubmissionImageGallery } from "../display/submission-image-gallery";
import { SubmissionMetadata } from "../display/submission-metadata";
import { GroupParticipantsList } from "./group-participants-list";
import type { ReviewItem } from "./types";

interface SubmissionReviewCardProps {
  item: ReviewItem;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  onApprove?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  onViewDetails?: () => void;
  currentUser: UserWithRoles;
}

/**
 * Unified card component that displays either an individual submission or a group
 * Optimized for review workflows with approval/rejection actions
 */
export function SubmissionReviewCard({
  item,
  variant = "compact",
  showActions = true,
  onApprove,
  onReject,
}: SubmissionReviewCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove();
      toast.success(
        item.type === "group"
          ? "Team activity approved"
          : "Submission approved",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    try {
      await onReject();
      toast.success(
        item.type === "group"
          ? "Team activity rejected"
          : "Submission rejected",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  if (item.type === "individual") {
    const { submission, team, tournament, submitter, images } = item.data;
    const isPending = submission.state === "pending";
    const canApprove = isPending && onApprove;
    const canReject = isPending && onReject;

    return (
      <Card>
        <CardHeader className={variant === "compact" ? "pb-3" : undefined}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={submission.state}>{submission.state}</Badge>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Individual
                </Badge>
                <Badge variant="outline">
                  {submission.tier === "base" ? "Base" : "Advanced"}
                </Badge>
                {submission.pointsEarned > 0 && (
                  <Badge variant="outline">{submission.pointsEarned} pts</Badge>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{team.name}</p>
                <p className="text-muted-foreground">{tournament.name}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {variant === "detailed" && (
            <SubmissionImageGallery images={images} className="mb-4" />
          )}

          <SubmissionMetadata
            submitter={submitter.name}
            date={submission.date}
            description={
              variant === "detailed" ? submission.description : undefined
            }
          />
        </CardContent>

        {showActions && (canApprove || canReject) && (
          <CardFooter className="gap-2">
            {canApprove && (
              <Button
                size="sm"
                color="green"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                color="destructive"
                onClick={handleReject}
                disabled={isApproving || isRejecting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  }

  // Group rendering
  const { group, team, tournament, submitters, images } = item.data;
  const isPending = group.state === "pending";
  const canApprove = isPending && onApprove;
  const canReject = isPending && onReject;

  return (
    <Card>
      <CardHeader className={variant === "compact" ? "pb-3" : undefined}>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={group.state}>{group.state}</Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Team Activity
              </Badge>
              <Badge variant="outline">
                {group.tier === "base" ? "Base" : "Advanced"}
              </Badge>
              {group.pointsEarned > 0 && (
                <Badge variant="outline">{group.pointsEarned} pts</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{team.name}</p>
              <p className="text-muted-foreground">{tournament.name}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {variant === "detailed" && images.length > 0 && (
          <SubmissionImageGallery images={images} className="mb-4" />
        )}

        <GroupParticipantsList
          submitters={submitters}
          participantCount={group.participantCount}
          totalMembers={group.totalTeamMembers}
          isTeamExercise={group.isTeamExercise}
          participationRate={group.participationRate}
        />

        {variant === "detailed" && group.date && (
          <p className="text-muted-foreground text-sm">
            Activity date: {new Date(group.date).toLocaleDateString()}
          </p>
        )}
      </CardContent>

      {showActions && (canApprove || canReject) && (
        <CardFooter className="gap-2">
          {canApprove && (
            <Button
              size="sm"
              color="green"
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {isApproving ? "Approving..." : "Approve Team Activity"}
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              color="destructive"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
