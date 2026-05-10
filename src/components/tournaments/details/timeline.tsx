import { Clock } from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import { Progress } from "../../ui/progress";
import type { TournamentDetails } from "./types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function TournamentTimeline({ data }: { data: TournamentDetails }) {
  const { format } = useFormattedDate();
  const start = new Date(data.tournament.startDate).getTime();
  const end = new Date(data.tournament.endDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = Math.max(0, Math.min(now - start, total));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((end - now) / MS_PER_DAY));
  const totalDays = Math.max(1, Math.floor(total / MS_PER_DAY) + 1);
  const currentDay = Math.min(totalDays, Math.floor(elapsed / MS_PER_DAY) + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        Timeline
      </div>
      <div className="text-muted-foreground space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Start</span>
          <span>{format(data.tournament.startDate, "short")}</span>
        </div>
        <div className="flex justify-between">
          <span>End</span>
          <span>{format(data.tournament.endDate, "short")}</span>
        </div>
      </div>
      <Progress
        aria-label="Tournament progress"
        value={
          data.status === "ended" ? 100 : data.status === "upcoming" ? 0 : pct
        }
        className="h-2"
      />
      <div className="text-muted-foreground text-center text-xs">
        {data.status === "active" && (
          <>
            Day {currentDay} of {totalDays} · {daysLeft} day
            {daysLeft === 1 ? "" : "s"} left
          </>
        )}
        {data.status === "upcoming" && (
          <>Starts in {Math.ceil((start - now) / MS_PER_DAY)} days</>
        )}
        {data.status === "ended" && "Tournament complete"}
      </div>
    </div>
  );
}
