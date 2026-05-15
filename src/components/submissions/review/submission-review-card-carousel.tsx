"use client";

import { Link } from "@tanstack/react-router";
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
import { Eyebrow } from "@/components/ui/eyebrow";
import { Image } from "@/components/ui/image";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import { DotStrip } from "./dot-strip";
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

  // For group items the details page reads its team context from any one of
  // the group's submissions, so we link to the first non-rejected entry.
  const detailsSubmissionId =
    item.type === "individual"
      ? item.data.submission._id
      : item.data.submissions[0]?._id;

  const metaFooter = (
    <MetaFooter
      primaryLabel={
        item.type === "individual"
          ? item.data.submitter.name.trim() || item.data.submitter.email
          : facts.teamName
      }
      tournamentName={facts.tournamentName}
      date={facts.date}
      pointsEarned={facts.pointsEarned}
    />
  );

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

      {detailsSubmissionId ? (
        <Link
          to="/submissions/$submissionId"
          params={{ submissionId: detailsSubmissionId }}
          search={{ from: "review" }}
          className="hover:bg-muted/40 block transition-colors"
          aria-label="View submission details"
        >
          {metaFooter}
        </Link>
      ) : (
        metaFooter
      )}

      {showActions && (canApprove || canReject) && (
        <div className="mt-auto flex gap-0 border-t">
          {canApprove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex-1 gap-1.5 rounded-none"
            >
              <Check className="text-success h-4 w-4" />
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          )}
          {canApprove && canReject && <div className="bg-border w-px" />}
          {canReject && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="text-destructive hover:text-destructive flex-1 gap-1.5 rounded-none"
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
        className="text-[10px] font-medium shadow-sm"
      >
        {capitalize(state)}
      </Badge>
      {tier === "advanced" && (
        <Badge
          variant="social"
          className="gap-0.5 text-[10px] font-medium shadow-sm backdrop-blur"
        >
          <Sparkles className="h-2.5 w-2.5" />
          Advanced
        </Badge>
      )}
      {isGroup && (
        <Badge
          variant="info"
          className="gap-0.5 text-[10px] font-medium shadow-sm backdrop-blur"
        >
          <Users className="h-2.5 w-2.5" />
          Team
        </Badge>
      )}
    </div>
  );
}

function MetaFooter({
  primaryLabel,
  tournamentName,
  date,
  pointsEarned,
}: {
  primaryLabel: string;
  tournamentName: string;
  date: string;
  pointsEarned: number;
}) {
  const { format } = useFormattedDate();
  return (
    <div className="space-y-1 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-heading truncate text-sm leading-tight font-semibold">
          {primaryLabel}
        </p>
        {pointsEarned > 0 && (
          <span className="font-heading text-success shrink-0 text-xs font-medium">
            +{pointsEarned} pts
          </span>
        )}
      </div>
      <Eyebrow as="p" className="truncate">
        {tournamentName}
      </Eyebrow>
      <p className="text-muted-foreground truncate text-xs">
        {format(date, "short")}
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
      <div className="bg-muted flex aspect-[4/3] w-full items-center justify-center">
        <ImageIcon className="text-muted-foreground h-12 w-12" />
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
              className="focus-visible:ring-ring absolute top-1/2 left-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="focus-visible:ring-ring absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute right-2 bottom-2 left-2 flex items-center gap-2">
          <Avatar size="sm" className="ring-background ring-2">
            {submitterImageUrl && (
              <AvatarImage src={submitterImageUrl} alt={submitterName} />
            )}
            <AvatarFallback>{initials(submitterName)}</AvatarFallback>
          </Avatar>
          <span className="truncate rounded bg-black/60 px-1.5 py-0.5 text-xs text-white backdrop-blur">
            {submitterName}
          </span>
        </div>
      </div>
      <DotStrip
        evidence={evidence}
        activeIdx={safeIdx}
        onSelect={setActiveIdx}
      />
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
      <div className="bg-muted flex aspect-[4/3] w-full items-center justify-center">
        <ImageIcon className="text-muted-foreground h-12 w-12" />
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
              className="focus-visible:ring-ring absolute top-1/2 left-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNextImg}
              aria-label="Next image"
              className="focus-visible:ring-ring absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white backdrop-blur">
          {participantCount}/{totalTeamMembers} submitted
        </div>
      </div>
      <DotStrip
        evidence={lead.evidence}
        activeIdx={safeImgIdx}
        onSelect={setActiveImgIdx}
      />
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
    <div className="bg-muted/40 flex gap-1 overflow-x-auto border-b p-1.5">
      {submitterEvidence.map((se, idx) => {
        const isActive = idx === activeIdx;
        return (
          <button
            key={se.userId}
            type="button"
            onClick={() => onSelect(idx)}
            aria-pressed={isActive}
            aria-label={`Show evidence from ${se.submitterName}`}
            className="focus-visible:ring-ring flex w-16 shrink-0 flex-col items-center gap-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
          >
            <div
              className={cn(
                "relative h-12 w-full overflow-hidden rounded transition",
                isActive
                  ? "ring-primary ring-offset-background ring-2 ring-offset-1"
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
                className="ring-background absolute -right-1 -bottom-1 size-5 ring-2"
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
                  ? "text-foreground font-medium"
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
