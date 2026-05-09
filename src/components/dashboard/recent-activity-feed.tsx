import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, UserPlus, Users, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";

interface Activity {
  type: string;
  description: string;
  timestamp: number;
  icon: string;
  link?: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const iconMap = {
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  users: Users,
  "user-plus": UserPlus,
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest updates</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty className="gap-3 p-2!">
            <EmptyTitle>No recent activity</EmptyTitle>
            <EmptyDescription>
              Activity will appear here as you participate in tournaments.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.icon as keyof typeof iconMap];
              const activityKey = `${activity.type}-${activity.timestamp}`;

              return activity.link ? (
                <Link
                  key={activityKey}
                  to={activity.link}
                  className="hover:bg-muted flex gap-3 rounded-md p-2 transition-colors"
                >
                  {Icon && (
                    <div className="mt-0.5">
                      <Icon className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Link>
              ) : (
                <div key={activityKey} className="flex gap-3 rounded-md p-2">
                  {Icon && (
                    <div className="mt-0.5">
                      <Icon className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
