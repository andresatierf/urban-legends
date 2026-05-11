import { Progress } from "@/components/ui/progress";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import {
  type TournamentStatus,
  daysUntil,
  getTournamentStatus,
  tournamentProgress,
} from "../utils";
import type { TournamentCardData } from "./types";

const PROGRESS_CLASS: Record<TournamentStatus, string> = {
  active: "",
  upcoming: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/30",
  ended: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40",
};

export function Timeline({ data }: { data: TournamentCardData }) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(data);
  const progress = tournamentProgress(data);

  let timeLabel: string;
  if (status === "active")
    timeLabel = `${daysUntil(data.endDate)} days remaining`;
  else if (status === "upcoming")
    timeLabel = `Starts ${format(data.startDate, "long")}`;
  else timeLabel = `Ended ${format(data.endDate, "long")}`;

  return (
    <div className="flex flex-col gap-1.5">
      <Progress
        value={progress}
        className={cn("h-2", PROGRESS_CLASS[status])}
      />
      <div
        className={cn(
          "text-center text-[0.625rem] font-medium",
          status === "active" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {timeLabel}
      </div>
    </div>
  );
}
