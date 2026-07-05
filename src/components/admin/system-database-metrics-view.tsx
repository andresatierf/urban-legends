import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { SystemMetrics } from "./system-panel-types";

interface SystemDatabaseMetricsViewProps {
  databaseMetrics: SystemMetrics;
}

const ROWS: { label: string; key: keyof SystemMetrics }[] = [
  { label: "Tournaments", key: "tournaments" },
  { label: "Teams", key: "teams" },
  { label: "Submissions", key: "submissions" },
  { label: "Users", key: "users" },
  { label: "Team Members", key: "teamMembers" },
];

export function SystemDatabaseMetricsView({
  databaseMetrics,
}: SystemDatabaseMetricsViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ROWS.map(({ label, key }) => {
          const { total, orphaned } = databaseMetrics[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{label}</span>
                {orphaned > 0 && (
                  <Badge variant="error" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {orphaned} orphaned
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground text-sm">
                {total} total
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
