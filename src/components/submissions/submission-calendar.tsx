"use client";

import { useQuery } from "convex/react";
import { capitalize, startCase } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";
import { CalendarDateCell, cellStyles } from "./calendar-date-cell";
import { CalendarHeader } from "./calendar-header";

interface SubmissionCalendarProps {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
  onDateClick?: (date: string, submissionId?: Id<"submissions">) => void;
}

const WEEKDAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WEEK_START_STORAGE_KEY = "calendarWeekStartsOn";

export function SubmissionCalendar({
  teamId,
  tournamentId,
  onDateClick,
}: SubmissionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStartsOn, setWeekStartsOn] = useState<number>(0); // 0 = Sunday, 1 = Monday, etc.

  // Load week start preference from localStorage and listen for changes
  useEffect(() => {
    const stored = localStorage.getItem(WEEK_START_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setWeekStartsOn(parsed);
      }
    }

    // Listen for storage changes from the settings page or other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WEEK_START_STORAGE_KEY && e.newValue !== null) {
        const parsed = Number.parseInt(e.newValue, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) {
          setWeekStartsOn(parsed);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Get rotated weekday labels based on week start
  const weekdayLabels = useMemo(() => {
    return [
      ...WEEKDAY_LABELS_SHORT.slice(weekStartsOn),
      ...WEEKDAY_LABELS_SHORT.slice(0, weekStartsOn),
    ];
  }, [weekStartsOn]);

  const tournament = useQuery(api.tournaments.get, {
    tournamentId: tournamentId,
  });

  const submissions = useQuery(
    api.submissions.getMonthSubmissions,
    teamId
      ? {
          teamId,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        }
      : "skip",
  );

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Calculate padding for start of week, adjusted for week start preference
    // firstDay.getDay() returns 0-6 (Sun-Sat)
    // We need to adjust based on weekStartsOn
    let startPadding = firstDay.getDay() - weekStartsOn;
    if (startPadding < 0) {
      startPadding += 7;
    }

    // Generate all dates to display
    const days: (Date | null)[] = [];

    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      const paddingDate = new Date(year, month, -(startPadding - i - 1));
      days.push(paddingDate);
    }

    // Add all days in the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add padding to complete the last week
    const endPadding = 7 - (days.length % 7);
    if (endPadding < 7) {
      for (let i = 1; i <= endPadding; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }

    return days;
  }, [currentDate, weekStartsOn]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check if can navigate
  const canNavigate = useMemo(() => {
    if (!tournament) return { prev: false, next: false };

    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);

    // Can go prev if current month is after tournament start month
    const canGoPrev =
      currentDate.getFullYear() > tournamentStart.getFullYear() ||
      (currentDate.getFullYear() === tournamentStart.getFullYear() &&
        currentDate.getMonth() > tournamentStart.getMonth());

    // Can go next if current month is before tournament end month
    const canGoNext =
      currentDate.getFullYear() < tournamentEnd.getFullYear() ||
      (currentDate.getFullYear() === tournamentEnd.getFullYear() &&
        currentDate.getMonth() < tournamentEnd.getMonth());

    return { prev: canGoPrev, next: canGoNext };
  }, [currentDate, tournament]);

  const handleDateClick = (date: string) => {
    const submission = submissions?.[date];
    onDateClick?.(date, submission?._id);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    return dateToCheck > today;
  };

  const isDateOutsideTournament = (date: Date) => {
    if (!tournament) return true;

    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    const dateToCheck = new Date(date);

    tournamentStart.setHours(0, 0, 0, 0);
    tournamentEnd.setHours(23, 59, 59, 999);
    dateToCheck.setHours(0, 0, 0, 0);

    return dateToCheck < tournamentStart || dateToCheck > tournamentEnd;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (!tournament) {
    return (
      <Card variant="dashed">
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        canGoPrev={canNavigate.prev}
        canGoNext={canNavigate.next}
      />

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-2">
        {weekdayLabels.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-700 text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date) => {
          if (!date) return null;

          const dateStr = date.toISOString().split("T")[0];
          const submission = submissions?.[dateStr];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();

          return (
            <div key={dateStr} className={isCurrentMonth ? "" : "opacity-40"}>
              <CalendarDateCell
                date={date}
                submission={submission}
                isToday={isToday(date)}
                isDisabled={isDateDisabled(date)}
                isOutsideTournament={isDateOutsideTournament(date)}
                onClick={handleDateClick}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex xs:flex-row flex-col flex-wrap items-start xs:items-center justify-center gap-4 border-t pt-4 text-xs">
        {(
          [undefined, "pending", "approved", "rejected"] as (
            | undefined
            | Doc<"submissions">["state"]
          )[]
        ).map((state) => (
          <div key={state} className="flex items-center gap-2">
            <div
              className={cn("h-4 w-4 rounded border-2", cellStyles({ state }))}
            />
            <span className="text-gray-600">
              {state ? capitalize(state) : "No submission"}
            </span>
          </div>
        ))}
        <div className="flex-1"></div>
        {["isOutsideTournament", "isDisabled", "isToday"].map((options) => (
          <div key={options} className="flex items-center gap-2">
            <div
              className={cn(
                "h-4 w-4 rounded border-2",
                cellStyles({ [options]: true }),
              )}
            />
            <span className="text-gray-600">
              {startCase(options).split(" ").slice(1).join(" ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
