"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export function AdminRecentActivityFeed({
  activities,
}: AdminRecentActivityFeedProps) {
  const getActivityIcon = (state: string) => {
    if (state === "approved") {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (state === "rejected") {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (state === "pending") {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getStateBadgeVariant = (
    state: string,
  ):
    | "approved"
    | "rejected"
    | "pending"
    | "deleted"
    | "outline"
    | "default"
    | "secondary"
    | "destructive" => {
    if (state === "approved") return "approved";
    if (state === "rejected") return "rejected";
    if (state === "pending") return "pending";
    if (state === "deleted") return "deleted";
    return "outline";
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="h-96 overflow-y-auto">
      <div className="space-y-4 pr-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
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
                <Badge
                  variant={getStateBadgeVariant(activity.state)}
                  className="text-xs"
                >
                  {activity.state}
                </Badge>
                {activity.tournament && (
                  <Badge variant="outline" className="text-xs">
                    {activity.tournament.name}
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
