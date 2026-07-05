"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Calendar } from "lucide-react";

import { activityStateBadgeVariant } from "@/components/activities/state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";

export function MyActivitiesList() {
  const activities = useQuery(api.activities.listMine, {});

  if (activities === undefined) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty className="gap-3 py-8!">
            <EmptyMedia>
              <Calendar className="text-muted-foreground size-12" />
            </EmptyMedia>
            <EmptyHeader>No activities yet</EmptyHeader>
            <EmptyDescription>
              Create an activity from the + button to track your first entry.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const sorted = activities.toSorted((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((activity) => (
        <Link
          key={activity._id}
          to="/activities/$activityId"
          params={{ activityId: activity._id }}
        >
          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={activityStateBadgeVariant(activity.state)}>
                  {activity.state}
                </Badge>
                <Badge
                  variant={activity.tier === "advanced" ? "social" : "info"}
                >
                  {activity.tier}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{activity.date}</p>
                {activity.description && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {activity.description}
                  </p>
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                {activity.pointsEarned} pts
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
