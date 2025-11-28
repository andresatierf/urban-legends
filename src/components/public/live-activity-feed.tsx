"use client";

import { formatDistanceToNow } from "date-fns";
import { Trophy, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  user: { name: string } | null;
  team: { name: string; points: number } | null;
  tournament: { name: string } | null;
  tier: "base" | "advanced";
  pointsEarned: number;
  submissionType: "individual" | "team";
  timestamp: string;
}

interface LiveActivityFeedProps {
  activities: ActivityItem[];
}

export function LiveActivityFeed({ activities }: LiveActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            {activity.submissionType === "team" ? (
              <Users className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm">
                <span className="font-medium">
                  {activity.user?.name || "Unknown user"}
                </span>{" "}
                submitted for{" "}
                <span className="font-medium">
                  {activity.team?.name || "Unknown team"}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
                  <Trophy className="mr-1 h-3 w-3" />
                  {activity.tournament?.name || "Unknown tournament"}
                </Badge>
                <Badge
                  variant={
                    activity.tier === "advanced" ? "secondary" : "outline"
                  }
                  className="text-xs"
                >
                  {activity.tier === "advanced" ? "Advanced" : "Base"} Tier
                </Badge>
                <Badge
                  variant={
                    activity.submissionType === "team" ? "secondary" : "outline"
                  }
                  className="text-xs"
                >
                  {activity.submissionType === "team"
                    ? "Team Activity"
                    : "Individual"}
                </Badge>
                <span className="text-muted-foreground">
                  +{activity.pointsEarned} points
                </span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
