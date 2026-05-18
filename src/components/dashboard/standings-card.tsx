import { Link } from "@tanstack/react-router";

import { chartColorFor, RaceChart } from "@/components/common/race-chart";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { DashboardChartSeries, DashboardTeamRow } from "./types";

export type StandingsCardProps = {
  teams: DashboardTeamRow[];
  userTeamId: string;
  chartDays: number[];
  chartSeries: DashboardChartSeries[];
  isEnded: boolean;
};

export function StandingsCard({
  teams,
  userTeamId,
  chartDays,
  chartSeries,
  isEnded,
}: StandingsCardProps) {
  return (
    <section
      aria-label="Standings"
      className="border-ink bg-card overflow-hidden rounded-2xl border-2 shadow-lg"
    >
      <header className="border-ink/15 flex flex-wrap items-baseline justify-between gap-2 border-b-[1.5px] px-5 py-3 sm:px-6">
        <div className="flex flex-col">
          <Eyebrow>{isEnded ? "Final standings" : "The race"}</Eyebrow>
          <h2 className="font-heading text-h3 text-ink">Points over time</h2>
        </div>
        <p className="text-mute text-body-sm font-mono">{teams.length} teams</p>
      </header>

      <div className="grid grid-cols-1 min-[960px]:grid-cols-[1.55fr_1fr] min-[960px]:[grid-template-rows:480px]">
        <div className="border-ink/15 flex min-h-0 min-w-0 flex-col px-4 pt-4 pb-3 min-[960px]:border-r-[1.5px] min-[960px]:border-dashed sm:px-6 sm:pt-5">
          {chartSeries.length > 0 && (
            <RaceChart
              days={chartDays}
              series={chartSeries}
              userTeamId={userTeamId}
              className="rounded-none! border-0! bg-transparent! p-0! shadow-none!"
            />
          )}
        </div>

        <ol className="flex min-h-0 flex-col gap-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          {teams.map((t, i) => {
            const rank = i + 1;
            const isYou = t.team._id === userTeamId;
            const rankLabel = String(rank).padStart(2, "0");
            return (
              <li key={t.team._id}>
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: t.team._id }}
                  aria-label={`View team ${t.team.name}`}
                  className={cn(
                    "focus-visible:ring-ring/60 grid grid-cols-[2.5rem_auto_1fr_auto] items-center gap-3 rounded-md px-2.5 py-2 transition-colors outline-none focus-visible:ring-[3px]",
                    isYou && "bg-sky/10 ring-sky ring-[1.5px] ring-inset",
                    !isYou && "hover:bg-paper-deep",
                  )}
                >
                  <span
                    className={cn(
                      "text-center font-mono tabular-nums",
                      rank <= 3
                        ? "text-ink text-h3 font-extrabold"
                        : "text-mute text-body-md",
                    )}
                  >
                    {rankLabel}
                  </span>
                  <span
                    aria-hidden
                    className="border-ink block size-3 rounded-sm border-[1.5px]"
                    style={{ backgroundColor: chartColorFor(i) }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-heading text-ink truncate text-base leading-tight font-bold">
                      {t.team.name}
                    </span>
                    <span className="text-mute text-body-sm font-mono">
                      {t.memberCount}{" "}
                      {t.memberCount === 1 ? "member" : "members"}
                      {t.userRole === "captain" && " · captain"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-heading text-ink text-h3 leading-none tabular-nums">
                      {t.team.points}
                    </span>
                    <span className="text-mute text-label-caps">pts</span>
                  </span>
                  {isYou && <span className="sr-only">Your team</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
