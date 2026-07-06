"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Calendar, Trophy } from "lucide-react";

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
  const feed = useQuery(api.views.activities.myFeed, {});

  if (feed === undefined) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (feed.length === 0) {
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {feed.map((item) =>
        item.kind === "activity" ? (
          <Link
            key={`activity-${item.activity._id}`}
            to="/activities/$activityId"
            params={{ activityId: item.activity._id }}
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={activityStateBadgeVariant(item.activity.state)}
                  >
                    {item.activity.state}
                  </Badge>
                  <Badge
                    variant={
                      item.activity.tier === "advanced" ? "social" : "info"
                    }
                  >
                    {item.activity.tier}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.activity.date}</p>
                  {item.activity.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {item.activity.description}
                    </p>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {item.activity.pointsEarned} pts
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card key={`challenge-${item.challenge._id}`}>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="social">
                  <Trophy className="size-3" />
                  Challenge
                </Badge>
                <Badge
                  variant={
                    item.challenge.state === "approved" ? "success" : "warning"
                  }
                >
                  {item.challenge.state === "approved"
                    ? "approved"
                    : "awaiting approval"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {item.challenge.description}
                </p>
              </div>
              <div className="text-muted-foreground text-xs">
                {item.award
                  ? `+${item.award.amount} pts to ${item.team.name}`
                  : "Awaiting approval"}
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
