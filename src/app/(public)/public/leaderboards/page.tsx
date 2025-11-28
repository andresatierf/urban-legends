"use client";

import { useQuery } from "convex/react";
import { PublicLeaderboardCard } from "@/components/public/public-leaderboard-card";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";

export default function PublicLeaderboards() {
  const leaderboards = useQuery(api.publicQueries.getPublicLeaderboards);

  return (
    <>
      <SectionHeader
        as="h1"
        title="Public Leaderboards"
        description="View top teams across all active tournaments"
      />

      {leaderboards === undefined ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : leaderboards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No active tournaments at the moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {leaderboards.map((lb) => (
            <PublicLeaderboardCard
              key={lb.tournament._id}
              tournament={lb.tournament}
              leaderboard={lb.leaderboard}
              totalTeams={lb.totalTeams}
            />
          ))}
        </div>
      )}
    </>
  );
}
