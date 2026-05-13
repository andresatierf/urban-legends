import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-m")({
  component: DashboardVariantMPage,
});

function DashboardVariantMPage() {
  return <DashboardVariantDemo variant="m" />;
}
