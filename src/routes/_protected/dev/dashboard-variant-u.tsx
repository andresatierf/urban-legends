import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-u")({
  component: DashboardVariantUPage,
});

function DashboardVariantUPage() {
  return <DashboardVariantDemo variant="u" />;
}
