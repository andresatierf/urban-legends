import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import { buildDemoCalendar, type CalendarDay } from "./fixtures";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATE_STYLES: Record<CalendarDay["state"], string> = {
  approved:
    "bg-badge-success-bg border-badge-success-border text-badge-success-text",
  pending:
    "bg-badge-warning-bg border-badge-warning-border text-badge-warning-text",
  rejected: "bg-badge-error-bg border-badge-error-border text-badge-error-text",
  missed: "bg-muted border-border/40 text-muted-foreground opacity-50",
  empty: "bg-transparent border-border/30 text-muted-foreground",
  today: "bg-card border-foreground text-foreground ring-2 ring-foreground/30",
};

type Props = {
  monthLabel?: string;
  compact?: boolean;
};

export function MockCalendar({ monthLabel = "May 2026", compact }: Props) {
  const days = buildDemoCalendar();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <Eyebrow as="div" color="sunset">
          Activity
        </Eyebrow>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <Button size="sm" variant="ghost" aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 grid grid-cols-7 gap-2">
          {WEEKDAYS.map((d) => (
            <Eyebrow key={d} as="div" className="text-center">
              {d}
            </Eyebrow>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <div
              key={`${d.date}-${i}`}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 text-xs font-medium transition-colors",
                compact ? "aspect-square" : "aspect-square sm:aspect-[5/4]",
                STATE_STYLES[d.state],
                !d.inMonth && "opacity-30",
              )}
            >
              <span
                className={cn("text-sm", !d.inMonth && "text-muted-foreground")}
              >
                {d.day}
              </span>
              {d.pointsEarned ? (
                <span className="text-[10px] leading-none opacity-80">
                  +{d.pointsEarned}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
