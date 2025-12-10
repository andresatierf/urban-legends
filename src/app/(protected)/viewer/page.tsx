"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentDiscoveryCard } from "@/components/viewer/tournament-discovery-card";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";

export default function ViewerDashboard() {
  const { user } = useUser();
  const router = useRouter();

  const dashboardData = useQuery(api.role.viewer.getDashboardData);

  useEffect(() => {
    if (user === null) {
      router.replace("/sign-in");
    }
  }, [user, router]);

  return (
    <>
      <SectionHeader
        as="h1"
        title="Viewer Dashboard"
        description="Discover and follow active tournaments"
      />

      {dashboardData === undefined ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : dashboardData.tournaments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No active tournaments at the moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {dashboardData.tournaments.map((item) => (
            <TournamentDiscoveryCard
              key={item.tournament._id}
              tournament={item.tournament}
              teamCount={item.teamCount}
              topTeam={item.topTeam}
            />
          ))}
        </div>
      )}
    </>
  );
}
