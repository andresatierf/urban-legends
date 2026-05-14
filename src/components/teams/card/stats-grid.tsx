import { Eyebrow } from "@/components/ui/eyebrow";

import type { TeamCardData } from "./types";

export function StatsGrid({ data }: { data: TeamCardData }) {
  const { team, memberCount } = data;
  const fillPct = team.maxMembers
    ? Math.min(100, (memberCount / team.maxMembers) * 100)
    : 0;

  const items = [
    {
      value: memberCount,
      label: team.maxMembers ? `of ${team.maxMembers}` : "Members",
    },
    { value: team.points.toLocaleString(), label: "Points" },
    {
      value: team.maxMembers ? `${Math.round(fillPct)}%` : "—",
      label: "Capacity",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-ink bg-card shadow-fd-xs flex flex-col items-center rounded-md border-2 py-2 text-center"
        >
          <span className="text-metric text-sm font-semibold">
            {item.value}
          </span>
          <Eyebrow>{item.label}</Eyebrow>
        </div>
      ))}
    </div>
  );
}
