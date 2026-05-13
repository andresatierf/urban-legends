import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-a2")({
  component: DashboardVariantA2Page,
});

function DashboardVariantA2Page() {
  return <DashboardVariantDemo variant="a2" />;
}
