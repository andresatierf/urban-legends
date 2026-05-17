import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SystemActionsPanel } from "@/components/admin/system-actions-panel";
import { SystemDatabaseMetrics } from "@/components/admin/system-database-metrics";
import { SystemServiceStatus } from "@/components/admin/system-service-status";
import { SectionHeader } from "@/components/section-header";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_protected/admin/system")({
  component: SystemHealth,
});

function SystemHealth() {
  const { user, isAdmin } = useUser();
  const navigate = useNavigate();

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SystemServiceStatus />
        <SystemActionsPanel />
        <div className="lg:col-span-2">
          <SystemDatabaseMetrics />
        </div>
      </div>
    </>
  );
}
