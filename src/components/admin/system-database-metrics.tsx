"use client";

import { useQuery } from "convex/react";

import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../convex/_generated/api";
import { SystemDatabaseMetricsView } from "./system-database-metrics-view";

export function SystemDatabaseMetrics() {
  const systemHealth = useQuery(api.role.admin.getSystemHealth);

  if (!systemHealth) {
    return <Skeleton className="h-96" />;
  }

  return (
    <SystemDatabaseMetricsView databaseMetrics={systemHealth.databaseMetrics} />
  );
}
