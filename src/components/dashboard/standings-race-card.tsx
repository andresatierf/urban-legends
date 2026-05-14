"use client";

import type { Doc } from "../../../convex/_generated/dataModel";
import { RaceChart, type RaceChartSeries } from "./race-chart";
import type { DashboardTeam } from "./types";

export type StandingsGroup = {
  tournament: Doc<"tournaments">;
  teams: DashboardTeam[];
  maxPts: number;
};

export type StandingsRaceChartData = {
  days: number[];
  maxPoints: number;
  series: RaceChartSeries[];
};

export type StandingsRaceCardProps = {
  group: StandingsGroup;
  isActive: boolean;
  chartData: StandingsRaceChartData | null;
  userTeamId?: string;
};

const FONT_DISPLAY = "'Funnel Display', sans-serif";
const FONT_MONO = "'DM Mono', monospace";

const CHART_OVERRIDE =
  "rounded-none! border-0! bg-transparent! p-0! shadow-none!";

export function StandingsRaceCard({
  group,
  isActive,
  chartData,
  userTeamId,
}: StandingsRaceCardProps) {
  const leader = group.teams[0];
  return (
    <div className="border-ink bg-card overflow-hidden rounded-[22px] border-2 shadow-[6px_6px_0_var(--color-shadow)]">
      <header className="border-ink bg-paper-deep flex flex-wrap items-center justify-between gap-4 border-b-2 px-5 py-4">
        <div className="flex flex-col gap-[0.15rem]">
          <span
            className="text-mute text-[0.62rem] tracking-[0.18em] uppercase"
            style={{ fontFamily: FONT_MONO }}
          >
            The Race · Live Standings
          </span>
          <h3
            className="m-0 text-[1.25rem] font-extrabold"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {group.tournament.name}
          </h3>
        </div>
        <div className="flex items-center gap-[0.85rem]">
          {leader && (
            <span className="border-ink bg-card inline-flex items-center gap-2 rounded-full border-2 px-[0.7rem] py-[0.3rem] shadow-[3px_3px_0_var(--color-shadow)]">
              <span
                className="text-mute text-[0.58rem] tracking-[0.18em] uppercase"
                style={{ fontFamily: FONT_MONO }}
              >
                Leading
              </span>
              <span
                className="text-[0.85rem] font-bold"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {leader.team.name}
              </span>
              <span
                className="text-sunset text-[0.75rem] font-semibold"
                style={{ fontFamily: FONT_MONO }}
              >
                {leader.team.points} pts
              </span>
            </span>
          )}
          <span
            className={`border-ink text-ink rounded-full border-2 px-[0.65rem] py-[0.22rem] text-[0.65rem] tracking-[0.16em] uppercase ${
              isActive
                ? "bg-grass dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-paper-deep text-mute"
            }`}
            style={{ fontFamily: FONT_MONO }}
          >
            {isActive ? "Active" : "Ended"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 min-[960px]:grid-cols-[1.4fr_1fr] min-[960px]:[grid-template-rows:544px]">
        <div className="min-w-0 px-4 pt-4 pb-2">
          {chartData && chartData.series.length > 0 && (
            <RaceChart
              days={chartData.days}
              series={chartData.series}
              userTeamId={userTeamId}
              className={CHART_OVERRIDE}
            />
          )}
        </div>

        <div className="min-[960px]:border-ink/20 flex min-h-0 flex-col px-[1.1rem] pt-[0.9rem] pb-[1.1rem] min-[960px]:border-l-[1.5px] min-[960px]:border-dashed">
          <div
            className="border-ink/15 text-mute grid grid-cols-[2.5rem_1fr_auto] items-center gap-[0.6rem] border-b-[1.5px] px-1 pb-[0.4rem] text-[0.58rem] tracking-[0.16em] uppercase"
            style={{ fontFamily: FONT_MONO }}
          >
            <span>Rank</span>
            <span>Team</span>
            <span className="text-right">Pts</span>
          </div>
          <div className="-mr-[0.4rem] flex min-h-0 flex-1 flex-col gap-[0.45rem] overflow-y-auto pt-[0.45rem] pr-[0.4rem]">
            {group.teams.map((t, i) => {
              const pct = Math.round((t.team.points / group.maxPts) * 100);
              const rankLabel =
                i === 0
                  ? "🥇"
                  : i === 1
                    ? "🥈"
                    : i === 2
                      ? "🥉"
                      : String(i + 1).padStart(2, "0");
              const isYou = t.team._id === userTeamId;
              const rowBg = isYou
                ? "border-sky bg-sky/10"
                : i < 3
                  ? "border-gold/50 bg-gold/15"
                  : "border-transparent bg-paper-deep";
              return (
                <div
                  key={t.team._id}
                  className={`relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-[0.6rem] rounded-[10px] border-[1.5px] px-[0.55rem] pt-[0.55rem] pb-[0.45rem] ${rowBg}`}
                >
                  <span
                    className="text-center text-[1rem]"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    {rankLabel}
                  </span>
                  <span className="flex min-w-0 items-center gap-[0.45rem]">
                    <span
                      className="truncate text-[0.95rem] font-bold"
                      style={{ fontFamily: FONT_DISPLAY }}
                    >
                      {t.team.name}
                    </span>
                    {t.userRole === "captain" && (
                      <span
                        className="border-gold bg-gold/30 rounded-full border-[1.5px] px-[0.4rem] py-[0.08rem] text-[0.55rem] tracking-[0.14em] whitespace-nowrap uppercase"
                        style={{ fontFamily: FONT_MONO }}
                      >
                        Captain
                      </span>
                    )}
                    {isYou && (
                      <span
                        className="border-ink bg-gold text-ink rounded-full border-[1.5px] px-[0.4rem] py-[0.08rem] text-[0.55rem] font-bold tracking-[0.14em]"
                        style={{ fontFamily: FONT_MONO }}
                      >
                        YOU
                      </span>
                    )}
                  </span>
                  <span
                    className="text-sunset text-right text-[1rem] font-semibold"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    {t.team.points}
                  </span>
                  <span
                    aria-hidden
                    className="bg-ink/10 relative col-span-full mt-[0.3rem] block h-1 overflow-hidden rounded-[2px]"
                  >
                    <span
                      className="from-grass to-sky absolute inset-y-0 left-0 bg-gradient-to-r transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
