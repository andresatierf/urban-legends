"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  canGoPrev,
  canGoNext,
}: CalendarHeaderProps) {
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth = () => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <>
      <h2 className="font-semibold text-2xl">{monthYear}</h2>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          disabled={isCurrentMonth()}
          aria-label="Jump to current month"
        >
          Today
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
