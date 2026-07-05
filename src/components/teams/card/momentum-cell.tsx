import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

import { emptyWindow } from "./activity-shared";
import type { TeamCardData } from "./types";

export function MomentumCell({ data }: { data: TeamCardData }) {
  const days = data.team.recentActivity?.days ?? emptyWindow();
  const { streak, idleDays } = computeStreakAndIdle(days);
  const idle = streak === 0;

  return (
    <div className="border-ink/15 flex flex-col gap-1 rounded-md border p-2">
      <div className="flex items-center gap-1">
        <Flame
          className={cn(
            "size-3.5",
            idle ? "text-muted-foreground" : "text-warning",
          )}
        />
        <span className="font-mono text-lg leading-none font-bold tabular-nums">
          {streak}
        </span>
        <span className="text-muted-foreground text-[0.65rem]">day streak</span>
      </div>
      <span className="text-muted-foreground text-[0.65rem]">
        {idleDays === 0
          ? "Active today"
          : idleDays == null
            ? "No activities yet"
            : `${idleDays}d idle`}
      </span>
    </div>
  );
}

// streak: consecutive days, walking back from today, with approved > 0.
// idleDays: days since the most recent approved activity (0 if today,
// null if never active in the window).
function computeStreakAndIdle(days: { approved: number }[]): {
  streak: number;
  idleDays: number | null;
} {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].approved > 0) streak++;
    else break;
  }
  let idleDays: number | null = null;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].approved > 0) {
      idleDays = days.length - 1 - i;
      break;
    }
  }
  return { streak, idleDays };
}
