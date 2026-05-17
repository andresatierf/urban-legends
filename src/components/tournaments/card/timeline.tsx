import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import { daysUntil, getTournamentStatus, tournamentProgress } from "../utils";
import type { TournamentCardData } from "./types";

export function Timeline({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);
  const progress = tournamentProgress(data);

  let pinLabel: string;
  let pinColor: string;
  if (status === "active") {
    pinLabel = `${daysUntil(data.endDate)}d left`;
    pinColor = "text-primary";
  } else if (status === "upcoming") {
    pinLabel = `Starts in ${daysUntil(data.startDate)}d`;
    pinColor = "text-info";
  } else {
    pinLabel = "Final";
    pinColor = "text-muted-foreground";
  }

  const fillClass =
    status === "active"
      ? "bg-primary"
      : status === "ended"
        ? "bg-muted-foreground/50"
        : "bg-info/30";

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
          style={{
            width: `${Math.max(progress, status === "upcoming" ? 0 : 3)}%`,
          }}
        />
        {status === "active" && (
          <div
            aria-hidden
            className="border-ink bg-gold shadow-fd-sm absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ left: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
}
