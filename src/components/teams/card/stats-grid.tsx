import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { StatsGrid as CommonStatsGrid } from "../../common/card/stats-grid";
import type { TeamCardData } from "./types";

export function StatsGrid({ data }: { data: TeamCardData }) {
  const { team, memberCount } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;
  const fillPct = team.maxMembers
    ? Math.min(100, (memberCount / team.maxMembers) * 100)
    : 0;

  return (
    <div className="space-y-2">
      <CommonStatsGrid
        variant="divided"
        items={[
          {
            value: memberCount,
            label: team.maxMembers ? `of ${team.maxMembers}` : "Members",
          },
          { value: team.points.toLocaleString(), label: "Points" },
          {
            value: team.maxMembers ? `${Math.round(fillPct)}%` : "—",
            label: "Capacity",
          },
        ]}
      />

      {team.maxMembers != null && (
        <Progress
          value={fillPct}
          className={cn(
            "h-1.5",
            isFull && "[&>[data-slot=progress-indicator]]:bg-destructive",
          )}
        />
      )}
    </div>
  );
}
