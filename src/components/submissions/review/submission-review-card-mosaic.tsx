"use client";

import { capitalize } from "lodash";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";
import { DotStrip } from "./dot-strip";
import {
  getReviewItemFacts,
  type SubmissionReviewCardProps,
  type SubmissionState,
  type SubmissionTier,
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

  return (
    <Card className="flex flex-col gap-2 overflow-hidden pt-0 pb-2">
      {item.type === "individual" ? (
        <IndividualLead evidence={item.data.evidence} />
      ) : (
        <GroupMosaicLead submitterEvidence={item.data.submitterEvidence} />
      )}

      <CardContent className="flex-1 space-y-2 pt-1">
        <Chips
          state={facts.state}
          tier={facts.tier}
          isGroup={facts.isGroup}
          pointsEarned={facts.pointsEarned}
        />
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
        <CardFooter className="gap-2 border-t px-2 pt-2!">
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

function Chips({
  state,
  tier,
  isGroup,
  pointsEarned,
}: {
  state: SubmissionState;
  tier: SubmissionTier;
  isGroup: boolean;
  pointsEarned: number;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        variant={stateBadgeVariant(state)}
        className="font-medium text-[10px] shadow-sm"
      >
        {capitalize(state)}
      </Badge>
      {tier === "advanced" && (
        <Badge
          variant="outline"
          className="gap-0.5 bg-background/90 font-medium text-[10px] shadow-sm backdrop-blur"
        >
          <Sparkles className="h-2.5 w-2.5" />
          Advanced
        </Badge>
      )}
      {isGroup && (
        <Badge
          variant="outline"
          className="gap-0.5 bg-background/90 font-medium text-[10px] shadow-sm backdrop-blur"
        >
          <Users className="h-2.5 w-2.5" />
          Team
        </Badge>
      )}
      {pointsEarned > 0 && (
        <Badge
          variant="outline"
          className="bg-background/90 font-medium text-[10px] shadow-sm backdrop-blur"
        >
          +{pointsEarned} pts
        </Badge>
      )}
    </div>
  );
}

function IndividualLead({ evidence }: { evidence: EvidenceImage[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (evidence.length === 0) {
    return (
      <div className="aspect-square w-full px-3 pt-3">
        <div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
    );
  }
  const safeIdx = Math.min(activeIdx, evidence.length - 1);
  const active = evidence[safeIdx];
  const hasMultiple = evidence.length > 1;
  const goPrev = () =>
    setActiveIdx((i) => (i - 1 + evidence.length) % evidence.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % evidence.length);
  return (
    <div className="px-3 pt-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <Image
          src={active.url}
          alt={active.filename ?? `Evidence ${safeIdx + 1}`}
          className="h-full w-full object-cover"
        />
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="-translate-y-1/2 absolute top-1/2 left-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="-translate-y-1/2 absolute top-1/2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <DotStrip
        evidence={evidence}
        activeIdx={safeIdx}
        onSelect={setActiveIdx}
      />
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
      <div className="aspect-square w-full px-3 pt-3">
        <div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
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
    <div className="aspect-square w-full px-3 pt-3">
      <div className="relative h-full w-full overflow-hidden rounded-md">
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
    </div>
  );
}
