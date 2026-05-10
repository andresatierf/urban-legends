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
            iconColor: "text-amber-500",
            label: "Rank",
            value: `#${stats.rank} / ${stats.totalTeams}`,
          },
          {
            icon: Flame,
            iconColor: "text-orange-600",
            label: "Streak",
            value: `${stats.currentStreak}d`,
          },
          {
            icon: Calendar,
            iconColor: "text-purple-600",
            label: "Completion",
            value: `${(stats.completionRate * 100).toFixed(0)}%`,
          },
          {
            icon: TrendingUp,
            iconColor: "text-blue-600",
            label: "Pts/day",
            value: stats.averagePointsPerDay.toFixed(1),
          },
        ],
        [
          {
            icon: CheckCircle,
            iconColor: "text-green-600",
            label: "Approved",
            value: String(stats.approvedSubmissions),
          },
          {
            icon: Activity,
            iconColor: "text-yellow-600",
            label: "Pending",
            value: String(stats.pendingSubmissions),
          },
          {
            icon: Activity,
            iconColor: "text-red-600",
            label: "Rejected",
            value: String(stats.rejectedSubmissions),
          },
        ],
      ]}
    />
  );
}
