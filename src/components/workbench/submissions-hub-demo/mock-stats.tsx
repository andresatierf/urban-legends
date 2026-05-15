import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { DEMO_CALENDAR_STATS } from "./fixtures";

type Props = {
  compact?: boolean;
};

export function MockCalendarStats({ compact }: Props) {
  const stats = DEMO_CALENDAR_STATS;
  const total = stats.approved + stats.pending + stats.rejected + stats.missed;
  const completionRate = Math.round(
    ((stats.approved + stats.pending) / Math.max(total, 1)) * 100,
  );

  const tiles = [
    { label: "Approved", value: stats.approved, color: "text-success" },
    { label: "Pending", value: stats.pending, color: "text-warning" },
    { label: "Rejected", value: stats.rejected, color: "text-destructive" },
    { label: "Streak", value: `${stats.streak}d 🔥`, color: "text-social" },
  ];

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <Eyebrow>Month progress</Eyebrow>
          <span className="text-muted-foreground text-xs">
            {stats.approved + stats.pending} / {total} days ·{" "}
            {stats.pointsEarned} pts
          </span>
        </div>
        <Progress value={completionRate} className="h-2" />
        <div
          className={cn(
            "grid gap-3",
            compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {tiles.map((t) => (
            <div
              key={t.label}
              className="bg-paper-deep dark:bg-background/20 rounded-lg p-3 text-center"
            >
              <div className={cn("text-lg font-bold", t.color)}>{t.value}</div>
              <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
