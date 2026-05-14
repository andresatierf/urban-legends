import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const data = useQuery(api.dashboard.getDashboardData);

  if (data === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <DashboardLayout data={data} />;
}
