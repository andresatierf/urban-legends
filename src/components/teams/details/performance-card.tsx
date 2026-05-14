import { useQuery } from "convex/react";
import {
  Activity,
  Calendar,
  CheckCircle,
  Flame,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { SidebarCard } from "../../ui/sidebar-card";

type Props = {
  teamId: Id<"teams">;
};

export function PerformanceCard({ teamId }: Props) {
  const stats = useQuery(api.teams.getStatistics, { teamId });

  if (!stats) return null;

  return (
    <SidebarCard
      title="Performance"
      description={`Day ${stats.daysSoFar} of ${stats.tournamentDays}`}
      stats={[
        [
          {
            icon: Trophy,
            iconColor: "text-warning",
            label: "Rank",
            value: `#${stats.rank} / ${stats.totalTeams}`,
          },
          {
            icon: Flame,
            iconColor: "text-primary",
            label: "Streak",
            value: `${stats.currentStreak}d`,
          },
          {
            icon: Calendar,
            iconColor: "text-social",
            label: "Completion",
            value: `${(stats.completionRate * 100).toFixed(0)}%`,
          },
          {
            icon: TrendingUp,
            iconColor: "text-info",
            label: "Pts/day",
            value: stats.averagePointsPerDay.toFixed(1),
          },
        ],
        [
          {
            icon: CheckCircle,
            iconColor: "text-success",
            label: "Approved",
            value: String(stats.approvedSubmissions),
          },
          {
            icon: Activity,
            iconColor: "text-warning",
            label: "Pending",
            value: String(stats.pendingSubmissions),
          },
          {
            icon: Activity,
            iconColor: "text-destructive",
            label: "Rejected",
            value: String(stats.rejectedSubmissions),
          },
        ],
      ]}
    />
  );
}
