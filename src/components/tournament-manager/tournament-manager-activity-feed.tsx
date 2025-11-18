"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  type: string;
  description: string;
  timestamp: number;
  tournamentName?: string;
}

interface TournamentManagerActivityFeedProps {
  activities: Activity[];
}

export function TournamentManagerActivityFeed({
  activities,
}: TournamentManagerActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    if (type === "team_created") {
      return <Users className="h-4 w-4" />;
    }
    if (type === "submission_approved") {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (type === "submission_rejected") {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <Users className="h-4 w-4" />;
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
        {activities.map((activity, index) => (
          <div
            key={`${activity.type}-${activity.timestamp}-${index}`}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">{activity.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                {activity.tournamentName && (
                  <Badge variant="outline" className="text-xs">
                    {activity.tournamentName}
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
