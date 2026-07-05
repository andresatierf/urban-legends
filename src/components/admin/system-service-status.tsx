"use client";

import { useQuery } from "convex/react";

import { Skeleton } from "@/components/ui/skeleton";

import { api } from "../../../convex/_generated/api";
import { SystemServiceStatusView } from "./system-service-status-view";

export function SystemServiceStatus() {
  const systemHealth = useQuery(api.role.admin.getSystemHealth);

  if (!systemHealth) {
    return <Skeleton className="h-64" />;
  }

  return <SystemServiceStatusView services={systemHealth.services} />;
}
