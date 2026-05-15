import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { emptyWindow } from "./activity-shared";
import type { TeamCardData } from "./types";

export function SparklineCell({ data }: { data: TeamCardData }) {
  const days = data.team.recentActivity?.days ?? emptyWindow();
  const max = Math.max(1, ...days.map((d) => d.approved + d.pending));
  const allEmpty = days.every((d) => d.approved + d.pending === 0);
  const weekDelta = days.reduce((s, d) => s + (d.points ?? 0), 0);

  return (
    <div className="border-ink/15 flex flex-col gap-1 rounded-md border p-2">
      <div className="flex items-center gap-1">
        <TrendingUp
          className={cn(
            "size-3.5",
            weekDelta > 0 ? "text-success" : "text-muted-foreground",
          )}
        />
        <span className="font-mono text-lg leading-none font-bold tabular-nums">
          +{weekDelta}
        </span>
        <span className="text-muted-foreground text-[0.65rem]">7d</span>
      </div>
      <div className="relative h-4">
        {!allEmpty && (
          <>
            <div
              aria-hidden
              className="border-ink/35 absolute inset-x-0 top-0 border-t border-dashed"
            />
            <span className="text-muted-foreground bg-card absolute -top-1 right-0 px-0.5 font-mono text-[9px] leading-none tabular-nums">
              {max}
            </span>
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-0.5">
          {days.map((d) => {
            const total = d.approved + d.pending;
            return (
              <div
                key={d.date}
                className="bg-ink/70 flex-1 rounded-[1px]"
                style={{ height: `${(total / max) * 100}%`, minHeight: 1 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
