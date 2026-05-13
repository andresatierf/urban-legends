import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-a1")({
  component: DashboardVariantA1Page,
});

function DashboardVariantA1Page() {
  return <DashboardVariantDemo variant="a1" />;
}
