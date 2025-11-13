"use client";

import { useQuery } from "convex/react";
import { Progress } from "@/components/ui/progress";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";
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
    api.submissions.getTeamStatistics,
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

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-lg">Progress Statistics</h3>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Completion Progress</span>
          <span className="font-semibold text-gray-900">
            {statistics.daysWithSubmissions} / {statistics.totalDays} days
          </span>
        </div>
        <Progress value={statistics.completionRate} className="h-3" />
      </div>

      {/* Key metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-gray-50 p-4 text-center"
          >
            <div className={`mb-1 font-bold text-2xl ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-gray-600 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Submission breakdown */}
      <div>
        <h4 className="mb-3 font-medium text-gray-700 text-sm">
          Submission Status
        </h4>
        <div className="flex gap-6">
          {submissionStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-semibold text-sm ${stat.color}`}
              >
                {stat.value}
              </div>
              <span className="text-gray-600 text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational message */}
      {statistics.completionRate === 100 && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-center">
          <p className="font-semibold text-green-800 text-sm">
            🎉 Perfect completion! Keep up the amazing work!
          </p>
        </div>
      )}

      {statistics.currentStreak >= 7 && statistics.currentStreak < 30 && (
        <div className="mt-4 rounded-md bg-orange-50 p-3 text-center">
          <p className="font-semibold text-orange-800 text-sm">
            🔥 You're on fire! {statistics.currentStreak} day streak!
          </p>
        </div>
      )}

      {statistics.currentStreak >= 30 && (
        <div className="mt-4 rounded-md bg-purple-50 p-3 text-center">
          <p className="font-semibold text-purple-800 text-sm">
            👑 Legendary! {statistics.currentStreak} day streak! You're
            unstoppable!
          </p>
        </div>
      )}
    </div>
  );
}
