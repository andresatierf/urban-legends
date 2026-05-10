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
  tournamentId: Id<"tournaments">;
};

export function PerformanceCard({ teamId, tournamentId }: Props) {
  const stats = useQuery(api.teams.getStatistics, { teamId });
  const tournamentTeams = useQuery(api.teams.list, { tournamentId });

  if (!stats || !tournamentTeams) return null;

  const ranked = [...tournamentTeams].sort((a, b) => b.points - a.points);
  const rank = ranked.findIndex((t) => t._id === teamId) + 1;
  const totalTeams = ranked.length;

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
            value: `#${rank} / ${totalTeams}`,
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
