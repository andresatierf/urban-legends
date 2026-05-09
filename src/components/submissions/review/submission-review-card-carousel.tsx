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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";
import {
  getReviewItemFacts,
  initials,
  type SubmissionReviewCardProps,
  type SubmissionState,
  type SubmissionTier,
  stateBadgeVariant,
  useReviewActions,
} from "./submission-review-card-shared";
import type { EvidenceImage, SubmitterEvidence } from "./types";

export function CarouselReviewCard({
  item,
  showActions = true,
  onApprove,
  onReject,
}: SubmissionReviewCardProps) {
  const facts = getReviewItemFacts(item);
  const { isApproving, isRejecting, handleApprove, handleReject } =
    useReviewActions(item, onApprove, onReject);

  const isPending = facts.state === "pending";
  const canApprove = isPending && !!onApprove;
  const canReject = isPending && !!onReject;

  return (
    <Card className="relative gap-0 overflow-hidden p-0">
      {item.type === "individual" ? (
        <IndividualPortrait
          evidence={item.data.evidence}
          submitterName={item.data.submitter.name}
          submitterImageUrl={item.data.submitter.imageUrl}
        />
      ) : (
        <GroupPortraitWithStrip
          submitterEvidence={item.data.submitterEvidence}
          participantCount={item.data.group.participantCount}
          totalTeamMembers={item.data.group.totalTeamMembers}
        />
      )}

      <FloatingBadges
        state={facts.state}
        tier={facts.tier}
        isGroup={facts.isGroup}
      />

      <MetaFooter
        teamName={facts.teamName}
        tournamentName={facts.tournamentName}
        date={facts.date}
        pointsEarned={facts.pointsEarned}
      />

      {showActions && (canApprove || canReject) && (
        <div className="flex gap-0 border-t">
          {canApprove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex-1 gap-1.5 rounded-none"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          )}
          {canApprove && canReject && <div className="w-px bg-border" />}
          {canReject && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="flex-1 gap-1.5 rounded-none text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function FloatingBadges({
  state,
  tier,
  isGroup,
}: {
  state: SubmissionState;
  tier: SubmissionTier;
  isGroup: boolean;
}) {
  return (
    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
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
    </div>
  );
}

function MetaFooter({
  teamName,
  tournamentName,
  date,
  pointsEarned,
}: {
  teamName: string;
  tournamentName: string;
  date: string;
  pointsEarned: number;
}) {
  const { format } = useFormattedDate();
  return (
    <div className="space-y-1 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate font-semibold text-sm leading-tight">
          {teamName}
        </p>
        {pointsEarned > 0 && (
          <span className="shrink-0 font-heading font-medium text-emerald-600 text-xs">
            +{pointsEarned} pts
          </span>
        )}
      </div>
      <p className="truncate text-muted-foreground text-xs">
        {tournamentName} &middot; {format(date, "short")}
      </p>
    </div>
  );
}

function IndividualPortrait({
  evidence,
  submitterName,
  submitterImageUrl,
}: {
  evidence: EvidenceImage[];
  submitterName: string;
  submitterImageUrl?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (evidence.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
    <div className="flex flex-col">
      <div className="relative">
        <Image
          src={active.url}
          alt={active.filename ?? `Evidence ${safeIdx + 1}`}
          className="aspect-[4/3] w-full object-cover"
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
        <div className="absolute right-2 bottom-2 left-2 flex items-center gap-2">
          <Avatar size="sm" className="ring-2 ring-background">
            {submitterImageUrl && (
              <AvatarImage src={submitterImageUrl} alt={submitterName} />
            )}
            <AvatarFallback>{initials(submitterName)}</AvatarFallback>
          </Avatar>
          <span className="truncate rounded bg-black/60 px-1.5 py-0.5 text-white text-xs backdrop-blur">
            {submitterName}
          </span>
        </div>
      </div>
      <div className="flex justify-center gap-1 py-2">
        {hasMultiple ? (
          evidence.map((img, idx) => (
            <span
              key={img._id}
              className={cn(
                "h-0.5 w-5 rounded-full transition",
                idx === safeIdx ? "bg-primary" : "bg-muted",
              )}
            />
          ))
        ) : (
          <span className="h-0.5 w-5" />
        )}
      </div>
    </div>
  );
}

function GroupPortraitWithStrip({
  submitterEvidence,
  participantCount,
  totalTeamMembers,
}: {
  submitterEvidence: SubmitterEvidence[];
  participantCount: number;
  totalTeamMembers: number;
}) {
  const withImages = submitterEvidence.filter((se) => se.evidence.length > 0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  if (withImages.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }
  const safeIdx = Math.min(activeIdx, withImages.length - 1);
  const lead = withImages[safeIdx];
  const safeImgIdx = Math.min(activeImgIdx, lead.evidence.length - 1);
  const activeImg = lead.evidence[safeImgIdx];
  const hasMultipleImages = lead.evidence.length > 1;
  const goPrevImg = () =>
    setActiveImgIdx(
      (i) => (i - 1 + lead.evidence.length) % lead.evidence.length,
    );
  const goNextImg = () =>
    setActiveImgIdx((i) => (i + 1) % lead.evidence.length);
  const selectSubmitter = (idx: number) => {
    setActiveIdx(idx);
    setActiveImgIdx(0);
  };

  return (
    <div className="flex flex-col">
      <div className="relative">
        <Image
          src={activeImg.url}
          alt={activeImg.filename ?? `Evidence from ${lead.submitterName}`}
          className="aspect-[4/3] w-full object-cover"
        />
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goPrevImg}
              aria-label="Previous image"
              className="-translate-y-1/2 absolute top-1/2 left-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNextImg}
              aria-label="Next image"
              className="-translate-y-1/2 absolute top-1/2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-white text-xs backdrop-blur">
          {participantCount}/{totalTeamMembers} submitted
        </div>
      </div>
      <div className="flex justify-center gap-1 py-2">
        {hasMultipleImages ? (
          lead.evidence.map((img, idx) => (
            <span
              key={img._id}
              className={cn(
                "h-0.5 w-5 rounded-full transition",
                idx === safeImgIdx ? "bg-primary" : "bg-muted",
              )}
            />
          ))
        ) : (
          <span className="h-0.5 w-5" />
        )}
      </div>
      <SubmitterStrip
        submitterEvidence={withImages}
        activeIdx={safeIdx}
        onSelect={selectSubmitter}
      />
    </div>
  );
}

function SubmitterStrip({
  submitterEvidence,
  activeIdx,
  onSelect,
}: {
  submitterEvidence: SubmitterEvidence[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b bg-muted/40 p-1.5">
      {submitterEvidence.map((se, idx) => {
        const isActive = idx === activeIdx;
        return (
          <button
            key={se.userId}
            type="button"
            onClick={() => onSelect(idx)}
            aria-pressed={isActive}
            aria-label={`Show evidence from ${se.submitterName}`}
            className="flex w-16 shrink-0 flex-col items-center gap-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div
              className={cn(
                "relative h-12 w-full overflow-hidden rounded transition",
                isActive
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={se.evidence[0].url}
                alt={
                  se.evidence[0].filename ?? `Evidence from ${se.submitterName}`
                }
                className="h-full w-full object-cover"
              />
              <Avatar
                size="sm"
                className="-bottom-1 -right-1 absolute size-5 ring-2 ring-background"
              >
                {se.submitterImageUrl && (
                  <AvatarImage
                    src={se.submitterImageUrl}
                    alt={se.submitterName}
                  />
                )}
                <AvatarFallback>{initials(se.submitterName)}</AvatarFallback>
              </Avatar>
            </div>
            <span
              className={cn(
                "w-full truncate text-center text-[10px]",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {se.submitterName.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
