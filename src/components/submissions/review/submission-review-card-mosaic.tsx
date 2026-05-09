"use client";

import { capitalize } from "lodash";
import { Check, ImageIcon, X } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";
import {
  getReviewItemFacts,
  type SubmissionReviewCardProps,
  stateBadgeVariant,
  useReviewActions,
} from "./submission-review-card-shared";
import type { EvidenceImage, SubmitterEvidence } from "./types";

export function MosaicReviewCard({
  item,
  showActions = true,
  onApprove,
  onReject,
}: SubmissionReviewCardProps) {
  const { format } = useFormattedDate();
  const facts = getReviewItemFacts(item);
  const { isApproving, isRejecting, handleApprove, handleReject } =
    useReviewActions(item, onApprove, onReject);

  const isPending = facts.state === "pending";
  const canApprove = isPending && !!onApprove;
  const canReject = isPending && !!onReject;

  const badges: Array<{
    content: string;
    variant?: BadgeProps["variant"];
    className?: string;
  }> = [
    {
      content: capitalize(facts.state),
      variant: stateBadgeVariant(facts.state),
    },
    facts.isGroup
      ? {
          content: "Team Activity",
          className: "bg-green-100 text-green-800 hover:bg-green-100",
        }
      : {
          content: "Individual",
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        },
    { content: capitalize(facts.tier), variant: "outline" },
  ];
  if (facts.pointsEarned > 0) {
    badges.push({
      content: `${facts.pointsEarned} pts`,
      variant: "outline",
    });
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {item.type === "individual" ? (
        <IndividualLead evidence={item.data.evidence} />
      ) : (
        <GroupMosaicLead submitterEvidence={item.data.submitterEvidence} />
      )}

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
        <p className="font-semibold leading-tight">{facts.teamName}</p>
        <p className="text-muted-foreground text-sm">{facts.tournamentName}</p>
        <div className="text-muted-foreground text-sm">
          {item.type === "individual" ? (
            <p>
              {item.data.submitter.name} &middot; {format(facts.date, "short")}
            </p>
          ) : (
            <>
              <p>
                {item.data.group.participantCount}/
                {item.data.group.totalTeamMembers} participants &middot;{" "}
                {Math.round(item.data.group.participationRate * 100)}%
              </p>
              <p>{format(facts.date, "short")}</p>
            </>
          )}
        </div>
      </CardContent>

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
  );
}

function IndividualLead({ evidence }: { evidence: EvidenceImage[] }) {
  if (evidence.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-muted">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }
  const extra = evidence.length - 1;
  return (
    <div className="relative">
      <Image
        src={evidence[0].url}
        alt={evidence[0].filename ?? "Evidence 1"}
        className="aspect-video w-full object-cover"
      />
      {extra > 0 && (
        <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
          +{extra} more
        </div>
      )}
    </div>
  );
}

function GroupMosaicLead({
  submitterEvidence,
}: {
  submitterEvidence: SubmitterEvidence[];
}) {
  const withImages = submitterEvidence.filter((se) => se.evidence.length > 0);
  if (withImages.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-muted">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  const cellCount = Math.min(withImages.length, 4);
  const visible = withImages.slice(0, cellCount);
  const extra = withImages.length - cellCount;

  const cellImage = (idx: number, className?: string) => {
    const img = visible[idx].evidence[0];
    return (
      <Image
        key={visible[idx].userId}
        src={img.url}
        alt={img.filename ?? `Evidence from ${visible[idx].submitterName}`}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden">
      {cellCount === 1 && cellImage(0)}

      {cellCount === 2 && (
        <div className="grid h-full grid-cols-2 gap-0.5">
          {cellImage(0)}
          {cellImage(1)}
        </div>
      )}

      {cellCount === 3 && (
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
          {cellImage(0, "row-span-2")}
          {cellImage(1)}
          {cellImage(2)}
        </div>
      )}

      {cellCount === 4 && (
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
          {cellImage(0)}
          {cellImage(1)}
          {cellImage(2)}
          {cellImage(3)}
        </div>
      )}

      {extra > 0 && (
        <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-white text-xs">
          +{extra} more
        </div>
      )}
    </div>
  );
}
