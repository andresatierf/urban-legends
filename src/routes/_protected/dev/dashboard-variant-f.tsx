import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-f")({
  component: DashboardVariantFPage,
});

function DashboardVariantFPage() {
  return <DashboardVariantDemo variant="f" />;
}
