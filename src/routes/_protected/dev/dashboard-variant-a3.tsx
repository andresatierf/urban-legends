import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-a3")({
  component: DashboardVariantA3Page,
});

function DashboardVariantA3Page() {
  return <DashboardVariantDemo variant="a3" />;
}
