"use client";

import { capitalize } from "lodash";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn, tryMutate } from "@/lib/utils";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { EvidenceGallery } from "../display/evidence-gallery";
import { SubmissionMetadata } from "../display/submission-metadata";
import { GroupParticipantsList } from "./group-participants-list";
import type { EvidenceImage, ReviewItem, SubmitterEvidence } from "./types";

interface SubmissionReviewCardProps {
  item: ReviewItem;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onViewDetails?: () => void;
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
  const { format } = useFormattedDate();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleApprove = async () => {
    if (!onApprove) return;

    setIsApproving(true);
    await tryMutate({
      fn: onApprove,
      successToast:
        item.type === "group"
          ? "Team activity approved"
          : "Submission approved",
      defaultFailureToast: "Failed to approve",
      onFinally: () => {
        if (mountedRef.current) {
          setIsApproving(false);
        }
      },
    });
  };

  const handleReject = async () => {
    if (!onReject) return;

    setIsRejecting(true);
    await tryMutate({
      fn: onReject,
      successToast:
        item.type === "group"
          ? "Team activity rejected"
          : "Submission rejected",
      defaultFailureToast: "Failed to reject",
      onFinally: () => {
        if (mountedRef.current) {
          setIsRejecting(false);
        }
      },
    });
  };

  if (item.type === "individual") {
    const { submission, team, tournament, submitter, evidence } = item.data;
    const isPending = submission.state === "pending";
    const canApprove = isPending && !!onApprove;
    const canReject = isPending && !!onReject;

    const badges: Array<{
      condition?: boolean;
      content: string;
      variant?: BadgeProps["variant"];
      className?: string;
    }> = [
      {
        content: capitalize(submission.state),
        variant:
          submission.state === "approved"
            ? "default"
            : submission.state === "rejected"
              ? "destructive"
              : submission.state === "deleted"
                ? "secondary"
                : "outline",
      } as const,
      {
        content: "Individual",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      },
      { content: capitalize(submission.tier), variant: "outline" },
      {
        condition: submission.pointsEarned > 0,
        content: `${submission.pointsEarned} pts`,
        variant: "outline",
      },
    ];

    return (
      <InnerSubmissionReviewCard
        variant={variant}
        team={team}
        tournament={tournament}
        evidence={evidence}
        badges={badges}
        showActions={showActions}
        canApprove={canApprove}
        canReject={canReject}
        handleApprove={handleApprove}
        handleReject={handleReject}
        isApproving={isApproving}
        isRejecting={isRejecting}
      >
        <SubmissionMetadata
          submitter={submitter.name}
          date={submission.date}
          description={
            variant === "detailed" ? submission.description : undefined
          }
        />
      </InnerSubmissionReviewCard>
    );
  }

  // Group rendering
  const { group, team, tournament, submitters, submitterEvidence } = item.data;
  const isPending = group.state === "pending";
  const canApprove = isPending && !!onApprove;
  const canReject = isPending && !!onReject;

  const badges: {
    condition?: boolean;
    content: string;
    variant?: BadgeProps["variant"];
    className?: string;
  }[] = [
    {
      content: capitalize(group.state),
      variant:
        group.state === "approved"
          ? "default"
          : group.state === "rejected"
            ? "destructive"
            : group.state === "deleted"
              ? "secondary"
              : "outline",
    } as const,
    {
      content: "Team Activity",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    { content: capitalize(group.tier), variant: "outline" },
    {
      condition: group.pointsEarned > 0,
      content: `${group.pointsEarned} pts`,
      variant: "outline",
    },
  ];

  return (
    <InnerSubmissionReviewCard
      variant={variant}
      team={team}
      tournament={tournament}
      badges={badges}
      isTeamActivity
      showActions={showActions}
      canApprove={canApprove}
      canReject={canReject}
      handleApprove={handleApprove}
      handleReject={handleReject}
      isApproving={isApproving}
      isRejecting={isRejecting}
    >
      <GroupParticipantsList
        submitters={submitters}
        participantCount={group.participantCount}
        totalMembers={group.totalTeamMembers}
        isTeamExercise={group.isTeamExercise}
        participationRate={group.participationRate}
        submitterEvidence={submitterEvidence}
      />

      {variant === "detailed" && group.date && (
        <p className="text-muted-foreground text-sm">
          Activity date: {format(group.date, "short")}
        </p>
      )}
    </InnerSubmissionReviewCard>
  );
}

type InnerSubmissionReviewCardProps = {
  variant: "compact" | "detailed";
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  evidence?: EvidenceImage[];
  submitterEvidence?: SubmitterEvidence[];
  badges: {
    condition?: boolean;
    content: string;
    variant?: BadgeProps["variant"];
    className?: string;
  }[];
  isTeamActivity?: boolean;
  showActions: boolean;
  canApprove: boolean;
  canReject: boolean;
  handleApprove: () => void | Promise<void>;
  handleReject: () => void | Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
  children?: React.ReactNode;
};

function InnerSubmissionReviewCard({
  variant,
  team,
  tournament,
  evidence,
  badges,
  isTeamActivity,
  showActions,
  canApprove,
  canReject,
  handleApprove,
  handleReject,
  isApproving,
  isRejecting,
  children,
}: InnerSubmissionReviewCardProps) {
  const hasEvidence = evidence && evidence.length > 0;

  return (
    <Card>
      <CardHeader
        className={cn("flex flex-row items-start justify-between", {
          "pb-3": variant === "compact",
        })}
      >
        <div className="flex flex-col gap-1">
          <CardTitle>{team.name}</CardTitle>
          <CardDescription>
            <p className="text-muted-foreground text-sm">{tournament.name}</p>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {badges.map(
            ({ condition, content, variant, className }) =>
              condition !== false && (
                <Badge
                  key={content}
                  variant={variant}
                  className={cn("font-medium", className)}
                >
                  {content}
                </Badge>
              ),
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Individual submissions: show Evidence gallery in both compact and detailed */}
        {!isTeamActivity && hasEvidence && (
          <EvidenceGallery
            images={evidence}
            layout={variant === "detailed" ? "grid" : "single"}
            maxDisplay={variant === "compact" ? 3 : 4}
            className={variant === "detailed" ? "mb-4" : undefined}
          />
        )}

        {children}
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
              {isApproving
                ? "Approving..."
                : isTeamActivity
                  ? "Approve Team Activity"
                  : "Approve"}
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
