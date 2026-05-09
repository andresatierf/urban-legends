import { StatCard } from "@/components/stat-card";
import { SvgIcon } from "@/components/svg-icon";

import type { Doc } from "../../../convex/_generated/dataModel";

interface UserStatsGridProps {
  data: {
    teams: { team: Doc<"teams"> }[];
    activeTournamentsCount: number;
    pendingSubmissionsCount: number;
  };
}

export function UserStatsGrid({ data }: UserStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard title="My Teams" value={data.teams.length}>
        <SvgIcon variant="blue">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </SvgIcon>
      </StatCard>
      <StatCard title="Active Tournaments" value={data.activeTournamentsCount}>
        <SvgIcon variant="green">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </SvgIcon>
      </StatCard>
      <StatCard
        title="Pending Submissions"
        value={data.pendingSubmissionsCount}
      >
        <SvgIcon variant="yellow">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </SvgIcon>
      </StatCard>
    </div>
  );
}
