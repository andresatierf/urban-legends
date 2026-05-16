import { StatsGrid } from "@/components/common/card/stats-grid";
import { cn } from "@/lib/utils";

import type { TeamCardData } from "./types";

export function StatsStrip({ data }: { data: TeamCardData }) {
  const pending = (data.team.recentActivity?.days ?? []).reduce(
    (s, d) => s + d.pending,
    0,
  );

  return (
    <StatsGrid
      variant="strip"
      items={[
        {
          label: "Rank",
          value:
            data.rank != null && data.totalTeams != null ? (
              <>
                <span className="font-mono tabular-nums">#{data.rank}</span>
                <span className="text-muted-foreground text-[0.6rem]">
                  /{data.totalTeams}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground font-mono text-xs">—</span>
            ),
        },
        {
          label: "Total",
          value: (
            <span className="font-mono tabular-nums">
              {data.team.points.toLocaleString()}
              <span className="text-muted-foreground ml-0.5 text-[0.6rem]">
                pts
              </span>
            </span>
          ),
        },
        {
          label: "Pending",
          value: (
            <span
              className={cn(
                "font-mono tabular-nums",
                pending > 0 ? "text-warning" : "text-muted-foreground",
              )}
            >
              {pending}
            </span>
          ),
        },
      ]}
    />
  );
}
