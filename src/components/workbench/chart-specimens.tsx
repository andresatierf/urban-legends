"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { SectionHeader } from "@/components/section-header";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Specimen } from "./shells/specimen";

const DAILY_DATA = [
  { day: "Mon", approved: 6, rejected: 1 },
  { day: "Tue", approved: 4, rejected: 2 },
  { day: "Wed", approved: 8, rejected: 0 },
  { day: "Thu", approved: 3, rejected: 1 },
  { day: "Fri", approved: 9, rejected: 2 },
  { day: "Sat", approved: 5, rejected: 0 },
  { day: "Sun", approved: 7, rejected: 1 },
];

const LINE_CONFIG: ChartConfig = {
  approved: {
    label: "Approved",
    color: "var(--color-chart-1)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--color-chart-2)",
  },
};

const BAR_CONFIG: ChartConfig = {
  approved: {
    label: "Approved",
    color: "var(--color-chart-3)",
  },
};

const PIE_DATA = [
  { name: "Approved", value: 42, fill: "var(--color-chart-1)" },
  { name: "Pending", value: 14, fill: "var(--color-chart-2)" },
  { name: "Rejected", value: 6, fill: "var(--color-chart-3)" },
];

const PIE_CONFIG: ChartConfig = {
  Approved: { label: "Approved", color: "var(--color-chart-1)" },
  Pending: { label: "Pending", color: "var(--color-chart-2)" },
  Rejected: { label: "Rejected", color: "var(--color-chart-3)" },
};

export function ChartSpecimens() {
  return (
    <div className="space-y-12">
      <SectionHeader
        as="h1"
        title="Chart"
        description="The shadcn/recharts wrapper (ChartContainer + tooltip/legend slots). Configs map series keys to colors and labels."
      />

      <Specimen
        label="Line · tooltip + legend"
        description="Cartesian grid, axis ticks, tooltip dot indicator, bottom legend."
      >
        <ChartContainer config={LINE_CONFIG} className="h-[260px] w-full">
          <LineChart data={DAILY_DATA} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="approved"
              stroke="var(--color-approved)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="rejected"
              stroke="var(--color-rejected)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </Specimen>

      <Specimen
        label="Bar · single series"
        description="Approved submissions per day, dashed-indicator tooltip."
      >
        <ChartContainer config={BAR_CONFIG} className="h-[220px] w-full">
          <BarChart data={DAILY_DATA} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="approved"
              fill="var(--color-approved)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </Specimen>

      <Specimen
        label="Pie · categorical breakdown"
        description="Sectors with hide-label tooltip and legend."
      >
        <ChartContainer config={PIE_CONFIG} className="h-[260px] w-full">
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <Pie
              data={PIE_DATA}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </Specimen>

      <Specimen
        label="Empty config"
        description="No color overrides: ChartStyle injects nothing, recharts defaults take over."
      >
        <ChartContainer config={{}} className="h-[160px] w-full">
          <LineChart data={DAILY_DATA} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <Line dataKey="approved" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </Specimen>
    </div>
  );
}
