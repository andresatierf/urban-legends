"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Calendar, Sparkles, Trophy } from "lucide-react";

import { activityStateBadgeVariant } from "@/components/activities/state";
import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormattedDate } from "@/hooks/useFormattedDate";

import { api } from "../../../../convex/_generated/api";

type FeedItem = FunctionReturnType<typeof api.views.activities.myFeed>[number];
type ActivityItem = Extract<FeedItem, { kind: "activity" }>;
type ChallengeItem = Extract<FeedItem, { kind: "challenge" }>;

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
    <div className="grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
      {feed.map((item) =>
        item.kind === "activity" ? (
          <ActivityFeedCard key={`activity-${item.activity._id}`} item={item} />
        ) : (
          <ChallengeFeedCard
            key={`challenge-${item.challenge._id}`}
            item={item}
          />
        ),
      )}
    </div>
  );
}

function ActivityFeedCard({ item }: { item: ActivityItem }) {
  const { format } = useFormattedDate();
  const { activity } = item;
  const title = activity.description || `Activity on ${activity.date}`;

  return (
    <EdgeOverlay
      bottomRight={
        <Button asChild size="sm" className="shadow-sm">
          <Link
            to="/activities/$activityId"
            params={{ activityId: activity._id }}
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <ComposedCard
        className="pb-2"
        title={title}
        eyebrow={format(activity.date, "long")}
        badge={[
          {
            variant: activity.tier === "advanced" ? "social" : "info",
            children: activity.tier,
          },
          {
            variant: activityStateBadgeVariant(activity.state),
            children: activity.state,
          },
        ]}
      >
        <StatsGrid
          variant="strip"
          className="grid-cols-1"
          items={[
            {
              icon: Trophy,
              value: activity.pointsEarned,
              label: activity.pointsEarned === 1 ? "Point" : "Points",
            },
          ]}
        />
      </ComposedCard>
    </EdgeOverlay>
  );
}

function ChallengeFeedCard({ item }: { item: ChallengeItem }) {
  const { format } = useFormattedDate();
  const { challenge, award, team, sortDate } = item;
  const isApproved = challenge.state === "approved";

  return (
    <EdgeOverlay
      bottomRight={
        <Button asChild size="sm" className="shadow-sm">
          <Link
            to="/challenges/$challengeId"
            params={{ challengeId: challenge._id }}
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <ComposedCard
        className="pb-2"
        title={challenge.description}
        eyebrow={format(sortDate, "long")}
        badge={[
          {
            variant: "social",
            children: (
              <>
                <Sparkles className="size-3" />
                Challenge
              </>
            ),
          },
          {
            variant: isApproved ? "success" : "warning",
            children: isApproved ? "approved" : "awaiting approval",
          },
        ]}
      >
        <StatsGrid
          variant="strip"
          className="grid-cols-1"
          items={[
            {
              icon: Trophy,
              value: award ? `+${award.amount}` : "—",
              label: award ? `Points to ${team.name}` : "Awaiting approval",
            },
          ]}
        />
      </ComposedCard>
    </EdgeOverlay>
  );
}
