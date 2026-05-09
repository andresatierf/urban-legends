import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { SystemActionsPanel } from "@/components/admin/system-actions-panel";
import { SystemDatabaseMetrics } from "@/components/admin/system-database-metrics";
import { SystemServiceStatus } from "@/components/admin/system-service-status";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";

import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_protected/admin/system")({
  component: SystemHealth,
});

function SystemHealth() {
  const { user, isAdmin } = useUser();
  const navigate = useNavigate();
  const systemHealth = useQuery(api.role.admin.getSystemHealth);

  useEffect(() => {
    if (user && !isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, isAdmin, navigate]);

  return (
    <>
      <SectionHeader
        as="h1"
        title="System Health"
        description="Monitor platform status and data integrity"
      />

      {systemHealth ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SystemServiceStatus services={systemHealth.services} />
          <SystemActionsPanel />
          <div className="lg:col-span-2">
            <SystemDatabaseMetrics
              databaseMetrics={systemHealth.databaseMetrics}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      )}
    </>
  );
}
