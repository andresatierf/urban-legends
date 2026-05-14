"use client";

import { ComposedCard } from "@/components/common/card/composed-card";
import type { BadgeProps } from "@/components/ui/badge";

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

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;

const CHART_OVERRIDE =
  "rounded-none! border-0! bg-transparent! p-0! shadow-none!";

export function StandingsRaceCard({
  group,
  isActive,
  chartData,
  userTeamId,
}: StandingsRaceCardProps) {
  const leader = group.teams[0];
  const badge: BadgeProps[] = [];
  if (leader) {
    badge.push({
      variant: "neutral",
      size: "lg",
      children: (
        <span className="inline-flex items-center gap-2">
          <span className="text-mute text-label-caps">Leading</span>
          <span className="font-heading text-sm font-bold">
            {leader.team.name}
          </span>
          <span className="text-sunset font-mono text-xs font-semibold">
            {leader.team.points} pts
          </span>
        </span>
      ),
    });
  }
  badge.push({
    variant: isActive ? "success" : "neutral",
    size: "lg",
    children: isActive ? "Active" : "Ended",
  });
  return (
    <ComposedCard
      bodyClassName="p-0"
      eyebrow="The Race · Live Standings"
      title={group.tournament.name}
      titleSize="lg"
      badge={badge}
    >
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
          <div className="border-ink/15 text-mute text-label-caps grid grid-cols-[2.5rem_1fr_auto] items-center gap-[0.6rem] border-b-[1.5px] px-1 pb-[0.4rem]">
            <span>Rank</span>
            <span>Team</span>
            <span className="text-right">Pts</span>
          </div>
          <div className="-mr-[0.4rem] flex min-h-0 flex-1 flex-col gap-[0.45rem] overflow-y-auto pt-[0.45rem] pr-[0.4rem]">
            {group.teams.map((t, i) => {
              const pct = Math.round((t.team.points / group.maxPts) * 100);
              const rankLabel =
                RANK_MEDALS[i] ?? String(i + 1).padStart(2, "0");
              const isYou = t.team._id === userTeamId;
              const rowBg = isYou
                ? "border-sky bg-sky/10"
                : i < 3
                  ? "border-gold/50 bg-gold/15"
                  : "border-transparent bg-paper-deep";
              return (
                <div
                  key={t.team._id}
                  className={`relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-[0.6rem] rounded-md border-[1.5px] px-[0.55rem] pt-[0.55rem] pb-[0.45rem] ${rowBg}`}
                >
                  <span className="text-center font-mono text-[1rem]">
                    {rankLabel}
                  </span>
                  <span className="flex min-w-0 items-center gap-[0.45rem]">
                    <span className="font-heading truncate text-base font-bold">
                      {t.team.name}
                    </span>
                    {t.userRole === "captain" && (
                      <span className="border-gold bg-gold/30 text-label-caps rounded-full border-[1.5px] px-[0.4rem] py-[0.08rem] whitespace-nowrap">
                        Captain
                      </span>
                    )}
                    {isYou && (
                      <span className="border-ink bg-gold text-ink text-label-caps rounded-full border-[1.5px] px-[0.4rem] py-[0.08rem] font-bold">
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="text-sunset text-right font-mono text-[1rem] font-semibold">
                    {t.team.points}
                  </span>
                  <span
                    aria-hidden
                    className="bg-ink/10 relative col-span-full mt-[0.3rem] block h-1 overflow-hidden rounded-xs"
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
    </ComposedCard>
  );
}
