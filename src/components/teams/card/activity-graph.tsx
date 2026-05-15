import { Eyebrow } from "@/components/ui/eyebrow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  DAY_LABELS,
  type DayActivity,
  dayAriaLabel,
  dayOfWeekUTC,
  dayTooltipContent,
  emptyWindow,
} from "./activity-shared";

type Props = { recentActivity?: Doc<"teams">["recentActivity"] };

// Monochrome two-state stepped stream of the team's last 7 days of activity.
// Approved counts render as solid ink, pending stacked above as a halftone
// (ink at low opacity). Rejected submissions stay in the tooltip breakdown
// but don't take visual space. A dashed peak line + numeric label call out
// the scale (max single-day approved+pending in the window).
const VB_W = 168;
const VB_H = 40;
const PAD_X = 2;
const PAD_TOP = 3;
const PAD_BOTTOM = 4;
const PLOT_W = VB_W - PAD_X * 2;
const PLOT_H = VB_H - PAD_TOP - PAD_BOTTOM;

function steppedLayerPath(
  days: DayActivity[],
  base: (d: DayActivity) => number,
  top: (d: DayActivity) => number,
  max: number,
): string {
  const baselineY = PAD_TOP + PLOT_H;
  const cellW = PLOT_W / days.length;
  const yFor = (v: number) => baselineY - (v / max) * PLOT_H;

  let d = "";
  days.forEach((day, i) => {
    const x0 = PAD_X + i * cellW;
    const x1 = x0 + cellW;
    const y = yFor(top(day));
    if (i === 0) d += `M ${x0} ${y}`;
    else d += ` L ${x0} ${y}`;
    d += ` L ${x1} ${y}`;
  });
  for (let i = days.length - 1; i >= 0; i--) {
    const x0 = PAD_X + i * cellW;
    const x1 = x0 + cellW;
    const y = yFor(base(days[i]));
    d += ` L ${x1} ${y}`;
    d += ` L ${x0} ${y}`;
  }
  return `${d} Z`;
}

export function ActivityGraph({ recentActivity }: Props) {
  const days = recentActivity?.days ?? emptyWindow();
  const max = Math.max(1, ...days.map((d) => d.approved + d.pending));
  const allEmpty = days.every((d) => d.approved + d.pending === 0);

  const approved = steppedLayerPath(
    days,
    () => 0,
    (d) => d.approved,
    max,
  );
  const pending = steppedLayerPath(
    days,
    (d) => d.approved,
    (d) => d.approved + d.pending,
    max,
  );
  const baselineY = PAD_TOP + PLOT_H;
  const peakY = PAD_TOP;

  return (
    <div className="flex flex-col gap-1">
      <Eyebrow>Last 7 days</Eyebrow>
      <TooltipProvider delayDuration={150}>
        <div className="relative h-10">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
            aria-hidden
          >
            {!allEmpty && (
              <line
                x1={PAD_X}
                x2={VB_W - PAD_X}
                y1={peakY + 0.5}
                y2={peakY + 0.5}
                className="stroke-ink/35"
                strokeWidth={0.5}
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <line
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={baselineY + 0.5}
              y2={baselineY + 0.5}
              className="stroke-ink/40"
              strokeWidth={0.75}
              vectorEffect="non-scaling-stroke"
            />
            {!allEmpty && (
              <>
                <path d={pending} className="fill-ink/30" />
                <path d={approved} className="fill-ink" />
              </>
            )}
          </svg>
          {!allEmpty && (
            <span className="text-muted-foreground bg-card absolute -top-[3px] right-0 px-1 font-mono text-[9px] leading-none tabular-nums">
              {max}
            </span>
          )}
          <div className="absolute inset-0 flex">
            {days.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={dayAriaLabel(day)}
                    className="flex-1 cursor-default outline-none"
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {dayTooltipContent(day)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="flex">
          {days.map((day, i) => {
            const isToday = i === days.length - 1;
            return (
              <div
                key={day.date}
                className={cn(
                  "flex-1 text-center font-mono text-[9px] leading-none tracking-[0.18em] uppercase",
                  isToday ? "text-ink" : "text-muted-foreground",
                )}
              >
                {DAY_LABELS[dayOfWeekUTC(day.date)]}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
