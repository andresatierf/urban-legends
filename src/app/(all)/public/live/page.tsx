"use client";

import { useQuery } from "convex/react";
import { LiveActivityFeed } from "@/components/public/live-activity-feed";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";

export default function LiveTournaments() {
  const liveFeed = useQuery(api.publicQueries.getLiveTournamentFeed, {
    limit: 30,
  });

  return (
    <>
      <SectionHeader
        as="h1"
        title="Live Tournaments"
        description="Real-time feed of recent submissions across active tournaments"
      />

      {liveFeed === undefined ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <LiveActivityFeed activities={liveFeed} />
      )}
    </>
  );
}
