import { SystemActionsPanelView } from "@/components/admin/system-actions-panel-view";
import { SystemDatabaseMetricsView } from "@/components/admin/system-database-metrics-view";
import type {
  ServiceStatusMap,
  SystemMetrics,
} from "@/components/admin/system-panel-types";
import { SystemServiceStatusView } from "@/components/admin/system-service-status-view";
import { SectionHeader } from "@/components/section-header";

import { Specimen } from "./shells/specimen";

const HEALTHY_SERVICES: ServiceStatusMap = {
  convex: "healthy",
  clerk: "healthy",
  database: "healthy",
};

const DEGRADED_SERVICES: ServiceStatusMap = {
  convex: "healthy",
  clerk: "unhealthy",
  database: "healthy",
};

const CLEAN_METRICS: SystemMetrics = {
  tournaments: { total: 12, orphaned: 0 },
  teams: { total: 48, orphaned: 0 },
  submissions: { total: 612, orphaned: 0 },
  users: { total: 134, orphaned: 0 },
  teamMembers: { total: 192, orphaned: 0 },
};

const DIRTY_METRICS: SystemMetrics = {
  tournaments: { total: 12, orphaned: 0 },
  teams: { total: 48, orphaned: 3 },
  submissions: { total: 612, orphaned: 17 },
  users: { total: 134, orphaned: 0 },
  teamMembers: { total: 192, orphaned: 5 },
};

const EMPTY_METRICS: SystemMetrics = {
  tournaments: { total: 0, orphaned: 0 },
  teams: { total: 0, orphaned: 0 },
  submissions: { total: 0, orphaned: 0 },
  users: { total: 0, orphaned: 0 },
  teamMembers: { total: 0, orphaned: 0 },
};

export function SystemPanelsSpecimens() {
  return (
    <div className="space-y-16">
      <ServiceStatusSpecimen />
      <ActionsSpecimen />
      <DatabaseMetricsSpecimen />
    </div>
  );
}

function ServiceStatusSpecimen() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="SystemServiceStatus"
        description="Health-check rollup for the platform's external services."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Specimen label="All healthy">
          <SystemServiceStatusView services={HEALTHY_SERVICES} />
        </Specimen>
        <Specimen
          label="Mixed health"
          description="One service unhealthy — surfaces the error badge."
        >
          <SystemServiceStatusView services={DEGRADED_SERVICES} />
        </Specimen>
      </div>
    </section>
  );
}

function ActionsSpecimen() {
  const noop = () => {};
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h2"
        title="SystemActionsPanel"
        description="Danger-zone admin actions. View is pure — wired handlers + loading flags only."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Specimen label="Idle">
          <SystemActionsPanelView
            isCheckingIntegrity={false}
            isCleaningUp={false}
            onIntegrityCheck={noop}
            onCleanup={noop}
          />
        </Specimen>
        <Specimen
          label="Integrity check running"
          description="Disables and re-labels the integrity-check button."
        >
          <SystemActionsPanelView
            isCheckingIntegrity={true}
            isCleaningUp={false}
            onIntegrityCheck={noop}
            onCleanup={noop}
          />
        </Specimen>
        <Specimen
          label="Cleanup running"
          description="Disables and re-labels the cleanup button."
        >
          <SystemActionsPanelView
            isCheckingIntegrity={false}
            isCleaningUp={true}
            onIntegrityCheck={noop}
            onCleanup={noop}
          />
        </Specimen>
      </div>
    </section>
  );
}

function DatabaseMetricsSpecimen() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h2"
        title="SystemDatabaseMetrics"
        description="Per-collection totals with an orphan-count badge when integrity drifts."
      />
      <div className="space-y-6">
        <Specimen label="Clean dataset">
          <SystemDatabaseMetricsView databaseMetrics={CLEAN_METRICS} />
        </Specimen>
        <Specimen
          label="Orphans detected"
          description="Several collections report orphaned records — error badges show counts."
        >
          <SystemDatabaseMetricsView databaseMetrics={DIRTY_METRICS} />
        </Specimen>
        <Specimen label="Empty system">
          <SystemDatabaseMetricsView databaseMetrics={EMPTY_METRICS} />
        </Specimen>
      </div>
    </section>
  );
}
