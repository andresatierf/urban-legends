"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemDatabaseMetricsProps {
  databaseMetrics: {
    tournaments: { total: number; orphaned: number };
    teams: { total: number; orphaned: number };
    submissions: { total: number; orphaned: number };
    users: { total: number; orphaned: number };
    teamMembers: { total: number; orphaned: number };
  };
}

export function SystemDatabaseMetrics({
  databaseMetrics,
}: SystemDatabaseMetricsProps) {
  const renderMetric = (label: string, total: number, orphaned: number) => {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {orphaned > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {orphaned} orphaned
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground text-sm">{total} total</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderMetric(
          "Tournaments",
          databaseMetrics.tournaments.total,
          databaseMetrics.tournaments.orphaned,
        )}
        {renderMetric(
          "Teams",
          databaseMetrics.teams.total,
          databaseMetrics.teams.orphaned,
        )}
        {renderMetric(
          "Submissions",
          databaseMetrics.submissions.total,
          databaseMetrics.submissions.orphaned,
        )}
        {renderMetric(
          "Users",
          databaseMetrics.users.total,
          databaseMetrics.users.orphaned,
        )}
        {renderMetric(
          "Team Members",
          databaseMetrics.teamMembers.total,
          databaseMetrics.teamMembers.orphaned,
        )}
      </CardContent>
    </Card>
  );
}
