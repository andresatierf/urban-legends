"use client";

import { useQuery } from "convex/react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface CalendarStatisticsProps {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
}

export function CalendarStatistics({
  teamId,
  tournamentId,
}: CalendarStatisticsProps) {
  const statistics = useQuery(
    api.submissions.getUserStatistics,
    teamId && tournamentId ? { teamId, tournamentId } : "skip",
  );

  if (!statistics) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-2 w-full rounded" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Skeleton className="h-16 rounded" />
            <Skeleton className="h-16 rounded" />
            <Skeleton className="h-16 rounded" />
            <Skeleton className="h-16 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Total Days",
      value: statistics.totalDays,
      color: "text-blue-600",
    },
    {
      label: "Days Submitted",
      value: statistics.daysWithSubmissions,
      color: "text-green-600",
    },
    {
      label: "Current Streak",
      value: `${statistics.currentStreak} 🔥`,
      color: "text-orange-600",
    },
    {
      label: "Completion Rate",
      value: `${statistics.completionRate}%`,
      color: "text-purple-600",
    },
  ];

  const submissionStats = [
    {
      label: "Approved",
      value: statistics.approved,
      color: "text-green-600",
    },
    {
      label: "Pending",
      value: statistics.pending,
      color: "text-yellow-600",
    },
    {
      label: "Rejected",
      value: statistics.rejected,
      color: "text-red-600",
    },
  ];

  const motivationalMessages = [
    {
      condition: statistics.completionRate === 100,
      message: "🎉 Perfect completion! Keep up the amazing work!",
      bgColor: "bg-green-50 dark:bg-green-700/20",
      textColor: "text-green-800 dark:text-green-400",
    },
    {
      condition: statistics.currentStreak >= 7 && statistics.currentStreak < 30,
      message: `🔥 You're on fire! ${statistics.currentStreak} day streak!`,
      bgColor: "bg-orange-50 dark:bg-orange-700/20",
      textColor: "text-orange-800 dark:text-orange-400",
    },
    {
      condition: statistics.currentStreak >= 30,
      message: `👑 Legendary! ${statistics.currentStreak} day streak! You're unstoppable!`,
      bgColor: "bg-purple-50 dark:bg-purple-700/20",
      textColor: "text-purple-800 dark:text-purple-400",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Completion Progress</span>
          <span className="font-semibold text-muted-foreground">
            {statistics.daysWithSubmissions} / {statistics.totalDays} days
          </span>
        </div>
        <Progress value={statistics.completionRate} className="h-3" />

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-background/20 text-center">
              <CardContent>
                <div className={cn("mb-1 font-bold text-2xl", stat.color)}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-xs">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="mb-3 font-medium text-muted-foreground text-sm">
            Submission Status
          </h4>
          <div className="flex gap-6">
            {submissionStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm",
                    "bg-gray-100 dark:bg-background/20",
                    stat.color,
                  )}
                >
                  {stat.value}
                </div>
                <span className="text-muted-foreground/80 text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {motivationalMessages.map(
          (m) =>
            m.condition && (
              <div
                key={m.message}
                className={cn("rounded-md p-3 text-center", m.bgColor)}
              >
                <p className={cn("font-semibold text-sm", m.textColor)}>
                  {m.message}
                </p>
              </div>
            ),
        )}
      </CardContent>
    </Card>
  );
}
