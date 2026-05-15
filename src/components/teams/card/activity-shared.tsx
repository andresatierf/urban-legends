import type { Doc } from "../../../../convex/_generated/dataModel";

export type DayActivity = NonNullable<
  Doc<"teams">["recentActivity"]
>["days"][number];

export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function emptyWindow(): DayActivity[] {
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

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function dayOfWeekUTC(iso: string): number {
  return new Date(iso + "T00:00:00Z").getUTCDay();
}

export function dayTooltipContent(day: DayActivity) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold">{formatDate(day.date)}</span>
      <span>
        <span className="text-success">●</span> Approved: {day.approved}
      </span>
      <span>
        <span className="text-warning">●</span> Pending: {day.pending}
      </span>
      <span>
        <span className="text-muted-foreground">●</span> Rejected:{" "}
        {day.rejected}
      </span>
    </div>
  );
}

export function dayAriaLabel(day: DayActivity): string {
  return `${formatDate(day.date)}: ${day.approved} approved, ${day.pending} pending, ${day.rejected} rejected`;
}
