"use client";

import { Eyebrow } from "@/components/ui/eyebrow";

interface AdminStatsCardsProps {
  stats: {
    totalUsers: number;
    totalTournaments: number;
    totalTeams: number;
    totalSubmissions: number;
  };
}

type Stats = AdminStatsCardsProps["stats"];

const statCards: {
  label: string;
  description: string;
  accent: string;
  statKey: keyof Stats;
}[] = [
  {
    label: "Users",
    description: "Total registered users",
    accent: "var(--info)",
    statKey: "totalUsers",
  },
  {
    label: "Tournaments",
    description: "All tournaments in system",
    accent: "var(--social)",
    statKey: "totalTournaments",
  },
  {
    label: "Teams",
    description: "Active teams across all tournaments",
    accent: "var(--success)",
    statKey: "totalTeams",
  },
  {
    label: "Submissions",
    description: "Total submissions received",
    accent: "var(--primary)",
    statKey: "totalSubmissions",
  },
];

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <div
          key={card.statKey}
          className="border-ink bg-card flex flex-col gap-[0.2rem] overflow-hidden rounded-xl border-2 p-4 shadow-md transition-[transform,box-shadow] duration-[120ms] ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ "--metric-accent": card.accent } as React.CSSProperties}
        >
          <div
            aria-hidden
            className="-mx-4 -mt-1 mb-[0.6rem] h-1 rounded-xs [background:repeating-linear-gradient(90deg,var(--metric-accent,var(--gold))_0px,var(--metric-accent,var(--gold))_8px,transparent_8px,transparent_14px)]"
          />
          <Eyebrow>{card.label}</Eyebrow>
          <span className="text-ink text-display">{stats[card.statKey]}</span>
          <Eyebrow>{card.description}</Eyebrow>
        </div>
      ))}
    </div>
  );
}
