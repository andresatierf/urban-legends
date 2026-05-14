"use client";

import { cva } from "class-variance-authority";

import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { toUTCDateString } from "../../../../../convex/lib/dates";

export const cellStyles = cva(
  "cursor-pointer border-2 transition-all duration-150 hover:shadow-md",
  {
    variants: {
      isOutsideTournament: {
        true: "border-calendar-disabled-border bg-calendar-disabled-bg text-calendar-disabled-text cursor-not-allowed border-2 border-dashed",
      },
      isDisabled: {
        true: "border-calendar-disabled-border bg-calendar-disabled-bg text-calendar-disabled-text cursor-not-allowed border-2 border-dashed opacity-50",
      },
      state: {
        pending:
          "border-calendar-pending-border bg-calendar-pending-bg text-calendar-pending-text hover:bg-calendar-pending-bg-hover",
        approved:
          "border-calendar-approved-border bg-calendar-approved-bg text-calendar-approved-text hover:bg-calendar-approved-bg-hover",
        rejected:
          "border-calendar-rejected-border bg-calendar-rejected-bg text-calendar-rejected-text hover:bg-calendar-rejected-bg-hover",
        deleted:
          "border-calendar-deleted-border bg-calendar-deleted-bg text-calendar-deleted-text hover:bg-calendar-deleted-bg-hover line-through",
        undefined:
          "border-calendar-undefined-border bg-calendar-undefined-bg text-calendar-undefined-text hover:bg-calendar-undefined-bg-hover border-dashed",
      },
      isToday: {
        true: "ring-calendar-today-ring ring-offset-card ring-2 ring-offset-2",
      },
    },
    compoundVariants: [
      {
        isOutsideTournament: true,
        className:
          "border-calendar-disabled-border bg-calendar-disabled-bg text-calendar-disabled-text cursor-not-allowed border-2 border-dashed",
      },
      {
        isOutsideTournament: false,
        isDisabled: true,
        className:
          "border-calendar-disabled-border bg-calendar-disabled-bg text-calendar-disabled-text cursor-not-allowed border-2 border-dashed opacity-50",
      },
    ],
  },
);

interface CalendarDateCellProps {
  date: Date;
  submission?: {
    _id: Id<"submissions">;
    state: "pending" | "approved" | "rejected" | "deleted";
    description?: string;
    pointsEarned?: number;
    thumbnailUrl?: string | null;
    evidenceCount?: number;
  };
  isToday: boolean;
  isDisabled: boolean;
  isOutsideTournament: boolean;
  onClick: (date: string) => void;
}

export function CalendarDateCell({
  date,
  submission,
  isToday,
  isDisabled,
  isOutsideTournament,
  onClick,
}: CalendarDateCellProps) {
  const dayNumber = date.getDate();

  const handleClick = () => {
    if (!isDisabled && !isOutsideTournament) {
      onClick(toUTCDateString(date));
    }
  };

  const getStateIndicator = () => {
    if (!submission) return null;

    switch (submission.state) {
      case "approved":
        return (
          <span
            className="text-calendar-approved-text text-xs"
            title="Approved"
          >
            ✓
          </span>
        );
      case "pending":
        return (
          <span className="text-calendar-pending-text text-xs" title="Pending">
            ⏳
          </span>
        );
      case "rejected":
        return (
          <span
            className="text-calendar-rejected-text text-xs"
            title="Rejected"
          >
            ✗
          </span>
        );
      case "deleted":
        return (
          <span className="text-calendar-deleted-text text-xs" title="Deleted">
            🗑
          </span>
        );
    }
  };

  const getTooltipContent = () => {
    if (isOutsideTournament) return "Outside tournament dates";
    if (isDisabled) return "Future date";
    if (!submission) return "Click to create submission";

    return `${submission.state.charAt(0).toUpperCase() + submission.state.slice(1)}${submission.pointsEarned ? ` (${submission.pointsEarned} pts)` : ""}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isOutsideTournament}
      className={cn(
        "relative flex h-16 w-full flex-col items-center justify-center rounded-md p-2 text-center text-sm font-medium",
        cellStyles({
          isToday,
          isDisabled,
          isOutsideTournament,
          state: submission?.state,
        }),
      )}
      title={getTooltipContent()}
      aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${submission ? `, ${submission.state}` : ", no submission"}`}
      aria-pressed={!!submission}
      tabIndex={isDisabled || isOutsideTournament ? -1 : 0}
    >
      {submission?.thumbnailUrl && (
        <div className="absolute top-1 right-1 h-5 w-5 overflow-hidden rounded-sm">
          <Image
            src={submission.thumbnailUrl}
            alt=""
            fill
            sizes="20px"
            className="object-cover"
          />
          {(submission.evidenceCount ?? 0) > 1 && (
            <span className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/60 text-[8px] font-bold text-white">
              +{(submission.evidenceCount ?? 0) - 1}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="font-semibold">{dayNumber}</span>
        {getStateIndicator()}
      </div>
      {submission?.pointsEarned ? (
        <span className="mt-0.5 text-[10px] opacity-75">
          {submission.pointsEarned}pt
        </span>
      ) : null}
    </button>
  );
}
