import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { TeamCardData } from "./types";

export function StatsGrid({ data }: { data: TeamCardData }) {
  const { team, memberCount, submissionSummary } = data;

  const last7 = submissionSummary
    ? submissionSummary.approved + submissionSummary.pending
    : 0;

  const items = [
    {
      value: memberCount,
      label: team.maxMembers ? `of ${team.maxMembers}` : "Members",
    },
    { value: team.points.toLocaleString(), label: "Points" },
    { value: last7, label: "Last 7d" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-ink bg-card shadow-fd-xs flex flex-col items-center rounded-md border-2 py-2 text-center"
          >
            <span className="text-metric text-sm font-semibold">
              {item.value}
            </span>
            <Eyebrow>{item.label}</Eyebrow>
          </div>
        ))}
      </div>
      {submissionSummary && <ActivityStrip days={submissionSummary.days} />}
    </div>
  );
}

function ActivityStrip({
  days,
}: {
  days: { date: string; approved: number; pending: number }[];
}) {
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="flex items-end gap-1">
      {days.map((day) => {
        const total = day.approved + day.pending;
        const dayOfWeek = new Date(day.date + "T00:00:00").getUTCDay();
        return (
          <div
            key={day.date}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5"
          >
            <div
              className={cn(
                "h-4 w-full rounded-sm border",
                total === 0
                  ? "border-muted bg-muted/30"
                  : day.approved > 0
                    ? "border-success/50 bg-success/30"
                    : "border-warning/50 bg-warning/30",
              )}
              title={`${day.date}: ${day.approved} approved, ${day.pending} pending`}
            />
            <Eyebrow className="text-[9px] leading-none">
              {DAY_LABELS[dayOfWeek]}
            </Eyebrow>
          </div>
        );
      })}
    </div>
  );
}
