"use client";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

export const cellStyles = cva(
  "cursor-pointer border-2 transition-all duration-150 hover:shadow-md",
  {
    variants: {
      isOutsideTournament: {
        true: "cursor-not-allowed border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300",
      },
      isDisabled: {
        true: "cursor-not-allowed border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 opacity-50",
      },
      state: {
        pending:
          "border-yellow-500 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        approved:
          "border-green-500 bg-green-50 text-green-800 hover:bg-green-100",
        rejected: "border-red-500 bg-red-50 text-red-800 hover:bg-red-100",
        deleted:
          "border-gray-400 bg-gray-100 text-gray-500 line-through hover:bg-gray-200",
        undefined:
          "border-dashed border-gray-300 bg-white text-gray-600 hover:bg-gray-50",
      },
      isToday: {
        true: "ring-2 ring-blue-500 ring-offset-2",
      },
    },
    compoundVariants: [
      {
        isOutsideTournament: true,
        className:
          "cursor-not-allowed border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300",
      },
      {
        isOutsideTournament: false,
        isDisabled: true,
        className:
          "cursor-not-allowed border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 opacity-50",
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
  const dateStr = date.toISOString().split("T")[0];
  const dayNumber = date.getDate();

  const handleClick = () => {
    if (!isDisabled && !isOutsideTournament) {
      onClick(dateStr);
    }
  };

  const getStateIndicator = () => {
    if (!submission) return null;

    switch (submission.state) {
      case "approved":
        return (
          <span className="text-green-600 text-xs" title="Approved">
            ✓
          </span>
        );
      case "pending":
        return (
          <span className="text-xs text-yellow-600" title="Pending">
            ⏳
          </span>
        );
      case "rejected":
        return (
          <span className="text-red-600 text-xs" title="Rejected">
            ✗
          </span>
        );
      case "deleted":
        return (
          <span className="text-gray-500 text-xs" title="Deleted">
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
        "flex h-16 w-full flex-col items-center justify-center rounded-md p-2 text-center font-medium text-sm",
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
