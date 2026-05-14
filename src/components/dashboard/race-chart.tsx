"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartContext,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const RACE_COLORS = [
  "#ff7a45", // sunset
  "#5db9f5", // sky
  "#5dc77a", // grass
  "#a166d4", // plum
  "#ffc847", // gold
  "#cd9352", // bronze
];

export type RaceChartSeries = {
  teamId: string;
  teamName: string;
  points: number[];
  total: number;
};

export type RaceChartProps = {
  days: number[];
  series: RaceChartSeries[];
  userTeamId?: string;
  className?: string;
};

export function RaceChart({
  days,
  series,
  userTeamId,
  className,
}: RaceChartProps) {
  // Pivot: one row per day, one numeric key per team
  const data = days.map((ms, i) => {
    const d = new Date(ms);
    const row: Record<string, number | string> = {
      day: `${d.getMonth() + 1}/${d.getDate()}`,
    };
    for (const s of series) {
      row[s.teamId] = Math.round(s.points[i] ?? 0);
    }
    return row;
  });

  const config: ChartConfig = Object.fromEntries(
    series.map((s, idx) => [
      s.teamId,
      {
        label: <span className="font-medium">{s.teamName}</span>,
        color: RACE_COLORS[idx % RACE_COLORS.length],
      },
    ]),
  );

  const userSeries = userTeamId
    ? series.find((s) => s.teamId === userTeamId)
    : undefined;

  const legendPayload = series.map((s, idx) => ({
    value: s.teamId,
    dataKey: s.teamId,
    color: RACE_COLORS[idx % RACE_COLORS.length],
    type: "square" as const,
  }));

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "border-fab-ink bg-fab-surface rounded-[18px] border-2 px-5 pt-4 pb-[1.1rem] shadow-[5px_5px_0_var(--color-fab-shadow)]",
          className,
        )}
      >
        <ChartContainer config={config} className="h-[480px] w-full">
          <LineChart
            data={data}
            margin={{ top: 12, right: 56, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 4"
              stroke="var(--color-fab-grid)"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "var(--color-fab-ink)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              tick={{ fill: "var(--color-fab-ink)" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent className="border-fab-ink text-fab-ink bg-fab-surface [&_.shrink-0]:!border-fab-ink min-w-44 !rounded-[14px] border-2 !shadow-[4px_4px_0_var(--color-fab-shadow)] [&_.justify-between]:!gap-4 [&_.shrink-0]:!h-3 [&_.shrink-0]:!w-3 [&_.shrink-0]:!rounded-[4px] [&_.shrink-0]:!border-2" />
              }
            />
            {userSeries && (
              <ReferenceLine
                y={userSeries.total}
                stroke="var(--color-fab-ink)"
                strokeDasharray="5 4"
                strokeOpacity={0.55}
                label={(props: {
                  viewBox?: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                  };
                }) => {
                  const vb = props.viewBox;
                  if (!vb) return <g />;
                  const rightX = vb.x + vb.width;
                  const flagX = rightX + 4;
                  const flagW = 48;
                  const cy = vb.y;
                  const points = `${flagX},${cy} ${flagX + 6},${cy - 11} ${flagX + flagW},${cy - 11} ${flagX + flagW},${cy + 11} ${flagX + 6},${cy + 11}`;
                  return (
                    <g>
                      <polygon
                        points={points}
                        className="fill-fab-gold stroke-[#2a1f1a] [stroke-width:1.5] [stroke-linejoin:round]"
                      />
                      <text
                        x={flagX + 11}
                        y={cy - 1}
                        className="fill-[#2a1f1a] text-[9.5px] font-extrabold tracking-[1.1px]"
                      >
                        YOU
                      </text>
                      <text
                        x={flagX + 11}
                        y={cy + 9}
                        className="fill-[#2a1f1a] text-[10px]"
                      >
                        {userSeries.total}
                      </text>
                    </g>
                  );
                }}
              />
            )}
            {series.map((s) => {
              const lastIdx = data.length - 1;
              return (
                <Line
                  key={s.teamId}
                  dataKey={s.teamId}
                  type="linear"
                  stroke={`var(--color-${s.teamId})`}
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, index, stroke } = props as {
                      cx?: number;
                      cy?: number;
                      index?: number;
                      stroke?: string;
                    };
                    if (index !== lastIdx || cx == null || cy == null) {
                      return <g />;
                    }
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={stroke}
                        className="stroke-fab-ink [stroke-width:1.5]"
                      />
                    );
                  }}
                  activeDot={{ r: 4 }}
                />
              );
            })}
          </LineChart>
        </ChartContainer>
        <ChartLegendContent
          payload={legendPayload}
          className="text-fab-ink [&>div>div]:border-fab-ink mt-2 flex-wrap !justify-start gap-x-4 gap-y-2 !pt-0 text-[0.82rem] [&>div]:!gap-1.5 [&>div>div]:!h-3 [&>div>div]:!w-3 [&>div>div]:!rounded-[4px] [&>div>div]:border-2"
        />
      </div>
    </ChartContext.Provider>
  );
}
