import { createFileRoute } from "@tanstack/react-router";
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return <UnifiedDashboard />;
}
