"use client";

import { useQuery } from "convex/react";
import {
  Activity,
  Award,
  Calendar,
  CheckCircle,
  Flame,
  TrendingUp,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { StatCardsGridSkeleton } from "../ui/stat-cards-grid-skeleton";

type Props = {
  teamId: Id<"teams">;
};

export function TeamStatisticsCard({ teamId }: Props) {
  const stats = useQuery(api.teams.getStatistics, { teamId });
  const team = useQuery(api.teams.get, { teamId });
  const users = useQuery(
    api.users.list,
    stats
      ? { userIds: stats.memberContributions.map((c) => c.userId) }
      : "skip",
  );

  const userMap = users?.reduce(
    (map, user) => {
      map[user._id] = user;
      return map;
    },
    {} as Record<Id<"users">, Doc<"users">>,
  );

  if (stats === undefined || team === undefined) {
    return (
      <StatCardsGridSkeleton
        count={6}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      />
    );
  }

  if (stats === null || team === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">
            Failed to load team statistics. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Points",
      value: team.points,
      icon: Award,
      description: `From ${stats.approvedSubmissions} approved submissions`,
      color: "text-yellow-600",
    },
    {
      title: "Approval Rate",
      value: `${(stats.approvalRate * 100).toFixed(1)}%`,
      icon: CheckCircle,
      description: `${stats.approvedSubmissions}/${stats.totalSubmissions} submissions approved`,
      color: "text-green-600",
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: Flame,
      description: "Consecutive days with submissions",
      color: "text-orange-600",
    },
    {
      title: "Avg Points/Day",
      value: stats.averagePointsPerDay.toFixed(2),
      icon: TrendingUp,
      description: `Over ${stats.daysSoFar} days`,
      color: "text-blue-600",
    },
    {
      title: "Completion Rate",
      value: `${(stats.completionRate * 100).toFixed(1)}%`,
      icon: Calendar,
      description: `${Math.floor(stats.completionRate * stats.daysSoFar)}/${stats.daysSoFar} days with submissions`,
      description2: (() => {
        const daysWithSubmissions = Math.floor(
          stats.completionRate * stats.daysSoFar,
        );
        return `${daysWithSubmissions}/${stats.daysSoFar} days with submissions`;
      })(),
      color: "text-purple-600",
    },
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      icon: Activity,
      description: `${stats.approvedSubmissions} approved, ${stats.pendingSubmissions ?? "unknown"} pending, ${stats.rejectedSubmissions ?? "unknown"} rejected`,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-muted-foreground text-xs">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.memberContributions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No contributions yet
            </p>
          ) : (
            <div className="space-y-4">
              {stats.memberContributions
                .toSorted((a, b) => b.count - a.count)
                .map((contribution) => {
                  const user = userMap?.[contribution.userId];

                  const percentage =
                    stats.approvedSubmissions > 0
                      ? (contribution.count / stats.approvedSubmissions) * 100
                      : 0;

                  return (
                    <div key={contribution.userId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {user
                            ? `${user.name} (${user?.email})`
                            : contribution.userId}
                        </span>
                        <span className="text-muted-foreground">
                          {contribution.count} submissions (
                          {percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
