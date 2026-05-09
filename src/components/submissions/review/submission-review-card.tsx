"use client";

import { capitalize } from "lodash";
import { Check, ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn, tryMutate } from "@/lib/utils";
import { EvidenceLightbox } from "../display/evidence-lightbox";
import { EvidenceMosaic } from "./evidence-mosaic";
import type { EvidenceImage, ReviewItem } from "./types";

interface SubmissionReviewCardProps {
  item: ReviewItem;
  showActions?: boolean;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
}

export function SubmissionReviewCard({
  item,
  showActions = true,
  onApprove,
  onReject,
}: SubmissionReviewCardProps) {
  const { format } = useFormattedDate();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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
    const allImages = evidence ?? [];
    const extraImages = allImages.length > 1 ? allImages.length - 1 : 0;

    const badges: Array<{
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
      },
      {
        content: "Individual",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      },
      { content: capitalize(submission.tier), variant: "outline" },
    ];

    if (submission.pointsEarned > 0) {
      badges.push({
        content: `${submission.pointsEarned} pts`,
        variant: "outline",
      });
    }

    return (
      <>
        <Card className="flex flex-col overflow-hidden">
          {/* Lead image */}
          {allImages.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
                className="group relative block w-full"
                aria-label={`View evidence: ${allImages[0].filename ?? "Evidence 1"}`}
              >
                <Image
                  src={allImages[0].url}
                  alt={allImages[0].filename ?? "Evidence"}
                  width={800}
                  height={450}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
              {extraImages > 0 && (
                <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
                  +{extraImages} more
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-muted">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Metadata */}
          <CardContent className="flex-1 space-y-2 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {badges.map(({ content, variant, className }) => (
                <Badge
                  key={content}
                  variant={variant}
                  className={cn("font-medium text-xs", className)}
                >
                  {content}
                </Badge>
              ))}
            </div>
            <p className="font-semibold leading-tight">{team.name}</p>
            <p className="text-muted-foreground text-sm">{tournament.name}</p>
            <div className="text-muted-foreground text-sm">
              <p>
                {submitter.name} &middot; {format(submission.date, "short")}
              </p>
            </div>
          </CardContent>

          {/* Actions */}
          {showActions && (canApprove || canReject) && (
            <CardFooter className="gap-2 border-t pt-3">
              {canApprove && (
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="flex-1 gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  {isApproving ? "Approving..." : "Approve"}
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  className="flex-1 gap-1.5"
                >
                  <X className="h-4 w-4" />
                  {isRejecting ? "Rejecting..." : "Reject"}
                </Button>
              )}
            </CardFooter>
          )}
        </Card>

        <EvidenceLightbox
          images={allImages}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          initialIndex={lightboxIndex}
        />
      </>
    );
  }

  // Group rendering
  const { group, team, tournament, submitterEvidence } = item.data;
  const isPending = group.state === "pending";
  const canApprove = isPending && !!onApprove;
  const canReject = isPending && !!onReject;

  const allGroupImages: EvidenceImage[] =
    submitterEvidence?.flatMap((se) => se.evidence) ?? [];

  const badges: Array<{
    content: string;
    variant?: BadgeProps["variant"];
    className?: string;
  }> = [
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
    },
    {
      content: "Team Activity",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    { content: capitalize(group.tier), variant: "outline" },
  ];

  if (group.pointsEarned > 0) {
    badges.push({
      content: `${group.pointsEarned} pts`,
      variant: "outline",
    });
  }

  return (
    <>
      <Card className="flex flex-col overflow-hidden">
        {/* Mosaic lead image */}
        <EvidenceMosaic
          submitterEvidence={submitterEvidence ?? []}
          onImageClick={(idx) => {
            const flatIdx =
              submitterEvidence
                ?.slice(0, idx)
                .reduce((acc, se) => acc + se.evidence.length, 0) ?? 0;
            setLightboxIndex(flatIdx);
            setLightboxOpen(true);
          }}
        />

        {/* Metadata */}
        <CardContent className="flex-1 space-y-2 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {badges.map(({ content, variant, className }) => (
              <Badge
                key={content}
                variant={variant}
                className={cn("font-medium text-xs", className)}
              >
                {content}
              </Badge>
            ))}
          </div>
          <p className="font-semibold leading-tight">{team.name}</p>
          <p className="text-muted-foreground text-sm">{tournament.name}</p>
          <div className="text-muted-foreground text-sm">
            <p>
              {group.participantCount}/{group.totalTeamMembers} participants
              &middot; {Math.round(group.participationRate * 100)}%
            </p>
            {group.date && <p>{format(group.date, "short")}</p>}
          </div>
        </CardContent>

        {/* Actions */}
        {showActions && (canApprove || canReject) && (
          <CardFooter className="gap-2 border-t pt-3">
            {canApprove && (
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="flex-1 gap-1.5"
              >
                <Check className="h-4 w-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={isApproving || isRejecting}
                className="flex-1 gap-1.5"
              >
                <X className="h-4 w-4" />
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      <EvidenceLightbox
        images={allGroupImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
