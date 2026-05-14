"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

import type { Doc } from "../../../convex/_generated/dataModel";

interface ActivityItem {
  id: string;
  type: "submission";
  state: string;
  submitter: Doc<"users"> | null;
  team: Doc<"teams"> | null;
  tournament: Doc<"tournaments"> | null;
  createdAt: string;
}

interface AdminRecentActivityFeedProps {
  activities: ActivityItem[];
}

function getActivityIcon(state: string) {
  if (state === "approved") {
    return <CheckCircle className="text-success h-4 w-4" />;
  }
  if (state === "rejected") {
    return <XCircle className="text-destructive h-4 w-4" />;
  }
  if (state === "pending") {
    return <Clock className="text-warning h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
}

function getStateBadgeVariant(
  state: string,
): "success" | "warning" | "error" | "neutral" {
  if (state === "approved") return "success";
  if (state === "rejected") return "error";
  if (state === "pending") return "warning";
  return "neutral";
}

export function AdminRecentActivityFeed({
  activities,
}: AdminRecentActivityFeedProps) {
  return (
    <Card className="shadow-fd-md">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="h-96 overflow-y-auto">
            <div className="space-y-4 pr-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                    {getActivityIcon(activity.state)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      {activity.submitter?.name || "Unknown user"} submitted to{" "}
                      <span className="font-medium">
                        {activity.team?.name || "Unknown team"}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getStateBadgeVariant(activity.state)}>
                        {activity.state}
                      </Badge>
                      {activity.tournament && (
                        <Badge variant="neutral">
                          {activity.tournament.name}
                        </Badge>
                      )}
                      <Eyebrow>
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </Eyebrow>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
