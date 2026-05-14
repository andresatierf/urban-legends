import { Eyebrow } from "@/components/ui/eyebrow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../../convex/_generated/dataModel";

type DayActivity = NonNullable<Doc<"teams">["recentActivity"]>["days"][number];

type Props = {
  recentActivity?: Doc<"teams">["recentActivity"];
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Heights are scaled to the highest single-day total within THIS team's window
// so that small-volume teams remain readable. Empty days render a ghost bar.
const TRACK_HEIGHT_PX = 36;
const MIN_FILL_PX = 2;

function emptyWindow(): DayActivity[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return {
      date: d.toISOString().split("T")[0],
      approved: 0,
      pending: 0,
      rejected: 0,
    };
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ActivityBars({ recentActivity }: Props) {
  const days = recentActivity?.days ?? emptyWindow();
  const max = Math.max(
    1,
    ...days.map((d) => d.approved + d.pending + d.rejected),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow>Last 7 days</Eyebrow>
      <TooltipProvider delayDuration={150}>
        <div
          className="flex items-end gap-1"
          style={{ height: TRACK_HEIGHT_PX }}
        >
          {days.map((day) => {
            const total = day.approved + day.pending + day.rejected;
            const fillPx =
              total === 0
                ? MIN_FILL_PX
                : Math.max(
                    MIN_FILL_PX,
                    Math.round((total / max) * TRACK_HEIGHT_PX),
                  );
            const dayOfWeek = new Date(day.date + "T00:00:00Z").getUTCDay();
            const isEmpty = total === 0;
            return (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${formatDate(day.date)}: ${day.approved} approved, ${day.pending} pending, ${day.rejected} rejected`}
                    className="group flex min-w-0 flex-1 cursor-default flex-col items-center gap-1 outline-none"
                  >
                    <div
                      className={cn(
                        "flex w-full flex-col-reverse overflow-hidden rounded-sm border",
                        isEmpty
                          ? "border-border/60 bg-muted/40"
                          : "border-ink/60",
                      )}
                      style={{ height: fillPx }}
                    >
                      {!isEmpty && (
                        <>
                          {day.approved > 0 && (
                            <div
                              className="bg-success"
                              style={{
                                flexGrow: day.approved,
                                minHeight: 1,
                              }}
                            />
                          )}
                          {day.pending > 0 && (
                            <div
                              className="bg-warning"
                              style={{
                                flexGrow: day.pending,
                                minHeight: 1,
                              }}
                            />
                          )}
                          {day.rejected > 0 && (
                            <div
                              className="bg-muted-foreground/50"
                              style={{
                                flexGrow: day.rejected,
                                minHeight: 1,
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <Eyebrow className="text-[9px] leading-none">
                      {DAY_LABELS[dayOfWeek]}
                    </Eyebrow>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">
                      {formatDate(day.date)}
                    </span>
                    <span>
                      <span className="text-success">●</span> Approved:{" "}
                      {day.approved}
                    </span>
                    <span>
                      <span className="text-warning">●</span> Pending:{" "}
                      {day.pending}
                    </span>
                    <span>
                      <span className="text-muted-foreground">●</span> Rejected:{" "}
                      {day.rejected}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
