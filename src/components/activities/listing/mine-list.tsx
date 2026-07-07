"use client";

import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Sparkles,
  Trophy,
} from "lucide-react";

import { activityStateBadgeVariant } from "@/components/activities/state";
import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { StatsGrid } from "@/components/common/card/stats-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/components/users/utils";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";

type FeedItem = FunctionReturnType<typeof api.views.activities.myFeed>[number];
type ActivityItem = Extract<FeedItem, { kind: "activity" }>;
type ChallengeItem = Extract<FeedItem, { kind: "challenge" }>;
type Participant = ActivityItem["participants"][number];

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

// Activity and Challenge cards share the ComposedCard silhouette; the header
// tint (sunset for activities, plum for challenges) is the primary cue that
// distinguishes the two types at a glance.
function ActivityFeedCard({ item }: { item: ActivityItem }) {
  const { format } = useFormattedDate();
  const { activity, participants } = item;
  const title = activity.description || `Activity on ${activity.date}`;
  const isTeamActivity = activity.type === "group";

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
        className="[&>header]:bg-primary/10 pb-2"
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
        {isTeamActivity && participants.length > 0 && (
          <ParticipantRoster participants={participants} />
        )}
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
        className="[&>header]:bg-social/10 pb-2"
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

// Compact roster for team activities: who took part and whether they've
// provided evidence yet (green check) or are still awaiting it (muted clock).
function ParticipantRoster({ participants }: { participants: Participant[] }) {
  const withEvidence = participants.filter((p) => p.hasEvidence).length;

  return (
    <div className="border-ink/15 flex flex-col gap-2 rounded-md border border-dashed p-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[0.6rem] tracking-[0.15em] uppercase">
          {participants.length}{" "}
          {participants.length === 1 ? "participant" : "participants"}
        </span>
        <span className="text-muted-foreground text-[0.6rem] tracking-[0.15em] uppercase">
          {withEvidence}/{participants.length} evidence
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {participants.map((p) => (
          <li key={p.userId} className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={p.imageUrl} />
              <AvatarFallback className="text-[0.6rem]">
                {getInitials(p.name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {p.name}
            </span>
            {p.hasEvidence ? (
              <span className="text-success flex shrink-0 items-center gap-0.5 text-[0.6rem] font-semibold">
                <Check className="size-3" />
                Evidence
              </span>
            ) : (
              <span className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-[0.6rem] font-semibold">
                <Clock className="size-3" />
                Awaiting
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
