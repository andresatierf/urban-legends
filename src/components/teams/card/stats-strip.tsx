import { cn } from "@/lib/utils";

import type { TeamCardData } from "./types";

export function StatsStrip({ data }: { data: TeamCardData }) {
  const pending = (data.team.recentActivity?.days ?? []).reduce(
    (s, d) => s + d.pending,
    0,
  );
  return (
    <div className="border-ink/15 grid grid-cols-3 gap-2 rounded-md border border-dashed p-2">
      <Stat
        label="Rank"
        value={
          data.rank != null && data.totalTeams != null ? (
            <>
              <span className="font-mono tabular-nums">#{data.rank}</span>
              <span className="text-muted-foreground text-[0.6rem]">
                /{data.totalTeams}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground font-mono text-xs">—</span>
          )
        }
      />
      <Stat
        label="Total"
        value={
          <span className="font-mono tabular-nums">
            {data.team.points.toLocaleString()}
            <span className="text-muted-foreground ml-0.5 text-[0.6rem]">
              pts
            </span>
          </span>
        }
      />
      <Stat
        label="Pending"
        value={
          <span
            className={cn(
              "font-mono tabular-nums",
              pending > 0 ? "text-warning" : "text-muted-foreground",
            )}
          >
            {pending}
          </span>
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground text-[0.6rem] tracking-[0.15em] uppercase">
        {label}
      </span>
      <span className="flex items-baseline gap-0.5 text-sm leading-none font-semibold">
        {value}
      </span>
    </div>
  );
}
