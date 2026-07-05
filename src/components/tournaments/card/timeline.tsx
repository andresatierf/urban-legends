import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import type { TournamentStatus } from "../utils";
import { daysUntil, getTournamentStatus, tournamentProgress } from "../utils";
import type { TournamentCardData } from "./types";

const FILL_CLASS: Record<TournamentStatus, string> = {
  active: "bg-primary",
  ended: "bg-muted-foreground/50",
  upcoming: "bg-info/30",
};

export function Timeline({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);
  const progress = tournamentProgress(data);

  let pinLabel: string;
  let pinColor: string;
  let minFill: number;
  switch (status) {
    case "active":
      pinLabel = `${daysUntil(data.endDate)}d left`;
      pinColor = "text-primary";
      minFill = 3;
      break;
    case "upcoming":
      pinLabel = `Starts in ${daysUntil(data.startDate)}d`;
      pinColor = "text-info";
      minFill = 0;
      break;
    default:
      pinLabel = "Final";
      pinColor = "text-muted-foreground";
      minFill = 3;
  }

  const fillClass = FILL_CLASS[status];

  return (
    <div className="border-ink/15 bg-paper-deep flex flex-col gap-2 rounded-md border border-dashed p-3">
      <div className="flex items-center justify-between">
        <span className="text-label-caps text-muted-foreground">
          {format(data.startDate, "short")}
        </span>
        <span className={cn("text-label-caps font-bold", pinColor)}>
          {pinLabel}
        </span>
        <span className="text-label-caps text-muted-foreground">
          {format(data.endDate, "short")}
        </span>
      </div>
      <div className="border-ink/20 bg-paper relative h-2 overflow-visible rounded-full border">
        <div
          className={cn("h-full rounded-full", fillClass)}
          style={{ width: `${Math.max(progress, minFill)}%` }}
        />
        {status === "active" && (
          <div
            aria-hidden
            className="border-ink bg-gold absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm"
            style={{ left: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
}
